function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function validateIsolation(isolation, tenantId) {
  if (isolation?.retrievalScope !== 'tenant_only') throw new Error(`${tenantId}.isolation.retrievalScope must be tenant_only`);
  if (isolation.crossTenantAccess !== 'deny') throw new Error(`${tenantId}.isolation.crossTenantAccess must be deny`);
  if (isolation.actionAuthority !== 'none') throw new Error(`${tenantId}.isolation.actionAuthority must be none`);
}

export function validateTenantProjectAIEngineContract(contract) {
  if (contract?.schemaVersion !== 1 || contract?.kind !== 'CortexABVTenantProjectAIEngineContract' || contract?.version !== 'v1') {
    throw new Error('tenant contract must be CortexABVTenantProjectAIEngineContract v1');
  }
  if (contract.authority !== 'plan' || contract.externalSideEffects !== false || contract.runtimeIntegration !== false) {
    throw new Error('tenant contract must remain plan-only with no runtime integration');
  }
  validateIsolation(contract.core?.defaultIsolation, 'core.default');
  if (!Array.isArray(contract.tenants) || !contract.tenants.length) throw new Error('tenant contract requires tenants');
  const ids = new Set();
  for (const tenant of contract.tenants) {
    const id = nonEmptyString(tenant?.id, 'tenant.id');
    if (ids.has(id)) throw new Error(`tenant id is duplicated: ${id}`);
    ids.add(id);
    nonEmptyString(tenant.ownership, `${id}.ownership`);
    nonEmptyString(tenant.purpose, `${id}.purpose`);
    validateIsolation(tenant.isolation, id);
  }
  for (const requiredId of ['personal', 'azur-menton']) {
    if (!ids.has(requiredId)) throw new Error(`tenant contract requires ${requiredId}`);
  }
  const azurMenton = contract.tenants.find((tenant) => tenant.id === 'azur-menton');
  const guest = azurMenton.guestExperience;
  if (guest?.status !== 'planned' || guest.mode !== 'read_only_guest_chat' || !Array.isArray(guest.prerequisites)) {
    throw new Error('azur-menton guestExperience must remain a planned read-only guest chat');
  }
  const requiredPrerequisites = ['versioned_source_pack', 'guest_chat_policy', 'shadow_eval_pack', 'human_approval'];
  if (requiredPrerequisites.some((prerequisite) => !guest.prerequisites.includes(prerequisite))) {
    throw new Error('azur-menton guestExperience prerequisites are incomplete');
  }
  return contract;
}
