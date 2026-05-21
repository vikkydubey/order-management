/**
 * Seeds the database with data from seed_data.json.
 * Only runs if the categories table is empty (safe to run on every startup).
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getDatabase } from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function seedDatabase() {
  try {
    const seedFile = path.join(__dirname, 'seed_data.json');
    if (!fs.existsSync(seedFile)) {
      console.log('No seed_data.json found, skipping seed.');
      return;
    }

    const db = getDatabase();
    if (!db) {
      console.error('Seed: database not initialized');
      return;
    }

    const existing = await db.get('SELECT COUNT(*) as count FROM categories');
    if (existing.count > 0) {
      console.log(`Seed skipped: database already has ${existing.count} categories.`);
      return;
    }

    const { categories, items, customers, orders, orderItems } = JSON.parse(
      fs.readFileSync(seedFile, 'utf8')
    );

    console.log(`Seeding database: ${categories.length} categories, ${items.length} items...`);

  // Insert categories (preserve original IDs)
  for (const c of categories) {
    await db.run(
      'INSERT OR IGNORE INTO categories (id, name, description, created_at) VALUES (?, ?, ?, ?)',
      [c.id, c.name, c.description, c.created_at]
    );
  }

  // Insert items (preserve original IDs)
  for (const item of items) {
    await db.run(
      'INSERT OR IGNORE INTO items (id, category_id, name, price, image_path, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [item.id, item.category_id, item.name, item.price, item.image_path, item.description, item.created_at]
    );
  }

  // Insert customers
  for (const c of customers) {
    await db.run(
      'INSERT OR IGNORE INTO customers (id, name, email, phone, created_at) VALUES (?, ?, ?, ?, ?)',
      [c.id, c.name, c.email, c.phone, c.created_at]
    );
  }

  // Insert orders
  for (const o of orders) {
    await db.run(
      'INSERT OR IGNORE INTO orders (id, customer_name, customer_email, customer_phone, total_price, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [o.id, o.customer_name, o.customer_email, o.customer_phone, o.total_price, o.status, o.notes, o.created_at, o.updated_at]
    );
  }

  // Insert order items
  for (const oi of orderItems) {
    await db.run(
      'INSERT OR IGNORE INTO order_items (id, order_id, item_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
      [oi.id, oi.order_id, oi.item_id, oi.quantity, oi.price]
    );
  }

    console.log(`Seeded: ${categories.length} categories, ${items.length} items, ${orders.length} orders`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    // Non-fatal — server continues without seed data
  }
}
