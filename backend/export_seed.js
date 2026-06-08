/**
 * Run this script once locally to export your local database to a seed file:
 *   node backend/export_seed.js
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'orders.db');

const db = await open({ filename: dbPath, driver: sqlite3.Database });

const categories = await db.all('SELECT * FROM categories');
const items = await db.all('SELECT * FROM items');
const customers = await db.all('SELECT * FROM customers');
const orders = await db.all('SELECT * FROM orders');
const orderItems = await db.all('SELECT * FROM order_items');

await db.close();

const seed = { categories, items, customers, orders, orderItems };

const outPath = path.join(__dirname, 'seed_data.json');
fs.writeFileSync(outPath, JSON.stringify(seed, null, 2));

console.log('Exported:');
console.log(`  ${categories.length} categories`);
console.log(`  ${items.length} items`);
console.log(`  ${customers.length} customers`);
console.log(`  ${orders.length} orders`);
console.log(`  ${orderItems.length} order items`);
console.log(`\nSaved to: ${outPath}`);
