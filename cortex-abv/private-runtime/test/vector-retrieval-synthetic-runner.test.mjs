import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRetrievalShadow } from '../src/vector-retrieval-synthetic-runner.mjs';

const fixturePath = path.join(import.meta.dirname, '../examples/synthetic-vector-retrieval-benchmark.v1.json');
const planPath = path.join(import.meta.dirname, '../config/vector-retrieval-turbovec-pilot.v1.json');

function readFixture(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

test('synthetic vector shadow benchmark run computes recall and top-k', () => {
  const receipt = runVectorRetrievalShadow({
    planPath,
    benchmarkPath: fixturePath,
  });

  assert.equal(receipt.kind, 'CortexABVVectorRetrievalShadowReceipt');
  assert.equal(receipt.mode, 'synthetic_shadow');
  assert.equal(receipt.metrics.probeCount, readFixture(fixturePath).probes.length);
  assert.equal(Array.isArray(receipt.results), true);
  assert.equal(receipt.results.every((probe) => probe.status === 'passed'), true);
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.metrics.passedAllProbes, true);
  assert.equal(receipt.metrics.recallAtK >= readFixture(fixturePath).evaluation.minRecallAtK, true);
  assert.equal(receipt.decisionTrace.policySource, 'base');
  assert.equal(receipt.decisionTrace.claimEvidence.length >= 1, true);
  assert.equal(receipt.metrics.avgTopScore >= 0, true);
});

test('shadow run requires evidence claim anchors in decisionTrace', () => {
  const receipt = runVectorRetrievalShadow({
    planPath,
    benchmarkPath: fixturePath,
  });

  assert.equal(receipt.review.requiredFields.includes('decisionTrace.claimEvidence'), true);
  const allHaveEvidence = receipt.decisionTrace.claimEvidence.every((item) => Array.isArray(item.evidenceRefs) && item.evidenceRefs.length > 0);
  assert.equal(allHaveEvidence, true);
  assert.equal(receipt.metrics.maxRunMs >= 1, true);
});
