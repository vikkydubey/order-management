import pdfplumber
import sqlite3
import re
from pathlib import Path

# Path to PDF
pdf_path = Path(__file__).parent.parent / "New Order sheet With Price Editable sheet_Nov'25(18).pdf"

# Connect to database
db_path = Path(__file__).parent / 'orders.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Clear existing data to avoid duplicates
print("🗑️  Clearing existing categories and items...")
cursor.execute('DELETE FROM items')
cursor.execute('DELETE FROM categories')
conn.commit()

print("📄 Extracting data from PDF...")
print(f"PDF: {pdf_path}\n")

categories_map = {}  # Map of category_name -> category_id
current_category = None
current_category_id = None
products_added = 0

try:
    with pdfplumber.open(pdf_path) as pdf:
        all_text = ""
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                all_text += text + "\n"
        
        lines = all_text.split('\n')
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            i += 1
            
            if not line or len(line) < 2:
                continue
            
            # Detect category headers: Pattern like "07 - OTHERS" or "01 - RICE"
            # These are typically on their own line
            category_match = re.match(r'^(\d{1,2})\s*-\s*(.+?)$', line)
            if category_match:
                category_name = category_match.group(2).strip()
                print(f"📂 Found category: {category_name}")
                
                # Check if category exists, if not create it
                if category_name not in categories_map:
                    cursor.execute('INSERT INTO categories (name) VALUES (?)', (category_name,))
                    conn.commit()
                    cursor.execute('SELECT id FROM categories WHERE name = ?', (category_name,))
                    cat_id = cursor.fetchone()[0]
                    categories_map[category_name] = cat_id
                
                current_category = category_name
                current_category_id = categories_map[category_name]
                continue
            
            # Detect products: Lines with £ symbol and article code pattern
            if '£' in line and current_category_id:
                match = re.search(r'^(\d{5,6})\s+(.+?)\s+£([\d,.]+)$', line)
                if match:
                    article_code = match.group(1)
                    item_desc = match.group(2).strip()
                    price_str = match.group(3).strip().replace(',', '')
                    
                    try:
                        price = float(price_str)
                        
                        # Look ahead for pack/size descriptor on next line
                        j = i
                        while j < len(lines):
                            next_line = lines[j].strip()
                            j += 1
                            if not next_line:
                                continue  # skip blanks
                            
                            # Stop if it's another product line or header
                            if (
                                '£' in next_line
                                or re.match(r'^\d{5,6}\s', next_line)
                                or re.match(r'^\d{1,2}\s*-\s*', next_line)
                                or next_line.lower().startswith('page ')
                                or next_line.lower().startswith('article')
                            ):
                                break
                            
                            # It's a size/pack descriptor — append and advance
                            item_desc = item_desc + ' ' + next_line
                            i = j
                            break
                        
                        # Build full item name with article code
                        full_name = f"{article_code} {item_desc}"
                        
                        # Try to find corresponding image file
                        image_path = None
                        uploads_dir = Path(__file__).parent / "uploads"
                        
                        # Look for img_xref_*.png files that match this article code
                        # First check if we have a direct mapping file
                        for img_file in uploads_dir.glob(f"img_*_{article_code}.png"):
                            image_path = f"/uploads/{img_file.name}"
                            break
                        
                        # If no direct match, look for img_xref_*.png files in order
                        if not image_path and uploads_dir.exists():
                            img_files = sorted(uploads_dir.glob("img_xref_*.png"))
                            if img_files:
                                # Use first available image as fallback
                                image_path = f"/uploads/{img_files[0].name}"
                        
                        # Insert into database
                        cursor.execute(
                            'INSERT INTO items (category_id, name, price, description, image_path) VALUES (?, ?, ?, ?, ?)',
                            (current_category_id, full_name, price, item_desc, image_path)
                        )
                        products_added += 1
                        
                    except ValueError:
                        pass  # Skip if price conversion fails

    if products_added > 0:
        conn.commit()

    # Print summary
    cursor.execute('SELECT id, name FROM categories ORDER BY id')
    cats = cursor.fetchall()
    print(f"\n✅ Data import complete!\n")
    print("📊 Summary by category:")
    for cat_id, cat_name in cats:
        cursor.execute('SELECT COUNT(*) FROM items WHERE category_id = ?', (cat_id,))
        count = cursor.fetchone()[0]
        print(f"   {cat_name}: {count} items")
    
    cursor.execute('SELECT COUNT(*) FROM items')
    total = cursor.fetchone()[0]
    print(f"\n   Total products: {total}")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

finally:
    conn.close()
