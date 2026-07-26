import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeActivationDryRunReviewGate } from '../src/vector-runtime-activation-dry-run-review.mjs';

const reviewPath = path.join(import.meta.dirname, '../config/vector-runtime-activation-dry-run-review.v1.json');
const stage4pReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-activation-review-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-activation-dry-run-review-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

test('validates activation dry-run review scope without activating runtime', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-activation-dry-run-review-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-activation-dry-run-review-receipt.v1.json');
  const receipt = runVectorRuntimeActivationDryRunReviewGate({
    reviewPath,
    stage4pReceiptPath,
    receiptPath,
    runAt: '2026-07-26T16:00:00.000Z',
  });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeActivationDryRunReviewReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_runtime_activation_dry_run');
  assert.equal(receipt.governance.activationDryRunReviewOnly, true);
  assert.equal(receipt.governance.runtimeActivationApproved, false);
  assert.equal(receipt.governance.runtimeIntegration, false);
  assert.equal(receipt.dryRunScope.targetEligibility, 'eligible_for_runtime_activation_dry_run');
  assert.equal(receipt.dryRunScope.activationMode, 'local_process_bound_callable_only');
  assert.deepEqual(receipt.dryRunScope.writesAllowed, ['receipt_only']);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4pReceiptDigest, receipt.stage4pReceiptDigest);
});

test('blocks activation dry-run review when Stage 4p receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4pReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'review', id: 'no_endpoint', status: 'blocked' }],
  }));

  const receipt = runVectorRuntimeActivationDryRunReviewGate({
    reviewPath,
    stage4pReceiptPath: badReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4pReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks activation dry-run review when activation, network or shell authority is introduced', () => {
  const badReviewPath = writeTempJson(reviewPath, (review) => ({
    ...review,
    forbiddenAuthority: {
      ...review.forbiddenAuthority,
      runtimeActivationAllowed: true,
      networkCallsAllowed: true,
      shellAccessAllowed: true,
    },
    dryRunScope: {
      ...review.dryRunScope,
      writesAllowed: ['receipt_only', 'index_artifact'],
    },
    governance: {
      ...review.governance,
      runtimeActivationApproved: true,
      runtimeIntegration: true,
      networkCalls: true,
    },
  }));

  const receipt = runVectorRuntimeActivationDryRunReviewGate({
    reviewPath: badReviewPath,
    stage4pReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_runtime_activation'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_network'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_shell_access'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'receipt_only_writes'), true);
});
