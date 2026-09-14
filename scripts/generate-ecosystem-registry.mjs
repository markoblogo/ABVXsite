import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildEcosystemRegistry } from './ecosystem-registry-lib.mjs';

const root = process.cwd();
const graphPath = path.join(root, 'cortex-abv', 'ecosystem-graph.v1.json');
const registryPath = path.join(root, 'cortex-abv', 'ecosystem-registry.v1.json');
const publicPath = path.join(root, 'public', 'ecosystem.json');
const check = process.argv.includes('--check');
const graph = JSON.parse(readFileSync(graphPath, 'utf8'));
const registry = buildEcosystemRegistry({ graph, generatedAt: graph.updatedAt });
const rendered = `${JSON.stringify(registry, null, 2)}\n`;

if (check) {
  for (const target of [registryPath, publicPath]) {
    if (readFileSync(target, 'utf8') !== rendered) throw new Error(`${path.relative(root, target)} is stale; run npm run ecosystem:generate`);
  }
  console.log(`Ecosystem registry is current: ${registry.coverage.nodes} nodes, ${registry.relations.length} relations.`);
} else {
  writeFileSync(registryPath, rendered);
  writeFileSync(publicPath, rendered);
  console.log(`Generated ecosystem registry: ${registry.coverage.nodes} nodes, ${registry.relations.length} relations.`);
}
