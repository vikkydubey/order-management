# Quick Start Guide

## Fastest Way to Get Running

Open **two separate terminals** and run these commands:

### Terminal 1 - Backend
```bash
cd c:\Projects\OrderManagement\backend
npm install
npm start
```

Expected output:
```
Server running on http://localhost:3001
Database initialized successfully
```

### Terminal 2 - Frontend
```bash
cd c:\Projects\OrderManagement\frontend
npm install
npm run dev
```

Expected output:
```
Local:    http://localhost:3000
```

## Then
1. Open browser and go to `http://localhost:3000`
2. Click **Admin Panel** 
3. Add a **Category** (e.g., "Rice and Flour")
4. Add **Items** to that category (upload images if you have them)
5. Click **Place Order** to test the ordering form

## Important Notes

- Backend must be running on port 3001
- Frontend connects to backend automatically (dev server proxy)
- Database is automatically created: `backend/orders.db`
- Uploaded images are stored in: `backend/uploads/`

## If You Get Errors

1. **"Port already in use"**: Change port in `frontend/vite.config.js` or close other apps
2. **"npm not found"**: Install Node.js from nodejs.org
3. **"module not found"**: Run `npm install` again
4. **CORS errors**: Make sure backend is running before frontend

## Extract PDF Data

To populate from your PDF:
1. Open the PDF: `New Order sheet With Price Editable sheet_Nov'25(18).pdf`
2. Copy categories and items
3. Add them through the Admin Panel manually

Or use Python to extract:
```bash
pip install pdfplumber
python
```
Then:
```python
import pdfplumber
with pdfplumber.open('New Order sheet With Price Editable sheet_Nov\'25(18).pdf') as pdf:
    for page in pdf.pages:
        print(page.extract_text())
```
