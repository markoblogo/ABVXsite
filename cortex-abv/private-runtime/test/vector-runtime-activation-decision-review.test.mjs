import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeActivationDecisionReviewGate } from '../src/vector-runtime-activation-decision-review.mjs';

const reviewPath = path.join(import.meta.dirname, '../config/vector-runtime-activation-decision-review.v1.json');
const stage4sReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-readiness-review-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-activation-decision-review-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeActivationDecisionReviewGate({
    reviewPath,
    stage4sReceiptPath,
    runAt: '2026-07-26T18:10:00.000Z',
    ...overrides,
  });
}

test('validates bounded local activation decision scope without activating runtime', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-activation-decision-review-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-activation-decision-review-receipt.v1.json');
  const receipt = runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeActivationDecisionReviewReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_local_runtime_activation_decision');
  assert.equal(receipt.localActivationScope.activationMode, 'same_process_owner_invoked_callable_only');
  assert.equal(receipt.localActivationScope.endpointAllowed, false);
  assert.equal(receipt.decisionBoundary.runtimeActivationApprovedHere, false);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4sReceiptDigest, receipt.stage4sReceiptDigest);
});

test('blocks activation decision review when Stage 4s receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4sReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'stage4rReceipt', id: 'queries_all_passed', status: 'blocked' }],
  }));

  const receipt = runWith({ stage4sReceiptPath: badReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4sReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks activation decision review when Stage 4s introduces endpoint or exposed activation', () => {
  const badReceiptPath = writeTempJson(stage4sReceiptPath, (receipt) => ({
    ...receipt,
    readinessSignals: {
      ...receipt.readinessSignals,
      module: {
        ...receipt.readinessSignals.module,
        activationNotExposed: false,
      },
    },
    governance: {
      ...receipt.governance,
      endpoint: true,
    },
  }));

  const receipt = runWith({ stage4sReceiptPath: badReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4sReceipt' && blocker.id === 'activation_not_exposed'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4sReceipt' && blocker.id === 'no_endpoint'), true);
});
