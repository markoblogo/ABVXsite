import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVectorRuntimeIndex, queryVectorRuntimeIndex } from '../src/vector-runtime-shim.mjs';

const planPath = path.join(import.meta.dirname, '../config/vector-retrieval-turbovec-pilot.v1.json');
const benchmarkPath = path.join(import.meta.dirname, '../examples/synthetic-vector-retrieval-benchmark.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

test('builds a synthetic vector runtime index with tf-idf fallback under ANN intent', () => {
  const plan = readJson(planPath);
  const benchmark = readJson(benchmarkPath);

  const index = buildVectorRuntimeIndex({ plan, corpus: benchmark.corpus });

  assert.equal(index.kind, 'CortexABVVectorRuntimeIndex');
  assert.equal(index.mode, 'tfidf-lite');
  assert.equal(index.decisionTrace.requestedMode, 'ann_with_tfidf_fallback');
  assert.equal(index.decisionTrace.runtimeReady, false);
  assert.equal(index.decisionTrace.fallbackApplied, true);
  assert.equal(index.documentCount, benchmark.corpus.length);
});

test('queries the synthetic runtime index with evidence-carrying candidates', () => {
  const plan = readJson(planPath);
  const benchmark = readJson(benchmarkPath);
  const index = buildVectorRuntimeIndex({ plan, corpus: benchmark.corpus });

  const candidates = queryVectorRuntimeIndex({
    index,
    query: 'Monitor MN7R repository readiness status',
    topK: 2,
    minCandidateScore: 0.05,
  });

  assert.equal(candidates.length > 0, true);
  assert.equal(candidates[0].id, 'pp-monitor-mn7r-dashboard');
  assert.equal(candidates.every((candidate) => Array.isArray(candidate.evidenceRefs) && candidate.evidenceRefs.length > 0), true);
});
