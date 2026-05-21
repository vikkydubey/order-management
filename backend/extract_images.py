import io
import re
import sqlite3
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image


def is_article_code(token):
    return bool(re.fullmatch(r"\d{4,6}", token or ""))


def line_key(y):
    return round(float(y) / 2.0) * 2


pdf_path = Path(__file__).parent.parent / "New Order sheet With Price Editable sheet_Nov'25(18).pdf"
db_path = Path(__file__).parent / "orders.db"
uploads_dir = Path(__file__).parent / "uploads"
uploads_dir.mkdir(exist_ok=True)

print("🖼️ Remapping product images by article row...\n")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

pdf = fitz.open(str(pdf_path))
print(f"✓ PDF opened: {len(pdf)} pages\n")

# Cache for saved image files by xref so repeated references don't duplicate files.
xref_to_file = {}
code_to_image = {}

for page_idx in range(len(pdf)):
    page = pdf[page_idx]

    # Collect image placements (rectangles on page) keyed by xref.
    placed_images = []
    for img_info in page.get_images(full=True):
        xref = img_info[0]
        rects = page.get_image_rects(xref)
        for rect in rects:
            placed_images.append((xref, rect))

    if not placed_images:
        continue

    # Build text lines from words.
    lines = {}
    for w in page.get_text("words"):
        x0, y0, x1, y1, text = w[0], w[1], w[2], w[3], w[4]
        lk = line_key(y0)
        lines.setdefault(lk, []).append((x0, y0, x1, y1, text))

    for lk in sorted(lines.keys()):
        words = sorted(lines[lk], key=lambda t: t[0])
        if not words:
            continue

        first_token = words[0][4].strip()
        if not is_article_code(first_token):
            continue

        row_y = sum((w[1] + w[3]) / 2.0 for w in words) / len(words)

        # Select best image on this row by vertical overlap / distance.
        best_xref = None
        best_score = 10**9
        for xref, rect in placed_images:
            if rect.height < 20 or rect.width < 20:
                continue
            rect_mid_y = (rect.y0 + rect.y1) / 2.0
            dy = abs(rect_mid_y - row_y)

            # Prefer images near middle columns used for thumbnails.
            col_penalty = 0 if 120 <= rect.x0 <= 420 else 50
            score = dy + col_penalty

            if score < best_score:
                best_score = score
                best_xref = xref

        if best_xref is None:
            continue

        if best_xref not in xref_to_file:
            base = pdf.extract_image(best_xref)
            img_bytes = base["image"]
            ext = base.get("ext", "png")
            out_name = f"img_xref_{best_xref}.{ext}"

            # Normalize to png for browser consistency.
            try:
                im = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                out_name = f"img_xref_{best_xref}.png"
                im.save(uploads_dir / out_name, "PNG")
            except Exception:
                with open(uploads_dir / out_name, "wb") as f:
                    f.write(img_bytes)

            xref_to_file[best_xref] = out_name

        code_to_image[first_token] = xref_to_file[best_xref]

    if (page_idx + 1) % 10 == 0:
        print(f"  Processed page {page_idx + 1}: mapped {len(code_to_image)} article codes")

print(f"\n✅ Mapped {len(code_to_image)} article codes to images")

# Update DB by article code prefix in item name.
cursor.execute("SELECT id, name FROM items")
rows = cursor.fetchall()
updated = 0
missing = 0

for item_id, name in rows:
    m = re.match(r"\s*(\d{4,6})\b", name or "")
    if not m:
        missing += 1
        continue
    code = m.group(1)
    file_name = code_to_image.get(code)
    if not file_name:
        missing += 1
        continue

    image_url = f"/uploads/{file_name}"
    cursor.execute("UPDATE items SET image_path = ? WHERE id = ?", (image_url, item_id))
    updated += 1

conn.commit()

cursor.execute("SELECT COUNT(*) FROM items")
total_items = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM items WHERE image_path IS NOT NULL")
with_img = cursor.fetchone()[0]

print(f"✓ Updated item images: {updated}")
print(f"• Missing mapping: {missing}")
print(f"• Items with images now: {with_img} / {total_items}")

pdf.close()
conn.close()
print("\n🌐 Refresh the site to verify image corrections.")

