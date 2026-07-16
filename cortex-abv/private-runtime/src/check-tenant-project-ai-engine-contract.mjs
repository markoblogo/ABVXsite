import { readFileSync } from 'node:fs';
import { validateTenantProjectAIEngineContract } from './tenant-project-ai-engine-contract.mjs';

const contractPath = process.argv.includes('--contract')
  ? process.argv[process.argv.indexOf('--contract') + 1]
  : new URL('../config/tenant-project-ai-engine.v1.json', import.meta.url);

try {
  const contract = validateTenantProjectAIEngineContract(JSON.parse(readFileSync(contractPath, 'utf8')));
  console.log(`Validated CortexABV tenant contract with ${contract.tenants.length} isolated tenants.`);
} catch (error) {
  console.error(`CortexABV tenant contract validation failed: ${error.message}`);
  process.exitCode = 1;
}
