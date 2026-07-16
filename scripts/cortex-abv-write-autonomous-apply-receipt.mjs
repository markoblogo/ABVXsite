import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createAutonomousApplyReceipt } from './cortex-abv-lib.mjs';

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

export function run() {
  const inputPath = option('--input');
  const outputPath = option('--output');
  const claimsDirectory = option('--claims-dir');
  const targetRepository = option('--target-repository');
  const targetBranch = option('--target-branch');
  const previousCommit = option('--previous-commit');
  const appliedCommit = option('--applied-commit');
  if (!inputPath || !outputPath || !claimsDirectory || !targetRepository || !targetBranch || !previousCommit || !appliedCommit) {
    throw new Error('input, output, claims-dir, target-repository, target-branch, previous-commit, and applied-commit are required');
  }
  const copyProposals = existsSync(claimsDirectory)
    ? readdirSync(claimsDirectory).filter((name) => name.endsWith('.json')).map((name) => JSON.parse(readFileSync(`${claimsDirectory}/${name}`, 'utf8')))
    : [];
  const receipt = createAutonomousApplyReceipt({
    batch: JSON.parse(readFileSync(inputPath, 'utf8')),
    copyProposals,
    targetRepository,
    targetBranch,
    previousCommit,
    appliedCommit,
    appliedAt: new Date().toISOString(),
  });
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`CortexABV autonomous receipt failed: ${error.message}`);
    process.exitCode = 1;
  }
}
