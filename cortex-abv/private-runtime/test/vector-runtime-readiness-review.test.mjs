import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeReadinessReviewGate } from '../src/vector-runtime-readiness-review.mjs';

const reviewPath = path.join(import.meta.dirname, '../config/vector-runtime-readiness-review.v1.json');
const stage4rReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-activation-dry-run-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-readiness-review-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeReadinessReviewGate({
    reviewPath,
    stage4rReceiptPath,
    runAt: '2026-07-26T18:00:00.000Z',
    ...overrides,
  });
}

test('validates runtime readiness signals without activation', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-readiness-review-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-readiness-review-receipt.v1.json');
  const receipt = runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeReadinessReviewReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_runtime_activation_decision_review');
  assert.equal(receipt.governance.runtimeActivationApproved, false);
  assert.equal(receipt.readinessSignals.module.importable, true);
  assert.equal(receipt.readinessSignals.artifact.readOnly, true);
  assert.equal(receipt.readinessSignals.queries.allPassed, true);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4rReceiptDigest, receipt.stage4rReceiptDigest);
});

test('blocks readiness review when Stage 4r receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4rReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'design', id: 'stage4q_eligibility', status: 'blocked' }],
  }));

  const receipt = runWith({ stage4rReceiptPath: badReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4rReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks readiness review when activation exposure or endpoint authority appears in Stage 4r receipt', () => {
  const badReceiptPath = writeTempJson(stage4rReceiptPath, (receipt) => ({
    ...receipt,
    module: {
      ...receipt.module,
      activationExposed: true,
    },
    governance: {
      ...receipt.governance,
      endpoint: true,
    },
  }));

  const receipt = runWith({ stage4rReceiptPath: badReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4rReceipt' && blocker.id === 'activation_not_exposed'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4rReceipt' && blocker.id === 'no_endpoint'), true);
});
