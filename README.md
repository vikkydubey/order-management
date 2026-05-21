# Order Management System

A full-stack web application for managing orders with separate personas for customers and administrators. Built with React, Node.js, Express, and SQLite.

## Features

### Customer (Order Form)
- Browse items organized by categories
- View item images, prices, and descriptions
- Add items to order with quantities
- Enter customer information (name, email, phone)
- Add special notes to order
- Submit orders
- See order summary with total price

### Admin Panel
- **Orders Management**: View all orders, check order details, update order status, delete orders
- **Categories Management**: Add/delete product categories
- **Items Management**: Add items with images, prices, descriptions; Organize items by category

## Project Structure

```
OrderManagement/
├── backend/
│   ├── server.js                 # Express server entry point
│   ├── package.json              # Backend dependencies
│   ├── database.js               # SQLite database setup
│   ├── uploads/                  # Directory for uploaded images
│   └── routes/
│       ├── admin.js              # Admin management endpoints
│       ├── items.js              # Items listing endpoints
│       └── orders.js             # Order CRUD endpoints
├── frontend/
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.js            # Vite configuration
│   ├── index.html                # HTML entry point
│   └── src/
│       ├── main.jsx              # React entry point
│       ├── App.jsx               # Main app component
│       ├── components/           # Reusable components
│       │   └── Navigation.jsx
│       └── pages/                # Page components
│           ├── OrderForm.jsx     # Customer order form
│           ├── AdminPanel.jsx    # Admin dashboard
│           └── OrderDetail.jsx   # Order details view
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm start
```

The server will run on `http://localhost:3001`

### Frontend Setup

1. In a new terminal, navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

### Customer
1. Go to `http://localhost:3000`
2. You'll see a "Place Order" page with all available categories and items
3. Select quantities for items you want to order
4. Enter your name, email, and phone number
5. Add any special notes if needed
6. Click "Submit Order"

### Admin
1. Go to `http://localhost:3000` and click "Admin Panel"
2. Three tabs available:

#### Orders Tab
- View all submitted orders
- Click "View" to see detailed order information
- Update order status (pending, processing, completed, cancelled)
- Delete orders if needed

#### Categories Tab
- Add new categories for products
- Delete existing categories (removes associated items too)

#### Items Tab
- Add new items with name, price, category, description, and image
- Upload product images
- Delete items

## API Endpoints

### Admin Routes (`/api/admin`)
- `POST /categories` - Create category
- `GET /categories` - Get all categories
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category
- `POST /items` - Create item (with file upload)
- `GET /items` - Get all items
- `PUT /items/:id` - Update item
- `DELETE /items/:id` - Delete item

### Items Routes (`/api/items`)
- `GET /all` - Get all items grouped by category
- `GET /category/:categoryId` - Get items by category

### Orders Routes (`/api/orders`)
- `POST /create` - Create order
- `GET /all` - Get all orders
- `GET /:id` - Get order details
- `PUT /:id/status` - Update order status
- `DELETE /:id` - Delete order

## Database Schema

### Categories Table
- id: INT PRIMARY KEY
- name: TEXT
- description: TEXT
- created_at: DATETIME

### Items Table
- id: INT PRIMARY KEY
- category_id: INT (Foreign Key)
- name: TEXT
- price: REAL
- image_path: TEXT
- description: TEXT
- created_at: DATETIME

### Orders Table
- id: INT PRIMARY KEY
- customer_name: TEXT
- customer_email: TEXT
- customer_phone: TEXT
- total_price: REAL
- status: TEXT (pending, processing, completed, cancelled)
- notes: TEXT
- created_at: DATETIME
- updated_at: DATETIME

### Order Items Table
- id: INT PRIMARY KEY
- order_id: INT (Foreign Key)
- item_id: INT (Foreign Key)
- quantity: INT
- price: REAL

## Next Steps for Deployment

### For Online Deployment:

1. **Prepare Backend for Production:**
   - Use environment variables for configuration
   - Set up proper error handling
   - Use a production database (PostgreSQL recommended)
   - Add authentication if needed

2. **Build Frontend:**
   ```bash
   npm run build
   ```
   This creates an optimized build in the `dist` folder

3. **Use a Hosting Service:**
   - **Frontend**: Vercel, Netlify, or GitHub Pages
   - **Backend**: Railway, Heroku, or DigitalOcean
   - **Database**: PostgreSQL on managed service

4. **Set Environment Variables:**
   - Backend: DATABASE_URL, PORT, etc.
   - Frontend: API_URL (pointing to deployed backend)

5. **Enable HTTPS** for secure data transmission

## Tips

- Use the PDF order sheet to extract categories and items data
- Add product images through the admin panel
- Regularly backup your database (orders.db)
- Test the system locally before deploying

## Support

For issues or questions, check:
1. Backend console for server errors
2. Browser console (F12) for frontend errors
3. Network tab to check API calls

---

Happy ordering! 📦
