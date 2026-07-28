import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeLocalEffectTransitionReview } from '../src/vector-runtime-local-effect-transition-review.mjs';

const reviewPath = path.join(import.meta.dirname, '../config/vector-runtime-local-effect-transition-review.v1.json');
const stage4afReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-local-effect-transition-dry-run-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-effect-transition-review-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeLocalEffectTransitionReview({
    reviewPath,
    stage4afReceiptPath,
    runAt: '2026-07-28T20:10:00.000Z',
    ...overrides,
  });
}

test('validates local effect transition review in proposal-only receipt corridor', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-effect-transition-review-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-local-effect-transition-review-receipt.v1.json');
  const receipt = runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeLocalEffectTransitionReviewReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_local_effect_transition_review');
  assert.equal(receipt.governance.runtimeActivationApplied, false);
  assert.equal(receipt.governance.stateTransitionApplied, false);
  assert.equal(receipt.transitionDefinition.runtimeActivationAppliedHere, false);
  assert.equal(receipt.transitionDefinition.stateTransitionAppliedHere, false);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4afReceiptDigest.length, 64);
});

test('blocks local effect transition review when Stage 4af dry-run receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4afReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'transition', id: 'dry_run_passed', status: 'blocked' }],
  }));
  const receipt = runWith({ stage4afReceiptPath: badReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4afReceipt' && blocker.id === 'status'), true);
});

test('blocks local effect transition review when applied authority appears in review definition', () => {
  const badReviewPath = writeTempJson(reviewPath, (review) => ({
    ...review,
    transitionDefinition: {
      ...review.transitionDefinition,
      effectTransitionAppliedHere: true,
      stateTransitionAppliedHere: true,
      runtimeActivationAppliedHere: true,
      endpointAllowed: true,
    },
    forbiddenAuthority: {
      ...review.forbiddenAuthority,
      crossTenantQueriesAllowed: false,
      endpointAllowed: true,
    },
  }));
  const receipt = runWith({ reviewPath: badReviewPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'transition_definition_effectTransitionAppliedHere'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'transition_definition_runtimeActivationAppliedHere'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'forbidden_endpointAllowed'), true);
});
