import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildRepositoryChangeProposal } from './cortex-abv-repository-change-proposal-lib.mjs';

function requiredArgument(name) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`${name} <path> is required`);
  return value;
}

export function run() {
  const baselinePath = requiredArgument('--baseline');
  const candidatePath = requiredArgument('--candidate');
  const outputPath = requiredArgument('--output');
  const proposal = buildRepositoryChangeProposal({
    baseline: JSON.parse(readFileSync(baselinePath, 'utf8')),
    candidate: JSON.parse(readFileSync(candidatePath, 'utf8')),
    createdAt: new Date().toISOString(),
  });
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(proposal, null, 2)}\n`);
  console.log(`${proposal.changes.length} repository state change(s); review status: ${proposal.reviewStatus}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`CortexABV repository comparison failed: ${error.message}`);
    process.exitCode = 1;
  }
}
