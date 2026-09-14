import { readFileSync } from 'node:fs';
import { buildImpactPlan } from './ecosystem-registry-lib.mjs';

const value = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
};
const changedNode = value('--node');
const changedFields = (value('--fields') || 'release').split(',').map((field) => field.trim()).filter(Boolean);
if (!changedNode) throw new Error('--node <id> is required');
const registry = JSON.parse(readFileSync('cortex-abv/ecosystem-registry.v1.json', 'utf8'));
console.log(JSON.stringify(buildImpactPlan({ registry, changedNode, changedFields }), null, 2));
