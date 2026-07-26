import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeControlledWiringReviewGate } from '../src/vector-runtime-controlled-wiring-review.mjs';

const reviewPath = path.join(import.meta.dirname, '../config/vector-runtime-controlled-wiring-review.v1.json');
const stage4nReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-controlled-wiring-poc-dry-run-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-wiring-review-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

test('validates controlled runtime wiring review without approving activation', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-wiring-review-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-controlled-wiring-review-receipt.v1.json');
  const receipt = runVectorRuntimeControlledWiringReviewGate({
    reviewPath,
    stage4nReceiptPath,
    receiptPath,
    runAt: '2026-07-26T14:00:00.000Z',
  });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeControlledWiringReviewReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_runtime_activation_review');
  assert.equal(receipt.governance.wiringReviewOnly, true);
  assert.equal(receipt.governance.wiringReviewed, true);
  assert.equal(receipt.governance.runtimeActivationApproved, false);
  assert.equal(receipt.governance.runtimeIntegration, false);
  assert.equal(receipt.governance.endpoint, false);
  assert.equal(receipt.wiringDefinition.bindingMode, 'in_process_local_library_binding_only');
  assert.equal(receipt.wiringDefinition.runtimeActivationApproved, false);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4nReceiptDigest, receipt.stage4nReceiptDigest);
});

test('blocks controlled runtime wiring review when Stage 4n receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4nReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'query', id: 'expected_candidates_found', status: 'blocked' }],
  }));

  const receipt = runVectorRuntimeControlledWiringReviewGate({
    reviewPath,
    stage4nReceiptPath: badReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4nReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks controlled runtime wiring review when activation, endpoint or LLM authority is introduced', () => {
  const badReviewPath = writeTempJson(reviewPath, (review) => ({
    ...review,
    wiringDefinition: {
      ...review.wiringDefinition,
      runtimeActivationApproved: true,
      answerGenerationAllowed: true,
    },
    activationBoundary: {
      ...review.activationBoundary,
      runtimeActivationAllowedHere: true,
      endpointAllowed: true,
      llmCallsAllowed: true,
    },
    governance: {
      ...review.governance,
      runtimeActivationApproved: true,
      runtimeIntegration: true,
      endpoint: true,
      llmCalls: true,
    },
  }));

  const receipt = runVectorRuntimeControlledWiringReviewGate({
    reviewPath: badReviewPath,
    stage4nReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_runtime_activation_in_definition'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_activation_here'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_endpoint'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'no_llm'), true);
});
