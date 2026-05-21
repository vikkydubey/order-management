# PDF Data Extraction Helper

Your PDF file is located at:
`New Order sheet With Price Editable sheet_Nov'25(18).pdf`

## Option 1: Manual Entry (Easiest)

1. Open the PDF in your PDF viewer
2. Read through the categories and items
3. Go to the website (http://localhost:3000)
4. Click "Admin Panel"
5. Enter categories and items manually
6. This takes 5-10 minutes and lets you control organization

## Option 2: Python Script (Automatic)

If you prefer to extract data programmatically:

### Install Required Tools
```bash
pip install pdfplumber
```

### Create a Python script to extract:

```python
import pdfplumber

pdf_path = 'New Order sheet With Price Editable sheet_Nov\'25(18).pdf'

with pdfplumber.open(pdf_path) as pdf:
    for page_num, page in enumerate(pdf.pages, 1):
        print(f"\n--- PAGE {page_num} ---")
        text = page.extract_text()
        print(text)
        
        # Extract tables if present
        tables = page.extract_tables()
        if tables:
            for table in tables:
                print("\nTable found:")
                for row in table:
                    print(row)
```

### Run it:
```bash
python extract_pdf.py > pdf_data.txt
```

This creates a `pdf_data.txt` file with all content from the PDF.

## Option 3: Use Online Tool

- Go to: https://pdf.co/free/pdf-to-text
- Upload your PDF
- Get structured text
- Copy categories and items

## What to Look For

When reading the PDF, extract:

**Categories:**
- Rice and Flour
- (other categories in your PDF)

**Items under each category:**
- Item Name
- Price
- Any description

**Example format:**
```
Category: Rice and Flour
  - Basmati Rice - $500
  - Brown Rice - $400
  - Wheat Flour - $300
```

## Then Enter in Admin Panel

Once you have the data:

1. Go to http://localhost:3000 → Admin Panel
2. Go to "Categories" tab
3. Add each category (Rice and Flour, etc.)
4. Go to "Items" tab
5. For each item:
   - Name: [item name]
   - Price: [price]
   - Category: [select category]
   - Description: [optional notes]
   - Image: [upload product photo if you have it]
6. Click "Add Item"

---

**Tip:** If you have product photos, upload them alongside items for a better customer experience!
