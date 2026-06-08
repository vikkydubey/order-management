import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JOURNAL_PATH = 'C:\\Users\\prashant.dubey\\.claude\\projects\\c--Projects-OrderManagement\\43b00397-deb3-45ec-bc2b-76dc4e47a390\\subagents\\workflows\\wf_090fb780-bd8\\journal.jsonl';
const SEED_PATH = path.join(__dirname, 'seed_data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.existsSync(destPath) && fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

function getExtFromUrl(urlStr) {
  try {
    const pathname = new URL(urlStr).pathname;
    const ext = path.extname(pathname).split('?')[0].toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
  } catch {
    return '.jpg';
  }
}

function makeFilename(productKey, ext) {
  const slug = productKey.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `img_p_${slug}${ext}`;
}

async function main() {
  // Parse journal for all found results
  const journalLines = fs.readFileSync(JOURNAL_PATH, 'utf8').split('\n').filter(Boolean);
  const foundResults = [];
  for (const line of journalLines) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'result' && Array.isArray(entry.result?.results)) {
        for (const r of entry.result.results) {
          if (r.found && r.imageUrl && r.productKey) {
            foundResults.push(r);
          }
        }
      }
    } catch {}
  }

  console.log(`Found ${foundResults.length} products with images from workflow`);

  // Read seed data
  const seedData = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  const items = seedData.items;

  // Build lookup: productKey -> filename (download or reuse)
  const keyToFilename = {};
  let downloadCount = 0, skipCount = 0, errorCount = 0;

  for (const r of foundResults) {
    const ext = getExtFromUrl(r.imageUrl);
    const filename = makeFilename(r.productKey, ext);
    const destPath = path.join(UPLOADS_DIR, filename);

    if (fs.existsSync(destPath)) {
      console.log(`  SKIP (exists): ${filename}`);
      skipCount++;
    } else {
      try {
        process.stdout.write(`  Downloading ${filename} ... `);
        await downloadFile(r.imageUrl, destPath);
        console.log('OK');
        downloadCount++;
      } catch (err) {
        console.log(`FAIL: ${err.message}`);
        errorCount++;
        continue;
      }
    }
    keyToFilename[r.productKey] = filename;
  }

  console.log(`\nDownloads: ${downloadCount} new, ${skipCount} skipped, ${errorCount} errors`);

  // Update seed_data items: match on name starting with productKey (case-insensitive)
  let updatedCount = 0;
  for (const item of items) {
    if (item.image_path) continue; // already has image
    const nameUpper = item.name.toUpperCase();
    for (const [productKey, filename] of Object.entries(keyToFilename)) {
      if (nameUpper.startsWith(productKey.toUpperCase())) {
        item.image_path = filename;
        updatedCount++;
        break;
      }
    }
  }

  console.log(`\nUpdated ${updatedCount} items in seed_data.json`);

  // Save
  fs.writeFileSync(SEED_PATH, JSON.stringify(seedData, null, 2));
  console.log('seed_data.json saved.');

  // Summary of what still has no image
  const stillMissing = items.filter(i => !i.image_path);
  console.log(`\nItems still without image: ${stillMissing.length}`);
  if (stillMissing.length > 0) {
    const uniqueMissing = [...new Set(stillMissing.map(i => i.name.replace(/\s+\d+GM.*|\s+\d+ML.*|\s+\d+LTR.*|\s+\*\d+.*|\s+\(\d+.*|\s+\d+KG.*/i, '').trim()))];
    console.log('Sample:', uniqueMissing.slice(0, 20).join(', '));
  }
}

main().catch(console.error);
