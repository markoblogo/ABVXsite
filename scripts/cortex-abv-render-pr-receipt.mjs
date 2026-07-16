import { readFileSync, writeFileSync } from 'node:fs';
import { renderEvidenceReceipt } from './cortex-abv-lib.mjs';

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

export function run() {
  const inputPath = option('--input');
  const outputPath = option('--output');
  if (!inputPath || !outputPath) throw new Error('--input <path> and --output <path> are required');
  const batch = JSON.parse(readFileSync(inputPath, 'utf8'));
  writeFileSync(outputPath, `${renderEvidenceReceipt(batch)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`CortexABV receipt rendering failed: ${error.message}`);
    process.exitCode = 1;
  }
}
