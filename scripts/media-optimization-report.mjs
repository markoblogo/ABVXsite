import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const mediaRoot = path.join(process.cwd(), 'public', 'media');
const largeFileBytes = 1_500_000;
const sourceExtensions = new Set(['.png', '.jpg', '.jpeg']);

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function derivativeStatus(file) {
  const dir = path.dirname(file);
  const base = path.basename(file, path.extname(file));
  return {
    webp: existsSync(path.join(dir, `${base}.webp`)),
    avif: existsSync(path.join(dir, `${base}.avif`)),
  };
}

const rows = walk(mediaRoot)
  .filter((file) => sourceExtensions.has(path.extname(file).toLowerCase()))
  .map((file) => {
    const size = statSync(file).size;
    return {
      file,
      size,
      relative: path.relative(process.cwd(), file),
      derivatives: derivativeStatus(file),
    };
  })
  .sort((a, b) => b.size - a.size);

const largeRows = rows.filter((row) => row.size >= largeFileBytes);
const smallDerivativeGaps = rows.filter((row) => row.size < largeFileBytes && (!row.derivatives.webp || !row.derivatives.avif));

if (!largeRows.length && !smallDerivativeGaps.length) {
  console.log('Media optimization report: no large source images or missing derivatives found.');
  process.exit(0);
}

console.log('Media optimization report: large source images');
for (const row of largeRows) {
  const mb = (row.size / 1_000_000).toFixed(2);
  const missing = [
    row.derivatives.webp ? null : 'webp',
    row.derivatives.avif ? null : 'avif',
  ].filter(Boolean).join(', ') || 'none';
  console.log(`- ${row.relative} (${mb} MB), missing derivatives: ${missing}`);
}

console.log(`Small source images missing derivatives: ${smallDerivativeGaps.length}`);
