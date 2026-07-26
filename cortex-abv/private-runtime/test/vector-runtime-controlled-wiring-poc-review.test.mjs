import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeControlledWiringPocReviewGate } from '../src/vector-runtime-controlled-wiring-poc-review.mjs';

const reviewPath = path.join(import.meta.dirname, '../config/vector-runtime-controlled-wiring-poc-review.v1.json');
const stage4lReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-controlled-wiring-design-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-wiring-poc-review-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

test('validates controlled wiring POC review scope without approving implementation or activation', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-wiring-poc-review-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-controlled-wiring-poc-review-receipt.v1.json');
  const receipt = runVectorRuntimeControlledWiringPocReviewGate({
    reviewPath,
    stage4lReceiptPath,
    receiptPath,
    runAt: '2026-07-26T12:00:00.000Z',
  });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeControlledWiringPocReviewReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_controlled_runtime_wiring_poc_dry_run_review');
  assert.equal(receipt.governance.controlledWiringPocApproved, false);
  assert.equal(receipt.governance.wiringImplementationApproved, false);
  assert.equal(receipt.governance.runtimeActivationApproved, false);
  assert.equal(receipt.governance.runtimeIntegration, false);
  assert.equal(receipt.minimumPocScope.bindingMode, 'in_process_local_library_binding_only');
  assert.deepEqual(receipt.minimumPocScope.allowedBindings, [
    'loadIndexArtifact',
    'queryCandidates',
    'verifyClaimEvidence',
  ]);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4lReceiptDigest, receipt.stage4lReceiptDigest);
});

test('blocks controlled wiring POC review when Stage 4l receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4lReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'design', id: 'no_endpoint', status: 'blocked' }],
  }));

  const receipt = runVectorRuntimeControlledWiringPocReviewGate({
    reviewPath,
    stage4lReceiptPath: badReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4lReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks controlled wiring POC review when endpoint, activation or non-allowlisted binding is introduced', () => {
  const badReviewPath = writeTempJson(reviewPath, (review) => ({
    ...review,
    pocScope: {
      ...review.pocScope,
      endpointAllowed: true,
      allowedBindings: [...review.pocScope.allowedBindings, 'generateAnswer'],
    },
    dryRunCommandPolicy: {
      ...review.dryRunCommandPolicy,
      activateRuntimeAllowed: true,
    },
    governance: {
      ...review.governance,
      controlledWiringPocApproved: true,
      runtimeActivationApproved: true,
      endpoint: true,
    },
  }));

  const receipt = runVectorRuntimeControlledWiringPocReviewGate({
    reviewPath: badReviewPath,
    stage4lReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_endpoint'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'allowed_bindings'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_runtime_activation_command'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'governance_controlledWiringPocApproved'), true);
});
