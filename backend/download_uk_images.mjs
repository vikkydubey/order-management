/**
 * Downloads UK/export quality product images found by the workflow.
 * Overwrites existing Indian-market images with UK retailer versions.
 * Usage: node download_uk_images.mjs
 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const RESULTS_FILE = path.join(__dirname, '..', 'uk_image_results.json');

// Results from the workflow (pasted inline for reliability)
const found = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));

function extractFilename(imagePath) {
  // Handle both "C:\\Projects\\...\\img_p_foo.png" and "img_p_foo.png"
  return path.basename(imagePath.replace(/\\\\/g, '\\'));
}

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    const req = client.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        return download(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', (e) => { file.close(); try { fs.unlinkSync(destPath); } catch(_) {} reject(e); });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  let ok = 0, failed = 0, skipped = 0;
  const failures = [];

  for (const item of found) {
    const filename = extractFilename(item.image_path);
    const destPath = path.join(UPLOADS_DIR, filename);
    const url = item.image_url;

    if (!url || !url.startsWith('http')) {
      skipped++;
      continue;
    }

    try {
      await download(url, destPath);
      const size = fs.statSync(destPath).size;
      if (size < 2000) {
        fs.unlinkSync(destPath);
        failures.push({ filename, reason: `too small (${size} bytes)`, url });
        failed++;
      } else {
        ok++;
        if (ok % 20 === 0) console.log(`  ${ok} downloaded...`);
      }
    } catch (e) {
      failures.push({ filename, reason: e.message, url });
      failed++;
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Downloaded: ${ok}`);
  console.log(`Failed:     ${failed}`);
  console.log(`Skipped:    ${skipped}`);
  if (failures.length) {
    console.log('\nFailed items:');
    for (const f of failures) console.log(`  ${f.filename}: ${f.reason}`);
  }
}

main().catch(console.error);
