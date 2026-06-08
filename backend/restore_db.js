import fs from 'fs';
import path from 'path';
import { initializeDatabase, getDatabase } from './database.js';

const inputPath = process.argv[2];

if (!inputPath) {
  console.error('Usage: node restore_db.js <path-to-backup.json>');
  process.exit(1);
}

function ensureArray(value, key) {
  if (!Array.isArray(value)) {
    throw new Error(`Backup is missing array for: ${key}`);
  }
  return value;
}

async function restoreDatabase() {
  const resolvedPath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Backup file not found: ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const parsed = JSON.parse(raw);
  const data = parsed.data || parsed;

  const categories = ensureArray(data.categories, 'categories');
  const items = ensureArray(data.items, 'items');
  const customers = ensureArray(data.customers, 'customers');
  const orders = ensureArray(data.orders, 'orders');
  const orderItems = ensureArray(data.order_items, 'order_items');

  await initializeDatabase();
  const db = getDatabase();

  await db.exec('BEGIN');
  try {
    // Delete children first to satisfy foreign key constraints.
    await db.run('DELETE FROM order_items');
    await db.run('DELETE FROM orders');
    await db.run('DELETE FROM items');
    await db.run('DELETE FROM customers');
    await db.run('DELETE FROM categories');

    for (const c of categories) {
      await db.run(
        'INSERT INTO categories (id, name, description, created_at) VALUES (?, ?, ?, ?)',
        [c.id, c.name, c.description ?? null, c.created_at ?? null]
      );
    }

    for (const i of items) {
      await db.run(
        'INSERT INTO items (id, category_id, name, price, image_path, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [i.id, i.category_id, i.name, i.price, i.image_path ?? null, i.description ?? null, i.created_at ?? null]
      );
    }

    for (const c of customers) {
      await db.run(
        'INSERT INTO customers (id, name, email, phone, created_at) VALUES (?, ?, ?, ?, ?)',
        [c.id, c.name, c.email ?? null, c.phone ?? null, c.created_at ?? null]
      );
    }

    for (const o of orders) {
      await db.run(
        'INSERT INTO orders (id, customer_name, customer_email, customer_phone, total_price, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          o.id,
          o.customer_name,
          o.customer_email ?? null,
          o.customer_phone ?? null,
          o.total_price,
          o.status ?? 'pending',
          o.notes ?? null,
          o.created_at ?? null,
          o.updated_at ?? null
        ]
      );
    }

    for (const oi of orderItems) {
      await db.run(
        'INSERT INTO order_items (id, order_id, item_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [oi.id, oi.order_id, oi.item_id, oi.quantity, oi.price]
      );
    }

    if (db.engine === 'postgres' && typeof db.syncIdentitySequences === 'function') {
      await db.syncIdentitySequences(['categories', 'items', 'customers', 'orders', 'order_items']);
    }

    await db.exec('COMMIT');

    console.log(`Restore complete from: ${resolvedPath}`);
    console.log(`categories: ${categories.length}`);
    console.log(`items: ${items.length}`);
    console.log(`customers: ${customers.length}`);
    console.log(`orders: ${orders.length}`);
    console.log(`order_items: ${orderItems.length}`);
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

restoreDatabase().catch((error) => {
  console.error('Restore failed:', error.message);
  process.exit(1);
});
