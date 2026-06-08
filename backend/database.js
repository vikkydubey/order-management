import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'orders.db');
const connectionString = process.env.DATABASE_URL;

let db = null;

function toPgPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

class PostgresAdapter {
  constructor(pool) {
    this.pool = pool;
    this.engine = 'postgres';
  }

  async exec(sql) {
    await this.pool.query(sql);
  }

  async run(sql, params = []) {
    const translated = toPgPlaceholders(sql);
    const isInsert = /^\s*insert\s+/i.test(translated);
    const query = isInsert && !/\breturning\b/i.test(translated)
      ? `${translated} RETURNING id`
      : translated;
    const result = await this.pool.query(query, params);

    return {
      changes: result.rowCount || 0,
      lastID: isInsert ? result.rows?.[0]?.id : undefined
    };
  }

  async get(sql, params = []) {
    const result = await this.pool.query(toPgPlaceholders(sql), params);
    return result.rows[0];
  }

  async all(sql, params = []) {
    const result = await this.pool.query(toPgPlaceholders(sql), params);
    return result.rows;
  }

  async syncIdentitySequences(tableNames) {
    for (const table of tableNames) {
      await this.pool.query(
        `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`,
        [table]
      );
    }
  }
}

async function initializeSqlite() {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqliteDb = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  sqliteDb.engine = 'sqlite';

  console.log(`Using SQLite database at: ${dbPath}`);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image_path TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id)
    )
  `);

  return sqliteDb;
}

async function initializePostgres() {
  const ssl = process.env.PGSSL === 'true' || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false;
  const pool = new Pool({ connectionString, ssl });

  await pool.query('SELECT 1');
  const pgDb = new PostgresAdapter(pool);

  console.log('Using PostgreSQL database from DATABASE_URL');

  await pgDb.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgDb.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgDb.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image_path TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgDb.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgDb.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id),
      quantity INTEGER NOT NULL,
      price REAL NOT NULL
    )
  `);

  return pgDb;
}

export async function initializeDatabase() {
  db = connectionString ? await initializePostgres() : await initializeSqlite();

  console.log('Database initialized successfully');
  return db;
}

export function getDatabase() {
  return db;
}
