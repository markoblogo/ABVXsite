const INGRESS_KEYS = new Set([
  'schemaVersion',
  'kind',
  'version',
  'ingressId',
  'ownerId',
  'source',
  'provenance',
  'contentHash',
  'classification',
  'retention',
  'retrievalScopes',
  'promotion',
  'createdAt',
]);

export function validateCoqPiSharedRagIngress(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('shared RAG ingress must be an object');
  for (const key of Object.keys(record)) {
    if (!INGRESS_KEYS.has(key)) throw new Error(`shared RAG ingress contains unsupported field: ${key}`);
  }
  if (record.schemaVersion !== 1 || record.kind !== 'CortexABVSharedRagIngress' || record.version !== 'v1') {
    throw new Error('shared RAG ingress must be CortexABVSharedRagIngress v1');
  }
  if (record.ownerId !== 'owner') throw new Error('shared RAG ingress ownerId must be owner');
  if (!/^coqpi:ingress:[a-z0-9-]{8,}$/i.test(record.ingressId || '')) throw new Error('shared RAG ingress ingressId is invalid');
  if (!['link', 'file', 'folder', 'path'].includes(record.source?.kind) || typeof record.source?.label !== 'string') throw new Error('shared RAG ingress source is invalid');
  if (!/^coqpi:ingress:[a-z0-9-]{8,}$/i.test(record.provenance?.sourceId || '') || !/^[a-f0-9]{64}$/i.test(record.provenance?.locatorSha256 || '')) {
    throw new Error('shared RAG ingress provenance is invalid');
  }
  if (record.contentHash !== null) throw new Error('pending shared RAG ingress must not claim a content hash before content capture');
  if (record.classification !== 'pending') throw new Error('shared RAG ingress classification must be pending');
  if (record.retention?.mode !== 'manual_deletion_required' || !Number.isInteger(record.retention?.maxAgeDays) || record.retention.maxAgeDays < 1 || Number.isNaN(Date.parse(record.retention?.expiresAt || ''))) {
    throw new Error('shared RAG ingress retention is invalid');
  }
  if (!Array.isArray(record.retrievalScopes) || record.retrievalScopes.length !== 1 || record.retrievalScopes[0] !== 'coqpi_pending_classification') {
    throw new Error('shared RAG ingress must be CoqPi-only while pending');
  }
  if (record.promotion !== 'explicit_audit_required') throw new Error('shared RAG ingress promotion must require an explicit audit');
  if (typeof record.createdAt !== 'string' || Number.isNaN(Date.parse(record.createdAt))) throw new Error('shared RAG ingress createdAt is invalid');
  return record;
}
