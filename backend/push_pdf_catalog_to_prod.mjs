/**
 * Add/replace categories and items from PDF catalog to production.
 * For each PDF category: deletes existing items then re-creates from pdf_catalog.json.
 * Safe to re-run — idempotent.
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
  // Reject if name starts with a digit (size/qty string like "170gm | 1x12")
  if (/^\d/.test(name)) return false;
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(name)) return false;
  // Reject pure size/unit strings
  if (/^[\d\s|xgmGMlLkK×.]+$/.test(name)) return false;
  // Reject if name is a size-only descriptor
  if (/^\d+\s*(gm|ml|ltr|ptks|pkts|pkt|tab|pcs)\b/i.test(name)) return false;
  // Reject promotional fragments "(10p +10p Free)"
  if (/^\(/.test(name)) return false;
  // Reject names containing "pcs pack of"
  if (/pcs\s+pack\s+of/i.test(name)) return false;
  // Reject names containing "|" (they're size/qty lines)
  if (name.includes('|')) return false;
  // Reject very long concatenated names (> 100 chars)
  if (name.length > 100) return false;
  return true;
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  console.log(`Loaded catalog: ${catalog.length} categories`);

  // Fetch existing categories from production
  const catRes = await fetch(`${PROD_URL}/api/admin/categories`);
  const existingCats = await catRes.json();
  const existingCatMap = Object.fromEntries(existingCats.map(c => [c.name.toLowerCase(), c.id]));
  console.log(`Production has ${existingCats.length} existing categories`);

  // Fetch all existing items once
  const itemRes = await fetch(`${PROD_URL}/api/admin/items`);
  const existingItems = await itemRes.json();
  console.log(`Production has ${existingItems.length} existing items`);

  let catsCreated = 0, itemsCreated = 0, itemsDeleted = 0, itemsInvalid = 0;

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

    // Delete existing items in this category (clean replace)
    const oldItems = existingItems.filter(i => i.category_id === categoryId);
    for (const old of oldItems) {
      const dr = await fetch(`${PROD_URL}/api/admin/items/${old.id}`, { method: 'DELETE' });
      if (dr.ok) itemsDeleted++;
    }
    if (oldItems.length > 0) {
      console.log(`  Deleted ${oldItems.length} old items from "${catName}"`);
    }

    // Add items from catalog
    let addedCount = 0;
    for (const item of catEntry.items) {
      const name = item.name ? item.name.trim() : '';
      if (!isValidItemName(name)) {
        itemsInvalid++;
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
        itemsCreated++;
        addedCount++;
      } else {
        const txt = await r.text();
        console.error(`  FAIL item "${name}": ${r.status} ${txt}`);
      }
    }
    console.log(`  "${catName}": ${addedCount} items added`);
  }

  console.log(`\n=== DONE ===`);
  console.log(`Categories created: ${catsCreated}`);
  console.log(`Items deleted (old): ${itemsDeleted}`);
  console.log(`Items created (new): ${itemsCreated}`);
  console.log(`Items filtered (invalid name): ${itemsInvalid}`);
}

main().catch(console.error);
