import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildPublicProjectRegistry } from './cortex-abv-project-registry-lib.mjs';

const root = process.cwd();
const indexPath = process.argv.includes('--input') ? process.argv[process.argv.indexOf('--input') + 1] : path.join(root, 'cortex-abv', 'public-presence-index.v1.json');
const outputPath = process.argv.includes('--output') ? process.argv[process.argv.indexOf('--output') + 1] : path.join(root, 'cortex-abv', 'public-project-registry.v1.json');
const registry = buildPublicProjectRegistry({
  presenceIndex: JSON.parse(readFileSync(indexPath, 'utf8')),
  generatedAt: new Date().toISOString(),
});
writeFileSync(outputPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Generated ${path.relative(root, outputPath)} with ${registry.entries.length} explicitly linked public repositories.`);
