import express from 'express';
import { getDatabase } from '../database.js';

const router = express.Router();

// Get all items grouped by category
router.get('/all', async (req, res) => {
  const db = getDatabase();
  try {
    const categories = await db.all('SELECT * FROM categories ORDER BY name');
    
    const itemsByCategory = await Promise.all(
      categories.map(async (category) => {
        const items = await db.all(
          'SELECT * FROM items WHERE category_id = ? ORDER BY name',
          [category.id]
        );
        return { ...category, items };
      })
    );
    
    res.json(itemsByCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get items by category
router.get('/category/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  const db = getDatabase();
  
  try {
    const items = await db.all(
      'SELECT * FROM items WHERE category_id = ? ORDER BY name',
      [categoryId]
    );
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
