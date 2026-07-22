import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeIntegrationPreflight } from '../src/vector-runtime-integration-preflight.mjs';

const receiptsDir = path.join(import.meta.dirname, '../receipts');
const packagePolicyReceiptPath = path.join(receiptsDir, 'vector-runtime-package-policy-receipt.v1.json');
const dependencyProbeReceiptPath = path.join(receiptsDir, 'vector-runtime-dependency-probe-receipt.v1.json');
const readinessReceiptPath = path.join(receiptsDir, 'vector-runtime-readiness-receipt.v1.json');
const syntheticRetrievalReceiptPath = path.join(receiptsDir, 'vector-retrieval-turbovec-shadow-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempReceipt(mutator, sourcePath) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-preflight-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runPreflight(overrides = {}) {
  return runVectorRuntimeIntegrationPreflight({
    packagePolicyReceiptPath,
    dependencyProbeReceiptPath,
    readinessReceiptPath,
    syntheticRetrievalReceiptPath,
    runAt: '2026-07-22T19:30:00.000Z',
    ...overrides,
  });
}

test('aggregates vector receipts into eligible-for-design-review preflight', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-preflight-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-integration-preflight-receipt.v1.json');
  const receipt = runPreflight({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeIntegrationPreflightReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_design_review');
  assert.equal(receipt.governance.runtimeIntegration, false);
  assert.equal(receipt.governance.designReviewOnly, true);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(receipt.gates.packagePolicy.every((gate) => gate.status === 'accepted'), true);
  assert.equal(receipt.gates.dependencyProbe.every((gate) => gate.status === 'accepted'), true);
  assert.deepEqual(persisted.eligibility, receipt.eligibility);
});

test('blocks preflight when dependency probe does not reference package policy digest', () => {
  const badDependencyPath = writeTempReceipt((receipt) => ({
    ...receipt,
    packagePolicy: {
      ...receipt.packagePolicy,
      policyDigest: 'bad-digest',
    },
  }), dependencyProbeReceiptPath);

  const receipt = runPreflight({ dependencyProbeReceiptPath: badDependencyPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible_for_design_review');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'dependencyProbe' && blocker.id === 'package_policy_digest'), true);
  assert.equal(receipt.review.pendingReview, false);
});

test('blocks preflight when synthetic retrieval no longer passes evidence gates', () => {
  const badRetrievalPath = writeTempReceipt((receipt) => ({
    ...receipt,
    status: 'blocked',
    metrics: {
      ...receipt.metrics,
      passedAllProbes: false,
      evidenceCoverage: 0.5,
    },
  }), syntheticRetrievalReceiptPath);

  const receipt = runPreflight({ syntheticRetrievalReceiptPath: badRetrievalPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible_for_design_review');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'syntheticRetrieval'), true);
});
