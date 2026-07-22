const STOP_WORDS = new Set(['the', 'and', 'of', 'a', 'an', 'to', 'in', 'for', 'on', 'with', 'is', 'are', 'was', 'were', 'this', 'that', 'about']);

const TFIDF_MODE = 'tfidf-lite';
const ANN_MODE = 'ann';
const ANN_WITH_FALLBACK_MODE = 'ann_with_tfidf_fallback';

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function requireNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalizeText(value).split(/\s+/).filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function tokenCounts(text) {
  const counts = new Map();
  for (const token of tokenize(text)) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

function validatePlan(plan) {
  requireObject(plan, 'plan');
  if (plan.engine !== 'turbovec') throw new Error('vector runtime shim only accepts turbovec pilot plans');
  if (plan.externalSideEffects !== false) throw new Error('vector runtime shim requires externalSideEffects=false');
  const safety = plan.safetyControls || {};
  if (safety.networkCalls || safety.llmCalls || safety.writes || safety.publicActionAuthority) {
    throw new Error('vector runtime shim requires no network, llm, writes, or public action authority');
  }
}

function resolveRuntimeDecision(plan, engineAdapter) {
  const indexInterface = plan.indexInterface || {};
  const requestedMode = indexInterface.mode || TFIDF_MODE;
  if (![TFIDF_MODE, ANN_MODE, ANN_WITH_FALLBACK_MODE].includes(requestedMode)) {
    throw new Error('unsupported vector indexInterface.mode');
  }

  const runtimeReady = Boolean(plan.runtimeIntegration);
  const adapterAvailable = Boolean(engineAdapter && typeof engineAdapter.buildIndex === 'function' && typeof engineAdapter.query === 'function');
  const fallback = indexInterface.fallback || {};
  const fallbackEngine = fallback.engine || TFIDF_MODE;
  const fallbackReason = fallback.reason || 'runtime adapter unavailable or disabled';
  const mustFallback = requestedMode === ANN_WITH_FALLBACK_MODE || requestedMode === ANN_MODE;
  const fallbackApplied = mustFallback && (!runtimeReady || !adapterAvailable);
  const selectedMode = fallbackApplied ? fallbackEngine : requestedMode;

  return {
    engine: plan.engine,
    requestedMode,
    runtimeReady,
    adapterAvailable,
    fallbackApplied,
    fallbackEngine,
    fallbackReason: fallbackApplied ? fallbackReason : undefined,
    selectedMode,
  };
}

function buildTfidfIndex(corpus) {
  const docFrequencies = new Map();
  const documents = corpus.map((document) => {
    const id = requireNonEmptyString(document.id, 'corpus.id');
    const text = requireNonEmptyString(document.text, `corpus.${id}.text`);
    if (!Array.isArray(document.evidenceRefs) || document.evidenceRefs.length === 0) {
      throw new Error(`corpus.${id}.evidenceRefs must be a non-empty array`);
    }
    const counts = tokenCounts(text);
    for (const token of counts.keys()) {
      docFrequencies.set(token, (docFrequencies.get(token) || 0) + 1);
    }
    return {
      id,
      title: document.title || id,
      tenant: document.tenant,
      text,
      evidenceRefs: document.evidenceRefs,
      termCounts: counts,
      docLength: [...counts.values()].reduce((sum, value) => sum + value, 0),
    };
  });

  const docCount = Math.max(1, documents.length);
  const averageDocLength = documents.reduce((sum, document) => sum + document.docLength, 0) / docCount;
  const idf = new Map();
  for (const [term, df] of docFrequencies) {
    idf.set(term, Math.log((docCount - df + 0.5) / (df + 0.5) + 1));
  }

  return { documents, idf, averageDocLength };
}

function scoreDocument(queryCounts, document, idf, averageDocLength, options) {
  const k1 = Number.isFinite(options.k1) ? options.k1 : 1.5;
  const b = Number.isFinite(options.b) ? options.b : 0.75;
  const docLength = Math.max(1, document.docLength);
  const docLengthNorm = (1 - b) + (b * (docLength / Math.max(1, averageDocLength)));
  const matchedTerms = new Set();
  let score = 0;

  for (const [token, queryFrequency] of queryCounts) {
    const tf = document.termCounts.get(token);
    if (!tf) continue;
    matchedTerms.add(token);
    const numerator = queryFrequency * tf * (k1 + 1);
    const denominator = tf + k1 * docLengthNorm;
    score += (idf.get(token) || 0) * (denominator === 0 ? 0 : numerator / denominator);
  }

  return {
    id: document.id,
    title: document.title,
    tenant: document.tenant,
    score,
    matchedTerms: uniqueSorted([...matchedTerms]),
    evidenceRefs: document.evidenceRefs,
  };
}

export function buildVectorRuntimeIndex({ plan, corpus, engineAdapter } = {}) {
  validatePlan(plan);
  if (!Array.isArray(corpus) || corpus.length === 0) {
    throw new Error('corpus must be a non-empty array');
  }

  const decisionTrace = resolveRuntimeDecision(plan, engineAdapter);
  if (decisionTrace.selectedMode !== TFIDF_MODE) {
    throw new Error('non-fallback ANN runtime is not enabled in this snapshot');
  }

  const fallbackIndex = buildTfidfIndex(corpus);
  return {
    kind: 'CortexABVVectorRuntimeIndex',
    version: 'v1',
    mode: decisionTrace.selectedMode,
    decisionTrace,
    documentCount: fallbackIndex.documents.length,
    fallbackIndex,
  };
}

export function queryVectorRuntimeIndex({ index, query, topK, minCandidateScore = 0, k1 = 1.5, b = 0.75 } = {}) {
  requireObject(index, 'index');
  const queryRaw = requireNonEmptyString(query, 'query');
  const queryTokens = tokenize(queryRaw);
  if (queryTokens.length === 0) throw new Error('query must contain at least one indexable token');
  const queryCounts = new Map();
  for (const token of queryTokens) {
    queryCounts.set(token, (queryCounts.get(token) || 0) + 1);
  }

  const limit = Number.isInteger(topK) && topK > 0 ? topK : 10;
  const threshold = Number.isFinite(minCandidateScore) && minCandidateScore >= 0 ? minCandidateScore : 0;
  const { documents, idf, averageDocLength } = index.fallbackIndex;

  return documents
    .map((document) => scoreDocument(queryCounts, document, idf, averageDocLength, { k1, b }))
    .filter((candidate) => candidate.score >= threshold)
    .sort((a, bScore) => (bScore.score - a.score) || a.id.localeCompare(bScore.id))
    .slice(0, limit);
}
