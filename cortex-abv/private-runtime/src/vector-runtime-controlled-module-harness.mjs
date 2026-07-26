import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const STOP_WORDS = new Set(['the', 'and', 'of', 'a', 'an', 'to', 'in', 'for', 'on', 'with', 'is', 'are', 'was', 'were', 'this', 'that', 'about']);

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function requireNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
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

function artifactForDigest(artifact) {
  const { indexDigest, ...rest } = artifact;
  return rest;
}

function validateArtifactGovernance(artifact) {
  const governance = artifact.governance || {};
  if (governance.localArtifactOnly !== true) throw new Error('artifact must be localArtifactOnly');
  if (governance.committed !== false) throw new Error('artifact must not be committed');
  if (governance.endpoint !== false) throw new Error('artifact endpoint must be false');
  if (governance.networkCalls !== false) throw new Error('artifact networkCalls must be false');
  if (governance.llmCalls !== false) throw new Error('artifact llmCalls must be false');
  if (governance.publicActionAuthority !== false) throw new Error('artifact publicActionAuthority must be false');
}

export function loadIndexArtifact({ artifactPath, expectedIndexDigest, expectedSourceDigest, expectedStage4jReceiptDigest, stage4jReceipt } = {}) {
  const resolvedPath = requireNonEmptyString(artifactPath, 'artifactPath');
  const artifact = JSON.parse(readFileSync(resolvedPath, 'utf8'));
  requireObject(artifact, 'artifact');
  if (artifact.kind !== 'CortexABVVectorRuntimeIndexArtifact') throw new Error('artifact kind must be CortexABVVectorRuntimeIndexArtifact');
  if (artifact.version !== 'v1') throw new Error('artifact version must be v1');
  if (!Array.isArray(artifact.documents) || artifact.documents.length === 0) throw new Error('artifact documents must be a non-empty array');
  validateArtifactGovernance(artifact);

  const computedIndexDigest = sha256(artifactForDigest(artifact));
  const storedIndexDigest = requireNonEmptyString(artifact.indexDigest, 'artifact.indexDigest');
  if (storedIndexDigest !== computedIndexDigest) throw new Error('artifact indexDigest does not match artifact contents');
  if (expectedIndexDigest && expectedIndexDigest !== computedIndexDigest) throw new Error('artifact indexDigest does not match expected digest');
  const sourceDigest = requireNonEmptyString(artifact.source?.sourceDigest, 'artifact.source.sourceDigest');
  if (expectedSourceDigest && expectedSourceDigest !== sourceDigest) throw new Error('artifact sourceDigest does not match expected source digest');

  const computedStage4jReceiptDigest = stage4jReceipt ? sha256(stage4jReceipt) : undefined;
  if (expectedStage4jReceiptDigest && computedStage4jReceiptDigest !== expectedStage4jReceiptDigest) {
    throw new Error('Stage 4j receipt digest does not match expected digest');
  }

  return {
    artifact,
    digests: {
      indexDigest: computedIndexDigest,
      sourceDigest,
      stage4jReceiptDigest: computedStage4jReceiptDigest,
    },
    decisionTrace: {
      policySource: 'stage4h_artifact_plus_stage4j_receipt_digest',
      artifactReadOnly: true,
      endpoint: false,
      networkCalls: false,
      llmCalls: false,
      publicActionAuthority: false,
    },
  };
}

function scoreCandidate({ queryTokens, document, idf, averageDocLength, k1 = 1.5, b = 0.75 }) {
  const termCounts = document.termCounts || {};
  const docLength = Math.max(1, document.docLength || Object.values(termCounts).reduce((sum, value) => sum + value, 0));
  const docLengthNorm = (1 - b) + (b * (docLength / Math.max(1, averageDocLength || docLength)));
  const matchedTerms = new Set();
  let score = 0;
  for (const token of queryTokens) {
    const tf = termCounts[token] || 0;
    if (!tf) continue;
    matchedTerms.add(token);
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * docLengthNorm;
    score += (idf[token] || 0) * (denominator === 0 ? 0 : numerator / denominator);
  }
  return {
    candidateId: document.id,
    score,
    matchedTerms: [...matchedTerms].sort(),
    evidenceRefs: document.evidenceRefs || [],
    tenant: document.tenant,
  };
}

export function queryCandidates({ loadedIndex, query, tenant, topK = 3, minScore = 0.05 } = {}) {
  requireObject(loadedIndex, 'loadedIndex');
  const queryText = requireNonEmptyString(query, 'query');
  const tenantScope = requireNonEmptyString(tenant, 'tenant');
  const artifact = loadedIndex.artifact || loadedIndex;
  const queryTokens = tokenize(queryText);
  if (queryTokens.length === 0) throw new Error('query must contain at least one indexable token');
  const limit = Number.isInteger(topK) && topK > 0 ? topK : 3;
  const threshold = Number.isFinite(minScore) && minScore >= 0 ? minScore : 0.05;
  const candidates = artifact.documents
    .filter((document) => document.tenant === tenantScope)
    .map((document) => scoreCandidate({
      queryTokens,
      document,
      idf: artifact.idf || {},
      averageDocLength: artifact.averageDocLength,
    }))
    .filter((candidate) => candidate.score >= threshold)
    .sort((a, b) => (b.score - a.score) || a.candidateId.localeCompare(b.candidateId))
    .slice(0, limit);
  return {
    query: queryText,
    tenant: tenantScope,
    topK: limit,
    minScore: threshold,
    candidates,
    decisionTrace: {
      tenantScope,
      hardThreshold: threshold,
      candidatesOnly: true,
      answerGeneration: false,
    },
  };
}

export function verifyClaimEvidence({ candidates } = {}) {
  if (!Array.isArray(candidates)) throw new Error('candidates must be an array');
  const missingEvidenceRefs = candidates
    .filter((candidate) => !Array.isArray(candidate.evidenceRefs) || candidate.evidenceRefs.length === 0)
    .map((candidate) => candidate.candidateId);
  return {
    passed: missingEvidenceRefs.length === 0,
    missingEvidenceRefs,
    decisionTrace: {
      requiresEvidenceRefs: true,
      checkedCandidateCount: candidates.length,
    },
  };
}
