import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeLocalActivationStateTransitionReviewGate } from '../src/vector-runtime-local-activation-state-transition-review.mjs';

const reviewPath = path.join(import.meta.dirname, '../config/vector-runtime-local-activation-state-transition-review.v1.json');
const stage4wReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-local-activation-state-review-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-activation-state-transition-review-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeLocalActivationStateTransitionReviewGate({
    reviewPath,
    stage4wReceiptPath,
    runAt: '2026-07-26T18:55:00.000Z',
    ...overrides,
  });
}

test('validates local activation state transition review without applying transition', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-activation-state-transition-review-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-local-activation-state-transition-review-receipt.v1.json');
  const receipt = runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeLocalActivationStateTransitionReviewReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_local_activation_state_transition_artifact');
  assert.equal(receipt.transitionDefinition.stateTransitionAppliedHere, false);
  assert.equal(receipt.transitionDefinition.targetState, 'bounded_owner_invoked_local_active_runtime');
  assert.equal(receipt.governance.runtimeActivationApplied, false);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4wReceiptDigest, receipt.stage4wReceiptDigest);
});

test('blocks local activation state transition review when Stage 4w receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4wReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'stage4vReceipt', id: 'owner_approval_approved', status: 'blocked' }],
  }));
  const receipt = runWith({ stage4wReceiptPath: badReceiptPath });
  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4wReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks local activation state transition review when activation-applied or endpoint authority appears', () => {
  const badReceiptPath = writeTempJson(stage4wReceiptPath, (receipt) => ({
    ...receipt,
    governance: {
      ...receipt.governance,
      endpoint: true,
    },
  }));
  const badReviewPath = writeTempJson(reviewPath, (review) => ({
    ...review,
    transitionDefinition: {
      ...review.transitionDefinition,
      stateTransitionAppliedHere: true,
    },
  }));
  const receipt = runWith({ reviewPath: badReviewPath, stage4wReceiptPath: badReceiptPath });
  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'transition_not_applied_here'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4wReceipt' && blocker.id === 'no_endpoint'), true);
});
