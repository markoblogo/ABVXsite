import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { validateTenantProjectAIEngineContract } from '../src/tenant-project-ai-engine-contract.mjs';

const contract = JSON.parse(readFileSync(new URL('../config/tenant-project-ai-engine.v1.json', import.meta.url), 'utf8'));

test('defines isolated personal and project tenants with a gated AzurMenton guest-chat plan', () => {
  const validated = validateTenantProjectAIEngineContract(contract);
  const azurMenton = validated.tenants.find((tenant) => tenant.id === 'azur-menton');
  assert.equal(validated.authority, 'plan');
  assert.equal(validated.externalSideEffects, false);
  assert.deepEqual(azurMenton.guestExperience, {
    status: 'planned',
    mode: 'read_only_guest_chat',
    prerequisites: ['versioned_source_pack', 'guest_chat_policy', 'shadow_eval_pack', 'human_approval'],
  });
  assert.deepEqual(azurMenton.isolation, { retrievalScope: 'tenant_only', crossTenantAccess: 'deny', actionAuthority: 'none' });
});

test('rejects a tenant that could access another tenant context', () => {
  const invalid = {
    ...contract,
    tenants: contract.tenants.map((tenant) => tenant.id === 'azur-menton'
      ? { ...tenant, isolation: { ...tenant.isolation, crossTenantAccess: 'allow' } }
      : tenant),
  };
  assert.throws(() => validateTenantProjectAIEngineContract(invalid), /crossTenantAccess must be deny/);
});
