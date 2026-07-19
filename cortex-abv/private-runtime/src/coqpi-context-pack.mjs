const PACK_KIND = 'CortexABVCoqPiContextPack';
const MAX_CONTEXT_CHARS = 6000;
const PACK_KEYS = new Set([
  'schemaVersion',
  'kind',
  'version',
  'packId',
  'title',
  'classification',
  'status',
  'createdAt',
  'authority',
  'sourceContentIncluded',
  'sourceRefs',
  'retention',
  'scope',
  'eligibility',
  'abstention',
  'compactContext',
]);

function nonEmptyString(value, label, maxLength = Infinity) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  if (value.length > maxLength) throw new Error(`${label} exceeds the allowed length`);
  return value.trim();
}

function validTimestamp(value, label) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw new Error(`${label} must be an ISO timestamp`);
  return value;
}

export function validateCoqPiContextPack(pack) {
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) throw new Error('context pack must be an object');
  for (const key of Object.keys(pack)) {
    if (!PACK_KEYS.has(key)) throw new Error(`context pack contains unsupported field: ${key}`);
  }
  if (pack.schemaVersion !== 1 || pack.kind !== PACK_KIND || pack.version !== 'v1') {
    throw new Error('context pack must be CortexABVCoqPiContextPack v1');
  }
  if (!/^coqpi:[a-z0-9][a-z0-9:_-]{2,119}$/i.test(pack.packId || '')) throw new Error('context pack packId is invalid');
  if (pack.classification !== 'private') throw new Error('context pack classification must be private');
  if (pack.status !== 'approved') throw new Error('context pack status must be approved');
  if (pack.authority !== 'read_only') throw new Error('context pack authority must be read_only');
  if (pack.sourceContentIncluded !== false) throw new Error('context pack must not include raw source content');
  if (!Array.isArray(pack.sourceRefs) || pack.sourceRefs.length === 0 || !pack.sourceRefs.every((value) => /^[a-z0-9][a-z0-9:_-]{2,119}$/i.test(value?.sourceId || '') && /^[a-f0-9]{64}$/i.test(value?.digest || ''))) {
    throw new Error('context pack sourceRefs must contain source IDs and SHA-256 digests only');
  }
  if (pack.retention?.mode !== 'manual_deletion_required' || !Number.isInteger(pack.retention?.maxAgeDays) || pack.retention.maxAgeDays < 1 || Date.parse(pack.retention?.expiresAt || '') <= Date.parse(pack.createdAt)) {
    throw new Error('context pack retention must contain a future expiry');
  }
  if (!Array.isArray(pack.scope) || !pack.scope.includes('personal_call_assist') || !pack.scope.every((value) => typeof value === 'string')) {
    throw new Error('context pack scope must include personal_call_assist');
  }
  if (pack.eligibility?.consumer !== 'coqpi' || pack.eligibility?.purpose !== 'local_call_assist' || pack.eligibility?.allowed !== true) {
    throw new Error('context pack eligibility must be limited to local CoqPi call assistance');
  }
  if (pack.abstention?.whenContextUnavailable !== 'clarify_or_abstain' || pack.abstention?.whenContextOutOfScope !== 'clarify_or_abstain') {
    throw new Error('context pack must require clarification or abstention outside its context');
  }

  return {
    schemaVersion: 1,
    kind: PACK_KIND,
    version: 'v1',
    packId: nonEmptyString(pack.packId, 'context pack packId', 120),
    title: nonEmptyString(pack.title, 'context pack title', 120),
    classification: 'private',
    status: 'approved',
    createdAt: validTimestamp(pack.createdAt, 'context pack createdAt'),
    authority: 'read_only',
    sourceContentIncluded: false,
    sourceRefs: pack.sourceRefs.map(({ sourceId, digest }) => ({ sourceId, digest })),
    retention: { ...pack.retention },
    scope: [...pack.scope],
    eligibility: { ...pack.eligibility },
    abstention: { ...pack.abstention },
    compactContext: nonEmptyString(pack.compactContext, 'context pack compactContext', MAX_CONTEXT_CHARS),
  };
}
