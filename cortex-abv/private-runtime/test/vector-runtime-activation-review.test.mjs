import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeActivationReviewGate } from '../src/vector-runtime-activation-review.mjs';

const reviewPath = path.join(import.meta.dirname, '../config/vector-runtime-activation-review.v1.json');
const stage4oReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-controlled-wiring-review-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-activation-review-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

test('validates runtime activation review without activating runtime', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-activation-review-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-activation-review-receipt.v1.json');
  const receipt = runVectorRuntimeActivationReviewGate({
    reviewPath,
    stage4oReceiptPath,
    receiptPath,
    runAt: '2026-07-26T15:00:00.000Z',
  });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeActivationReviewReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_runtime_activation_dry_run_review');
  assert.equal(receipt.governance.activationReviewOnly, true);
  assert.equal(receipt.governance.runtimeActivationApproved, false);
  assert.equal(receipt.governance.runtimeIntegration, false);
  assert.equal(receipt.governance.endpoint, false);
  assert.equal(receipt.activationDefinition.activationMode, 'local_process_bound_callable_only');
  assert.equal(receipt.activationDefinition.runtimeActivationApprovedHere, false);
  assert.equal(receipt.activationDryRunScope.targetEligibility, 'eligible_for_runtime_activation_dry_run_review');
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4oReceiptDigest, receipt.stage4oReceiptDigest);
});

test('blocks runtime activation review when Stage 4o receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4oReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'stage4nReceipt', id: 'evidence_verified', status: 'blocked' }],
  }));

  const receipt = runVectorRuntimeActivationReviewGate({
    reviewPath,
    stage4oReceiptPath: badReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4oReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks runtime activation review when activation, endpoint or network authority is introduced', () => {
  const badReviewPath = writeTempJson(reviewPath, (review) => ({
    ...review,
    activationDefinition: {
      ...review.activationDefinition,
      runtimeActivationApprovedHere: true,
      endpointAllowed: true,
      networkCallsAllowed: true,
      answerGenerationAllowed: true,
    },
    governance: {
      ...review.governance,
      runtimeActivationApproved: true,
      runtimeIntegration: true,
      endpoint: true,
      networkCalls: true,
    },
  }));

  const receipt = runVectorRuntimeActivationReviewGate({
    reviewPath: badReviewPath,
    stage4oReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_activation_here'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_endpoint'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_network'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'governance_runtimeActivationApproved'), true);
});
