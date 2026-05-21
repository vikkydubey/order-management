import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from '../database.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Add Category
router.post('/categories', async (req, res) => {
  const { name, description } = req.body;
  const db = getDatabase();
  
  try {
    const result = await db.run(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description]
    );
    res.json({ id: result.lastID, name, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  const db = getDatabase();
  try {
    const categories = await db.all('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Category
router.put('/categories/:id', async (req, res) => {
  const { name, description } = req.body;
  const { id } = req.params;
  const db = getDatabase();
  
  try {
    await db.run(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );
    res.json({ id, name, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Category
router.delete('/categories/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  try {
    await db.run('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Item with image
router.post('/items', upload.single('image'), async (req, res) => {
  const { name, price, category_id, description } = req.body;
  const image_path = req.file ? `/uploads/${req.file.filename}` : null;
  const db = getDatabase();
  
  try {
    const result = await db.run(
      'INSERT INTO items (category_id, name, price, image_path, description) VALUES (?, ?, ?, ?, ?)',
      [category_id, name, price, image_path, description]
    );
    res.json({ 
      id: result.lastID, 
      category_id, 
      name, 
      price, 
      image_path, 
      description 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all items
router.get('/items', async (req, res) => {
  const db = getDatabase();
  try {
    const items = await db.all(`
      SELECT i.*, c.name as category_name 
      FROM items i 
      LEFT JOIN categories c ON i.category_id = c.id 
      ORDER BY c.name, i.name
    `);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Item
router.put('/items/:id', upload.single('image'), async (req, res) => {
  const { name, price, category_id, description } = req.body;
  const { id } = req.params;
  const db = getDatabase();
  
  try {
    let updateQuery = 'UPDATE items SET name = ?, price = ?, category_id = ?, description = ?';
    let params = [name, price, category_id, description];
    
    if (req.file) {
      updateQuery += ', image_path = ?';
      params.push(`/uploads/${req.file.filename}`);
    }
    
    updateQuery += ' WHERE id = ?';
    params.push(id);
    
    await db.run(updateQuery, params);
    res.json({ id, name, price, category_id, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Item
router.delete('/items/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  try {
    await db.run('DELETE FROM items WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all customers
router.get('/customers', async (req, res) => {
  const db = getDatabase();
  try {
    const customers = await db.all('SELECT id, name, email, phone FROM customers ORDER BY name');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add customer
router.post('/customers', async (req, res) => {
  const { name, email, phone } = req.body;
  const db = getDatabase();
  
  try {
    const result = await db.run(
      'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone]
    );
    res.json({ 
      id: result.lastID, 
      name, 
      email, 
      phone 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete customer
router.delete('/customers/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  try {
    await db.run('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
