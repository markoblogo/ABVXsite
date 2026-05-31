import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const mediaRoot = path.join(process.cwd(), 'public', 'media');
const defaultMinBytes = 1_500_000;
const sourceExtensions = new Set(['.png', '.jpg', '.jpeg']);

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const all = args.has('--all');
const minBytesArg = process.argv.find((arg) => arg.startsWith('--min-bytes='));
const minBytes = all ? 0 : Number(minBytesArg?.split('=')[1] || defaultMinBytes);

function commandExists(command) {
  try {
    execFileSync('command', ['-v', command], { shell: true, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function derivativePath(file, extension) {
  return path.join(path.dirname(file), `${path.basename(file, path.extname(file))}.${extension}`);
}

if (!commandExists('cwebp')) {
  console.error('cwebp is required to generate WebP derivatives.');
  process.exit(1);
}

if (!commandExists('avifenc')) {
  console.error('avifenc is required to generate AVIF derivatives.');
  process.exit(1);
}

const sources = walk(mediaRoot)
  .filter((file) => sourceExtensions.has(path.extname(file).toLowerCase()))
  .filter((file) => statSync(file).size >= minBytes)
  .sort((a, b) => b.localeCompare(a));

let generated = 0;
let skipped = 0;

for (const source of sources) {
  const webp = derivativePath(source, 'webp');
  const avif = derivativePath(source, 'avif');
  const relative = path.relative(process.cwd(), source);

  if (force || !existsSync(webp)) {
    execFileSync('cwebp', ['-quiet', '-q', '82', source, '-o', webp]);
    generated += 1;
    console.log(`generated ${path.relative(process.cwd(), webp)} from ${relative}`);
  } else {
    skipped += 1;
  }

  if (force || !existsSync(avif)) {
    execFileSync('avifenc', ['--min', '24', '--max', '36', '--speed', '6', source, avif], { stdio: 'ignore' });
    generated += 1;
    console.log(`generated ${path.relative(process.cwd(), avif)} from ${relative}`);
  } else {
    skipped += 1;
  }
}

console.log(`Image derivatives complete: ${generated} generated, ${skipped} existing, ${sources.length} source files scanned.`);
