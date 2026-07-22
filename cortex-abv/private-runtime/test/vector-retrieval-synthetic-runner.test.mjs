import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRetrievalShadow } from '../src/vector-retrieval-synthetic-runner.mjs';

const fixturePath = path.join(import.meta.dirname, '../examples/synthetic-vector-retrieval-benchmark.v1.json');
const planPath = path.join(import.meta.dirname, '../config/vector-retrieval-turbovec-pilot.v1.json');

function readFixture(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function withTempBenchmark(mutator) {
  const fixture = readFixture(fixturePath);
  const updated = mutator(fixture);
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-vector-bench-'));
  const tmpFile = path.join(tmpDir, 'synthetic-vector-retrieval-benchmark.v1.json');
  writeFileSync(tmpFile, `${JSON.stringify(updated, null, 2)}\n`);
  return tmpFile;
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

test('hard score threshold can block top-k candidate path', () => {
  const strictBenchmark = withTempBenchmark((fixture) => ({
    ...fixture,
    evaluation: {
      ...fixture.evaluation,
      minCandidateScore: 10,
    },
  }));

  const receipt = runVectorRetrievalShadow({
    planPath,
    benchmarkPath: strictBenchmark,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.decisionTrace.hardThresholdPassed, false);
  assert.equal(receipt.metrics.passedAllProbes, false);
});

test('missing candidate evidence anchors blocks proposal status', () => {
  const strictEvidenceBenchmark = withTempBenchmark((fixture) => ({
    ...fixture,
    evaluation: {
      ...fixture.evaluation,
      minEvidenceRefsPerCandidate: 2,
    },
  }));

  const receipt = runVectorRetrievalShadow({
    planPath,
    benchmarkPath: strictEvidenceBenchmark,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.decisionTrace.missingEvidence.length > 0, true);
  assert.equal(Array.isArray(receipt.decisionTrace.missingEvidence), true);
});
