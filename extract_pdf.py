"""
Extract categories, items, prices, and images from the Pandit Foods catalog PDF.
Outputs: pdf_catalog.json + images saved to backend/uploads/
"""
import fitz  # PyMuPDF
import json
import re
import os

PDF_PATH = os.path.join(os.path.dirname(__file__), "PANDIT UK NEW (7).pdf")
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "backend", "uploads")
OUTPUT_JSON = os.path.join(os.path.dirname(__file__), "pdf_catalog.json")


def clean(s):
    return re.sub(r'\s+', ' ', s.replace('\n', ' ')).strip()


def extract_price(text):
    m = re.search(r'[£\xa3]\s*([\d.]+)', text)
    if m:
        return float(m.group(1))
    return None


def extract_name_prefix(text):
    """
    From a combined 'Name 240gm | 1x20 | £2.50' block, return just the name part.
    Splits at weight/volume markers: gm, ml, g, kg, ltr.
    """
    m = re.match(r'^(.+?)\s+\d+\s*(gm|ml|g|kg|ltr)\b', text, re.IGNORECASE)
    if m and len(m.group(1).strip()) > 2:
        return clean(m.group(1))
    if ' | ' in text:
        parts = text.split(' | ')
        candidate = parts[0].strip()
        # Skip if it's a size string like "240gm" (starts with digit)
        if (len(candidate) > 2
                and not re.search(r'[£\xa3]', candidate)
                and not re.match(r'^\d', candidate)):
            return candidate
    return None


def main():
    print(f"Opening PDF: {PDF_PATH}")
    doc = fitz.open(PDF_PATH)
    print(f"Total pages: {doc.page_count}")
    os.makedirs(UPLOADS_DIR, exist_ok=True)

    # First pass: count how many pages each image xref appears on
    xref_page_count = {}
    for pn in range(doc.page_count):
        seen_on_page = set()
        for img in doc[pn].get_images(full=True):
            xref = img[0]
            if xref not in seen_on_page:
                xref_page_count[xref] = xref_page_count.get(xref, 0) + 1
                seen_on_page.add(xref)

    LOGO_THRESHOLD = 5
    recurring_xrefs = {xref for xref, count in xref_page_count.items() if count >= LOGO_THRESHOLD}
    print(f"Recurring images filtered out: {len(recurring_xrefs)} xrefs (logos/watermarks)")

    catalog = []
    current_category = None
    current_items = []

    def flush_category():
        nonlocal current_category, current_items
        if current_category and current_items:
            seen = {}
            deduped = []
            for item in current_items:
                key = (item['name'].lower(), item['price'])
                if key not in seen:
                    seen[key] = True
                    deduped.append(item)
            catalog.append({"category": current_category, "items": deduped})
        current_category = None
        current_items = []

    for page_num in range(doc.page_count):
        page = doc[page_num]
        page_rect = page.rect
        page_width = page_rect.width

        # --- Category header: use block-level text (topmost non-price block) ---
        blocks = page.get_text("blocks")
        page_category = None
        for b in blocks:
            if b[6] == 0:
                txt = clean(b[4])
                if txt and b[1] < 120 and len(txt) > 2 and not extract_price(txt):
                    page_category = txt
                    break

        if page_category and page_category != current_category:
            flush_category()
            current_category = page_category

        # --- Extract product images (filtering logos, headers, backgrounds) ---
        image_list = page.get_images(full=True)
        page_images = []
        for img_index, img in enumerate(image_list):
            xref = img[0]
            if xref in recurring_xrefs:
                continue
            try:
                base_image = doc.extract_image(xref)
                img_bytes = base_image["image"]
                img_ext = base_image["ext"]
                if len(img_bytes) < 5000:
                    continue
                img_filename = f"img_pdf_p{page_num+1}_i{img_index}.{img_ext}"
                img_path = os.path.join(UPLOADS_DIR, img_filename)
                if not os.path.exists(img_path):
                    with open(img_path, "wb") as f:
                        f.write(img_bytes)
                rects = page.get_image_rects(xref)
                img_rect = rects[0] if rects else None
                if img_rect is None:
                    continue
                if img_rect.y0 < 80:
                    continue
                if (img_rect.x1 - img_rect.x0) > page_width * 0.7:
                    continue
                page_images.append({
                    "filename": img_filename,
                    "rect": [img_rect.x0, img_rect.y0, img_rect.x1, img_rect.y1],
                    "size": len(img_bytes)
                })
            except Exception:
                pass

        # --- Word-level text for precise column matching ---
        raw_words = page.get_text("words")
        # Filter to body area (below header)
        body_words = [(x0, y0, x1, y1, txt) for x0, y0, x1, y1, txt, *_ in raw_words if y0 >= 100]

        items_this_page = match_images_to_words(page_images, body_words)
        current_items.extend(items_this_page)

    flush_category()

    print(f"\nTotal categories: {len(catalog)}")
    total_items = sum(len(c['items']) for c in catalog)
    print(f"Total items: {total_items}")

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)
    print(f"Saved to {OUTPUT_JSON}")

    for cat in catalog:
        print(f"\n{'='*50}")
        print(f"  {cat['category']} ({len(cat['items'])} items)")
        for item in cat['items']:
            print(f"    - {item['name']:<55} £{item['price']}")


