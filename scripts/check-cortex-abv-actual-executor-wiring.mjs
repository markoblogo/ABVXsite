import { readFileSync } from 'node:fs';
import { validateActualExecutorWiringContract } from './cortex-abv-actual-executor-wiring-lib.mjs';

function resolvePath() {
  return process.argv[2]
    ? new URL(`file://${process.cwd()}/${process.argv[2]}`).pathname
    : new URL('../cortex-abv/actual-executor-wiring.v1.json', import.meta.url).pathname;
}

try {
  const path = resolvePath();
  const contract = JSON.parse(readFileSync(path, 'utf8'));
  validateActualExecutorWiringContract(contract);
  console.log(`Actual executor wiring contract valid: ${path}`);
} catch (error) {
  console.error(`CortexABV actual executor wiring check failed: ${error.message}`);
  process.exitCode = 1;
}
