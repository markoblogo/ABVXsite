import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeControlledModulePocReviewGate } from '../src/vector-runtime-controlled-module-poc-review.mjs';

const reviewPath = path.join(import.meta.dirname, '../config/vector-runtime-controlled-module-poc-review.v1.json');
const designReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-controlled-module-design-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-controlled-module-poc-review-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

test('validates controlled module POC review scope without approving harness implementation', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-controlled-module-poc-review-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-controlled-module-poc-review-receipt.v1.json');
  const receipt = runVectorRuntimeControlledModulePocReviewGate({
    reviewPath,
    designReceiptPath,
    receiptPath,
    runAt: '2026-07-22T23:30:00.000Z',
  });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeControlledModulePocReviewReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_controlled_runtime_module_harness_dry_run_review');
  assert.equal(receipt.governance.harnessImplementationApproved, false);
  assert.equal(receipt.governance.runtimeWiringApproved, false);
  assert.equal(receipt.governance.runtimeIntegration, false);
  assert.equal(receipt.minimumHarnessScope.futureHarnessPath, 'src/vector-runtime-controlled-module-harness.mjs');
  assert.deepEqual(receipt.minimumHarnessScope.allowedDryRunCommands, [
    'load_index_artifact_poc_dry_run',
    'query_candidates_poc_dry_run',
    'verify_claim_evidence_poc_dry_run',
  ]);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.digests.controlledModuleDesignReceiptDigest, receipt.digests.controlledModuleDesignReceiptDigest);
});

test('blocks controlled module POC review when Stage 4i design receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(designReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'design', id: 'no_endpoint', status: 'blocked' }],
  }));

  const receipt = runVectorRuntimeControlledModulePocReviewGate({
    reviewPath,
    designReceiptPath: badReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'designReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks controlled module POC review when harness implementation is pre-approved', () => {
  const badReviewPath = writeTempJson(reviewPath, (review) => ({
    ...review,
    harnessScope: {
      ...review.harnessScope,
      implementationApproved: true,
    },
    governance: {
      ...review.governance,
      harnessImplementationApproved: true,
    },
  }));

  const receipt = runVectorRuntimeControlledModulePocReviewGate({
    reviewPath: badReviewPath,
    designReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_implementation_approval'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'governance_harnessImplementationApproved'), true);
});
