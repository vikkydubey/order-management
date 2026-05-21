import pdfplumber
from pathlib import Path

pdf_path = Path(__file__).parent.parent / "New Order sheet With Price Editable sheet_Nov'25(18).pdf"

with pdfplumber.open(str(pdf_path)) as pdf:
    for page_num, page in enumerate(pdf.pages, 1):
        text = page.extract_text()
        if text and 'KASOORI' in text:
            print(f'-- PAGE {page_num} --')
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if 'KASOORI' in line or 'METHI' in line:
                    # print context around it
                    start = max(0, i-1)
                    end = min(len(lines), i+3)
                    for l in lines[start:end]:
                        print(repr(l))
                    print()
