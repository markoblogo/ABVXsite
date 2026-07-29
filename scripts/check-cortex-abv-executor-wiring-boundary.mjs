import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateExecutorWiringBoundary } from './cortex-abv-executor-wiring-boundary-lib.mjs';

export function run(argv = process.argv.slice(2)) {
  const explicitPathIndex = argv.indexOf('--input');
  const inputPath = explicitPathIndex >= 0
    ? argv[explicitPathIndex + 1]
    : new URL('../cortex-abv/executor-wiring-boundary.v1.json', import.meta.url).pathname;
  if (!inputPath) throw new Error('--input <path> is required');
  const boundary = JSON.parse(readFileSync(inputPath, 'utf8'));
  validateExecutorWiringBoundary(boundary);
  console.log(`Executor wiring boundary valid: ${inputPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    run();
  } catch (error) {
    console.error(`CortexABV executor wiring boundary check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
