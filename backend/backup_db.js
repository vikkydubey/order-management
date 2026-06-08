import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, getDatabase } from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputArg = process.argv[2];

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function backupDatabase() {
  await initializeDatabase();
  const db = getDatabase();

  const tables = ['categories', 'items', 'customers', 'orders', 'order_items'];
  const backup = {
    meta: {
      created_at: new Date().toISOString(),
      engine: db.engine || 'sqlite',
      source: process.env.DATABASE_URL ? 'DATABASE_URL' : 'DATABASE_PATH/local'
    },
    data: {}
  };

  for (const table of tables) {
    backup.data[table] = await db.all(`SELECT * FROM ${table} ORDER BY id`);
  }

  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const outputPath = outputArg
    ? path.resolve(process.cwd(), outputArg)
    : path.join(backupDir, `backup-${getTimestamp()}.json`);

  fs.writeFileSync(outputPath, JSON.stringify(backup, null, 2), 'utf8');

  console.log(`Backup saved to: ${outputPath}`);
  for (const table of tables) {
    console.log(`${table}: ${backup.data[table].length}`);
  }
}

backupDatabase().catch((error) => {
  console.error('Backup failed:', error.message);
  process.exit(1);
});
