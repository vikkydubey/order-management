import express from 'express';
import { getDatabase } from '../database.js';

const router = express.Router();

// Create Order
router.post('/create', async (req, res) => {
  const { customer_name, customer_email, customer_phone, items, notes } = req.body;
  const db = getDatabase();
  
  try {
    // Calculate total price
    let total_price = 0;
    for (const item of items) {
      total_price += item.price * item.quantity;
    }
    
    // Insert order
    const orderResult = await db.run(
      'INSERT INTO orders (customer_name, customer_email, customer_phone, total_price, notes) VALUES (?, ?, ?, ?, ?)',
      [customer_name, customer_email, customer_phone, total_price, notes]
    );
    
    const orderId = orderResult.lastID;
    
    // Insert order items
    for (const item of items) {
      await db.run(
        'INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.id, item.quantity, item.price]
      );
    }
    
    res.json({ 
      id: orderId, 
      customer_name, 
      customer_email, 
      customer_phone, 
      total_price, 
      status: 'pending',
      items 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders (for admin)
router.get('/all', async (req, res) => {
  const db = getDatabase();
  
  try {
    const orders = await db.all(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  try {
    const order = await db.get(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const items = await db.all(`
      SELECT oi.*, i.name, i.image_path, c.name as category_name 
      FROM order_items oi 
      JOIN items i ON oi.item_id = i.id 
      LEFT JOIN categories c ON i.category_id = c.id 
      WHERE oi.order_id = ?
    `, [id]);
    
    res.json({ ...order, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDatabase();
  
  try {
    await db.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  try {
    await db.run('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
