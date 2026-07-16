const sourceStatuses = new Set(['observed', 'derived', 'assumed', 'recommended']);

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function requiredObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} is required`);
  return value;
}

export function validateMonitorMn7rProjectUpdate(projectUpdate) {
  if (projectUpdate?.schemaVersion !== 1 || projectUpdate?.kind !== 'MonitorProjectUpdatePacket') {
    throw new Error('projectUpdate must be MonitorProjectUpdatePacket v1');
  }
  nonEmptyString(projectUpdate.updateId, 'projectUpdate.updateId');
  if (projectUpdate.projectId !== 'monitor') throw new Error('projectUpdate.projectId must be monitor');
  if (projectUpdate.productId !== 'mn7r') throw new Error('projectUpdate.productId must be mn7r');
  if (!sourceStatuses.has(projectUpdate.sourceStatus)) throw new Error('projectUpdate.sourceStatus is invalid');
  for (const field of ['changeSet', 'evidence', 'blockers']) {
    if (!Array.isArray(projectUpdate[field])) throw new Error(`projectUpdate.${field} must be an array`);
  }
  requiredObject(projectUpdate.review, 'projectUpdate.review');
  nonEmptyString(projectUpdate.observedAt, 'projectUpdate.observedAt');
  if (!/^[a-f0-9]{64}$/i.test(projectUpdate.sourceDigest || '')) throw new Error('projectUpdate.sourceDigest must be a SHA-256 digest');
  return projectUpdate;
}

export function createMonitorMn7rShadowImport({ projectUpdate }) {
  validateMonitorMn7rProjectUpdate(projectUpdate);
  return {
    schemaVersion: 1,
    kind: 'CortexABVImportPacket',
    packetId: `packet:monitor-mn7r:${projectUpdate.updateId}`,
    direction: 'inbound_to_cortex_abv',
    source: { kind: 'owned_project_ecosystem', id: 'monitor' },
    classification: 'protected',
    dataKind: 'monitor_project_update',
    observedAt: projectUpdate.observedAt,
    provenance: [{ kind: 'monitor_mn7r_project_update', ref: projectUpdate.updateId, digest: projectUpdate.sourceDigest }],
    permittedUse: ['private_context'],
    returnAuthority: 'none',
    payload: {
      mode: 'shadow',
      publicActionAuthority: 'none',
      projectUpdate,
    },
  };
}
