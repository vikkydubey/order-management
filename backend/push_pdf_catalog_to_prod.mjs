/**
 * Add categories and items from PDF catalog to production.
 * Run AFTER deploying admin.js changes.
 * Usage: node push_pdf_catalog_to_prod.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROD_URL = 'https://web-production-2b682f.up.railway.app';
const CATALOG_PATH = path.join(__dirname, '..', 'pdf_catalog.json');

function isValidItemName(name) {
  if (!name || name.length < 3) return false;
  // Reject if name starts with a digit (it's a size/qty string like "170gm | 1x12")
  if (/^\d/.test(name)) return false;
  // Reject if name is mostly numbers/units
  if (/^[\d\s|xgmGMlLkK×.]+$/.test(name)) return false;
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(name)) return false;
  // Reject pure description patterns
  if (/^\d+\s*(gm|ml|ltr|ptks|pkts|pkt|tab)\b/i.test(name)) return false;
  return true;
}

function cleanName(name) {
  // Remove trailing size/qty patterns from combined names
  return name.replace(/\s+\d+gm.*$/i, '').replace(/\s+\d+ml.*$/i, '').trim();
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  console.log(`Loaded catalog: ${catalog.length} categories`);

  // Fetch existing categories from production
  const catRes = await fetch(`${PROD_URL}/api/admin/categories`);
  const existingCats = await catRes.json();
  const existingCatMap = Object.fromEntries(existingCats.map(c => [c.name.toLowerCase(), c.id]));
  console.log(`Production has ${existingCats.length} existing categories`);

  // Fetch existing items to avoid duplicates
  const itemRes = await fetch(`${PROD_URL}/api/admin/items`);
  const existingItems = await itemRes.json();
  const existingItemKeys = new Set(existingItems.map(i => `${i.category_id}:${i.name.toLowerCase().trim()}`));
  console.log(`Production has ${existingItems.length} existing items`);

  let catsCreated = 0, itemsCreated = 0, itemsSkipped = 0, itemsInvalid = 0;

  for (const catEntry of catalog) {
    const catName = catEntry.category;
    if (!catName || catName.length < 2) continue;

    // Get or create category
    let categoryId = existingCatMap[catName.toLowerCase()];
    if (!categoryId) {
      const r = await fetch(`${PROD_URL}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, description: '' })
      });
      if (r.ok) {
        const created = await r.json();
        categoryId = created.id;
        existingCatMap[catName.toLowerCase()] = categoryId;
        catsCreated++;
        console.log(`  Created category: "${catName}" (id=${categoryId})`);
      } else {
        console.error(`  FAIL creating category "${catName}": ${r.status}`);
        continue;
      }
    }

    // Add items
    for (const item of catEntry.items) {
      const name = item.name ? item.name.trim() : '';
      if (!isValidItemName(name)) {
        itemsInvalid++;
        continue;
      }

      const itemKey = `${categoryId}:${name.toLowerCase()}`;
      if (existingItemKeys.has(itemKey)) {
        itemsSkipped++;
        continue;
      }

      const body = {
        name: name,
        price: item.price || 0,
        category_id: categoryId,
        description: item.description || '',
        image_path: item.image_path ? `/uploads/${item.image_path}` : null
      };

      const r = await fetch(`${PROD_URL}/api/admin/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (r.ok) {
        existingItemKeys.add(itemKey);
        itemsCreated++;
        if (itemsCreated % 25 === 0) console.log(`  ${itemsCreated} items created so far...`);
      } else {
        const txt = await r.text();
        console.error(`  FAIL item "${name}": ${r.status} ${txt}`);
      }
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Categories created: ${catsCreated}`);
  console.log(`Items created: ${itemsCreated}`);
  console.log(`Items skipped (already exist): ${itemsSkipped}`);
  console.log(`Items filtered (invalid name): ${itemsInvalid}`);
}

main().catch(console.error);
