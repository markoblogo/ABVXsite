import { readFileSync, writeFileSync } from 'node:fs';
import { renderReadmeBlock, upsertManagedReadmeBlock } from './ecosystem-registry-lib.mjs';

const value = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
};
const nodeId = value('--node');
const readmePath = value('--readme');
const check = process.argv.includes('--check');
if (!nodeId || !readmePath) throw new Error('--node <id> and --readme <path> are required');
const registry = JSON.parse(readFileSync('cortex-abv/ecosystem-registry.v1.json', 'utf8'));
const readme = readFileSync(readmePath, 'utf8');
const next = upsertManagedReadmeBlock({ readme, block: renderReadmeBlock({ registry, nodeId }) });
if (check) {
  if (next !== readme) throw new Error(`${readmePath} has a stale ABVX ecosystem block`);
  console.log(`${readmePath} ecosystem block is current.`);
} else {
  writeFileSync(readmePath, next);
  console.log(`Updated ${readmePath} ecosystem block for ${nodeId}.`);
}
