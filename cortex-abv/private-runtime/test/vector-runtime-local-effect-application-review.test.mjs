import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeLocalEffectApplicationReview } from '../src/vector-runtime-local-effect-application-review.mjs';

const reviewPath = path.join(import.meta.dirname, '../config/vector-runtime-local-effect-application-review.v1.json');
const stage4abReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-local-transition-state-effect-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-effect-application-review-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeLocalEffectApplicationReview({
    reviewPath,
    stage4abReceiptPath,
    runAt: '2026-07-27T00:00:00.000Z',
    ...overrides,
  });
}

test('evaluates local effect application review without applying any effect', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-effect-application-review-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-local-effect-application-review-receipt.v1.json');
  const receipt = runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeLocalEffectApplicationReviewReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_local_effect_application');
  assert.equal(receipt.applicationDefinition.appliesEffectHere, false);
  assert.equal(receipt.applicationDefinition.runtimeActivationAppliedHere, false);
  assert.equal(receipt.applicationDefinition.stateTransitionAppliedHere, false);
  assert.equal(receipt.governance.runtimeActivationApplied, false);
  assert.equal(receipt.governance.stateTransitionApplied, false);
  assert.equal(receipt.governance.endpoint, false);
  assert.equal(receipt.decisionTrace.runtimeActivationAllowed, false);
  assert.equal(receipt.decisionTrace.stateTransitionAllowed, false);
  assert.equal(receipt.decisionTrace.effectApplicationAllowed, false);
  assert.equal(receipt.decisionTrace.nextAllowedStep, 'local_effect_application_discussion_only');
  assert.equal(persisted.stage4abReceiptDigest, receipt.stage4abReceiptDigest);
});

test('blocks local effect application review when Stage 4ab receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4abReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'artifact', id: 'effect_applied_here', status: 'blocked' }],
  }));
  const receipt = runWith({ stage4abReceiptPath: badReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4abReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks local effect application review when effect application or endpoint scope is introduced', () => {
  const badReviewPath = writeTempJson(reviewPath, (review) => ({
    ...review,
    applicationDefinition: {
      ...review.applicationDefinition,
      appliesEffectHere: true,
      runtimeActivationAppliedHere: true,
    },
    forbiddenAuthority: {
      ...review.forbiddenAuthority,
      endpointAllowed: true,
    },
  }));
  const receipt = runWith({ reviewPath: badReviewPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_application_local'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_activation_local'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'forbidden_endpointAllowed'), true);
});
