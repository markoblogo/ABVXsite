import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeLocalTransitionStateEffectReviewGate } from '../src/vector-runtime-local-transition-state-effect-review.mjs';

const reviewPath = path.join(import.meta.dirname, '../config/vector-runtime-local-transition-state-effect-review.v1.json');
const stage4zReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-local-activation-state-transition-dry-run-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-transition-state-effect-review-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeLocalTransitionStateEffectReviewGate({
    reviewPath,
    stage4zReceiptPath,
    runAt: '2026-07-26T22:55:00.000Z',
    ...overrides,
  });
}

test('validates local transition state effect review without applying any effect', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-transition-state-effect-review-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-local-transition-state-effect-review-receipt.v1.json');
  const receipt = runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeLocalTransitionStateEffectReviewReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_local_transition_state_effect_artifact');
  assert.equal(receipt.effectDefinition.effectAppliedHere, false);
  assert.equal(receipt.effectDefinition.stateTransitionAppliedHere, false);
  assert.equal(receipt.governance.runtimeActivationApplied, false);
  assert.equal(receipt.governance.stateTransitionApplied, false);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4zReceiptDigest, receipt.stage4zReceiptDigest);
});

test('blocks local transition state effect review when Stage 4z receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4zReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'artifact', id: 'artifact_read_only', status: 'blocked' }],
  }));
  const receipt = runWith({ stage4zReceiptPath: badReceiptPath });
  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4zReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks local transition state effect review when effect-applied or endpoint authority appears', () => {
  const badReceiptPath = writeTempJson(stage4zReceiptPath, (receipt) => ({
    ...receipt,
    governance: {
      ...receipt.governance,
      endpoint: true,
    },
  }));
  const badReviewPath = writeTempJson(reviewPath, (review) => ({
    ...review,
    effectDefinition: {
      ...review.effectDefinition,
      effectAppliedHere: true,
    },
  }));
  const receipt = runWith({ reviewPath: badReviewPath, stage4zReceiptPath: badReceiptPath });
  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'effect_not_applied_here'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4zReceipt' && blocker.id === 'no_endpoint'), true);
});
