/**
 * Updates image_path for items in production that have a local image.
 * Run AFTER deploying the admin.js change.
 * Usage: node push_images_to_prod.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROD_URL = 'https://web-production-2b682f.up.railway.app';
const SEED_PATH = path.join(__dirname, 'seed_data.json');

async function main() {
  const seedData = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  const itemsWithImage = seedData.items.filter(i => i.image_path);

  console.log(`Items with image_path in seed_data: ${itemsWithImage.length}`);
  console.log(`Fetching current production items...`);

  const res = await fetch(`${PROD_URL}/api/admin/items`);
  const prodItems = await res.json();
  const prodMap = Object.fromEntries(prodItems.map(i => [i.id, i]));

  // Only update items that currently have no image in prod
  const toUpdate = itemsWithImage.filter(i => {
    const prod = prodMap[i.id];
    return prod && !prod.image_path;
  });

  console.log(`Items needing image update in prod: ${toUpdate.length}`);

  let success = 0, failed = 0;
  for (const item of toUpdate) {
    const prod = prodMap[item.id];
    const body = {
      name: prod.name,
      price: prod.price,
      category_id: prod.category_id,
      description: prod.description || '',
      image_path: `/uploads/${item.image_path}`
    };

    try {
      const r = await fetch(`${PROD_URL}/api/admin/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (r.ok) {
        success++;
        if (success % 20 === 0) console.log(`  ${success}/${toUpdate.length} updated...`);
      } else {
        const txt = await r.text();
        console.error(`  FAIL item ${item.id}: ${r.status} ${txt}`);
        failed++;
      }
    } catch (err) {
      console.error(`  ERROR item ${item.id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} updated, ${failed} failed`);
}

main().catch(console.error);
