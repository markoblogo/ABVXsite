const sourceStatuses = new Set(['observed', 'derived', 'assumed', 'recommended']);

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function requiredObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} is required`);
  return value;
}

export function validateBaseCortexWorkforcePacket(workforcePacket) {
  if (workforcePacket?.schemaVersion !== 1 || workforcePacket?.kind !== 'OneD3xCortexMarketWorkforcePacket') {
    throw new Error('workforcePacket must be OneD3xCortexMarketWorkforcePacket v1');
  }
  nonEmptyString(workforcePacket.taskId, 'workforcePacket.taskId');
  nonEmptyString(workforcePacket.correlationId, 'workforcePacket.correlationId');
  nonEmptyString(workforcePacket.diversityMode, 'workforcePacket.diversityMode');
  if (!sourceStatuses.has(workforcePacket.sourceStatus)) throw new Error('workforcePacket.sourceStatus is invalid');
  for (const field of ['hypotheses', 'evidence', 'counterevidence', 'blockers']) {
    if (!Array.isArray(workforcePacket[field])) throw new Error(`workforcePacket.${field} must be an array`);
  }
  requiredObject(workforcePacket.officerReview, 'workforcePacket.officerReview');
  requiredObject(workforcePacket.humanApproval, 'workforcePacket.humanApproval');
  requiredObject(workforcePacket.outcome, 'workforcePacket.outcome');
  nonEmptyString(workforcePacket.observedAt, 'workforcePacket.observedAt');
  if (!/^[a-f0-9]{64}$/i.test(workforcePacket.sourceDigest || '')) throw new Error('workforcePacket.sourceDigest must be a SHA-256 digest');
  return workforcePacket;
}

export function createBaseCortexShadowImport({ workforcePacket }) {
  validateBaseCortexWorkforcePacket(workforcePacket);
  return {
    schemaVersion: 1,
    kind: 'CortexABVImportPacket',
    packetId: `packet:base-cortex:${workforcePacket.taskId}:${workforcePacket.correlationId}`,
    direction: 'inbound_to_cortex_abv',
    source: { kind: 'base_cortex', id: 'base-cortex' },
    classification: 'protected',
    dataKind: 'cortex_market_workforce_packet',
    observedAt: workforcePacket.observedAt,
    provenance: [{ kind: 'base_cortex_workforce_packet', ref: workforcePacket.taskId, digest: workforcePacket.sourceDigest }],
    permittedUse: ['private_context'],
    returnAuthority: 'none',
    payload: {
      mode: 'shadow',
      publicActionAuthority: 'none',
      workforcePacket,
    },
  };
}
