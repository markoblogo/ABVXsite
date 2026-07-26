import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeActivationDecision } from '../src/vector-runtime-activation-decision.mjs';

const decisionPath = path.join(import.meta.dirname, '../config/vector-runtime-activation-decision.v1.json');
const stage4tReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-activation-decision-review-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-activation-decision-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeActivationDecision({
    decisionPath,
    stage4tReceiptPath,
    runAt: '2026-07-26T18:25:00.000Z',
    ...overrides,
  });
}

test('records explicit owner-approved local activation decision without applying activation', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-activation-decision-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-activation-decision-receipt.v1.json');
  const receipt = runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeActivationDecisionReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_local_runtime_activation_dry_run');
  assert.equal(receipt.ownerApproval.status, 'approved');
  assert.equal(receipt.activationIntent.runtimeActivationAppliedHere, false);
  assert.equal(receipt.nextGate.targetEligibility, 'eligible_for_local_runtime_activation_dry_run');
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4tReceiptDigest, receipt.stage4tReceiptDigest);
});

test('blocks activation decision artifact when Stage 4t receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4tReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'stage4sReceipt', id: 'queries_all_passed', status: 'blocked' }],
  }));

  const receipt = runWith({ stage4tReceiptPath: badReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4tReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks activation decision artifact when owner approval is missing or endpoint authority is introduced', () => {
  const badDecisionPath = writeTempJson(decisionPath, (decision) => ({
    ...decision,
    ownerApproval: {
      ...decision.ownerApproval,
      status: 'pending_review',
    },
    forbiddenAuthority: {
      ...decision.forbiddenAuthority,
      endpointAllowed: true,
    },
  }));

  const receipt = runWith({ decisionPath: badDecisionPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'decision' && blocker.id === 'owner_status'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'decision' && blocker.id === 'forbidden_endpointAllowed'), true);
});
