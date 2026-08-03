const PRIVACY_CLASSIFICATIONS = new Set(['public', 'protected', 'private']);

function asString(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  return value.trim();
}

function asInteger(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : NaN;
}

function asArray(value) {
  if (!Array.isArray(value) || !value.length) return [];
  return value.map((item) => asString(item)).filter(Boolean);
}

function sourceReferenceForTrace(value, includePrivate = false) {
  const normalized = asString(value, 'source document');
  return includePrivate ? normalized : '[redacted-source-document]';
}

function normalizeFactId(item, index) {
  const candidate = asString(item.itemId || item.id, `id evidence item id (${index})`);
  return candidate || `id-item-${index + 1}`;
}

export function normalizeIdEvidenceAdapterInput(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (Array.isArray(input.facts)) return input.facts;
  if (typeof input === 'string' && input.trim()) {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.facts)) return parsed.facts;
    } catch {
      throw new Error('ID evidence input must be an array, object with facts, or valid JSON');
    }
  }
  return [];
}

export function buildIdEvidenceRecord(item, index = 0) {
  if (!item || typeof item !== 'object') {
    throw new Error(`ID evidence item (${index + 1}) must be an object`);
  }
  const sourceRepository = asString(item.sourceRepository, `ID evidence item (${index + 1}).sourceRepository`);
  const sourceDocument = asString(item.sourceDocument, `ID evidence item (${index + 1}).sourceDocument`);

  const stableItemId = asString(item.stableItemId || item.id, `ID evidence item (${index + 1}).stableItemId`);
  const contentType = asString(item.contentType || 'text', `ID evidence item (${index + 1}).contentType`);
  const evidenceTimestamp = asString(item.timestamp || item.lastUpdated, `ID evidence item (${index + 1}).timestamp`);
  const privacyClassification = asString(item.privacy, `ID evidence item (${index + 1}).privacy`) || 'protected';
  if (!PRIVACY_CLASSIFICATIONS.has(privacyClassification)) {
    throw new Error(`ID evidence item (${index + 1}) has unsupported privacy classification: ${privacyClassification}`);
  }

  return {
    sourceRepository,
    sourceDocument,
    stableItemId: stableItemId || normalizeFactId(item, index),
    contentType,
    timestamp: evidenceTimestamp || new Date(0).toISOString(),
    revision: asString(item.revision, `ID evidence item (${index + 1}).revision`) || 'unknown',
    privacyClassification,
    summary: asString(item.summary, `ID evidence item (${index + 1}).summary`) || '[no factual summary provided]',
    evidenceScope: asArray(item.evidenceScope, `ID evidence item (${index + 1}).evidenceScope`),
    confidence: asInteger(item.confidence, `ID evidence item (${index + 1}).confidence`) || 100,
  };
}

export function buildIdFactualContext(input) {
  const records = normalizeIdEvidenceAdapterInput(input);
  if (!records.length) {
    return {
      loaded: false,
      text: '',
      evidenceRefs: [],
      trace: {
        count: 0,
        loaded: false,
      },
    };
  }

  const normalized = records.map((record, index) => buildIdEvidenceRecord(record, index));
  const lines = normalized.map((record) => [
    `- [${record.stableItemId}]`,
    `  - sourceRepository: ${record.sourceRepository}`,
    `  - sourceDocument: ${sourceReferenceForTrace(record.sourceDocument)}`,
    `  - summary: ${record.summary}`,
    `  - contentType: ${record.contentType}`,
    `  - revision: ${record.revision}`,
    `  - timestamp: ${record.timestamp}`,
    `  - privacy: ${record.privacyClassification}`,
  ].join('\n'));

  return {
    loaded: true,
    text: `Factual identity and history evidence prepared for proposal governance only:\n${lines.join('\n')}`,
    evidenceRefs: normalized.map((record) => ({
      source: record.sourceRepository,
      document: sourceReferenceForTrace(record.sourceDocument),
      itemId: record.stableItemId,
      type: record.contentType,
      revision: record.revision,
      timestamp: record.timestamp,
      privacy: record.privacyClassification,
      confidence: record.confidence,
    })),
    trace: {
      loaded: true,
      count: normalized.length,
      sources: [...new Set(normalized.map((entry) => entry.sourceRepository))],
      documents: [...new Set(normalized.map(() => '[redacted-source-document]'))],
    },
  };
}
