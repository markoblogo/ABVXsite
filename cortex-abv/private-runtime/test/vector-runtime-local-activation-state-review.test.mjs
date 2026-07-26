import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeLocalActivationStateReviewGate } from '../src/vector-runtime-local-activation-state-review.mjs';

const reviewPath = path.join(import.meta.dirname, '../config/vector-runtime-local-activation-state-review.v1.json');
const stage4vReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-local-activation-dry-run-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-activation-state-review-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeLocalActivationStateReviewGate({
    reviewPath,
    stage4vReceiptPath,
    runAt: '2026-07-26T18:45:00.000Z',
    ...overrides,
  });
}

test('validates local activation state review without applying activation', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-activation-state-review-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-local-activation-state-review-receipt.v1.json');
  const receipt = runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeLocalActivationStateReviewReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_local_activation_state_transition_review');
  assert.equal(receipt.stateDefinition.stateExists, true);
  assert.equal(receipt.stateDefinition.stateTransitionAllowedHere, false);
  assert.equal(receipt.governance.runtimeActivationApplied, false);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4vReceiptDigest, receipt.stage4vReceiptDigest);
});

test('blocks local activation state review when Stage 4v receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4vReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'queries', id: 'query_local-activation-query-index-summary_passed', status: 'blocked' }],
  }));

  const receipt = runWith({ stage4vReceiptPath: badReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4vReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks local activation state review when activation-applied or endpoint authority appears', () => {
  const badReceiptPath = writeTempJson(stage4vReceiptPath, (receipt) => ({
    ...receipt,
    module: {
      ...receipt.module,
      activationApplied: true,
    },
    governance: {
      ...receipt.governance,
      endpoint: true,
    },
  }));

  const receipt = runWith({ stage4vReceiptPath: badReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4vReceipt' && blocker.id === 'activation_applied_false'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4vReceipt' && blocker.id === 'no_endpoint'), true);
});