def match_images_to_words(images, body_words):
    """
    Match each product image to the text below it using word-level coordinates.
    Words are matched by column overlap with the image (not center distance),
    which correctly handles multi-column layouts where block-level text mixes columns.
    """
    items = []
    used_word_indices = set()

    images_sorted = sorted(
        images,
        key=lambda i: (round(i['rect'][1] / 50) * 50, i['rect'][0])
    )

    indexed_words = list(enumerate(body_words))

    for img in images_sorted:
        ix0, iy0, ix1, iy1 = img['rect']
        H_MARGIN = 35  # allow slight overhang on each side

        # Collect words below this image that fall within its column
        col_words = []
        for wi, (wx0, wy0, wx1, wy1, wtxt) in indexed_words:
            if wi in used_word_indices:
                continue
            if wy0 < iy1 - 20:
                continue
            if wy0 > iy1 + 350:
                continue
            # Column match: word must horizontally overlap with image
            if wx1 < ix0 - H_MARGIN or wx0 > ix1 + H_MARGIN:
                continue
            col_words.append((wy0, wx0, wi, wtxt))

        if not col_words:
            continue

        col_words.sort()  # sort by y, then x

        # Group words into lines (words within 6px of each other in y)
        lines = []
        current_line_words = []
        current_y = None
        for wy0, wx0, wi, wtxt in col_words:
            if current_y is None or abs(wy0 - current_y) <= 6:
                current_line_words.append((wx0, wi, wtxt))
                current_y = wy0
            else:
                lines.append(sorted(current_line_words))  # sort by x for reading order
                current_line_words = [(wx0, wi, wtxt)]
                current_y = wy0
        if current_line_words:
            lines.append(sorted(current_line_words))

        # Extract name and price from lines
        name_parts = []
        price = None
        description = ''
        last_line_y_approx = None

        for line_idx, line in enumerate(lines[:6]):
            line_text = ' '.join(w for _, _, w in line)
            p = extract_price(line_text)

            if p is not None:
                prefix = extract_name_prefix(line_text)
                if prefix:
                    name_parts.append(prefix)
                price = p
                description = line_text
                for _, wi, _ in line:
                    used_word_indices.add(wi)
                break
            else:
                # Stop collecting name if we already have 2 lines
                if len(name_parts) >= 2:
                    break
                name_parts.append(line_text)
                for _, wi, _ in line:
                    used_word_indices.add(wi)

        if name_parts and price is not None:
            name = ' '.join(name_parts)
            items.append({
                "name": name,
                "description": description,
                "price": price,
                "image_path": img['filename']
            })

    return items


if __name__ == "__main__":
    main()
