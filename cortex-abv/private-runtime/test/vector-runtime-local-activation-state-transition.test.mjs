import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeLocalActivationStateTransitionArtifact } from '../src/vector-runtime-local-activation-state-transition.mjs';

const artifactPath = path.join(import.meta.dirname, '../config/vector-runtime-local-activation-state-transition.v1.json');
const stage4xReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-local-activation-state-transition-review-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-activation-state-transition-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeLocalActivationStateTransitionArtifact({
    artifactPath,
    stage4xReceiptPath,
    runAt: '2026-07-26T19:05:00.000Z',
    ...overrides,
  });
}

test('records local activation state transition artifact without applying transition', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-activation-state-transition-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-local-activation-state-transition-receipt.v1.json');
  const receipt = runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeLocalActivationStateTransitionReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_local_activation_state_transition_dry_run');
  assert.equal(receipt.transitionIntent.transitionAppliedHere, false);
  assert.equal(receipt.ownerApproval.status, 'approved');
  assert.equal(receipt.nextGate.targetEligibility, 'eligible_for_local_activation_state_transition_dry_run');
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4xReceiptDigest, receipt.stage4xReceiptDigest);
});

test('blocks transition artifact when Stage 4x receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4xReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'review', id: 'transition_not_applied_here', status: 'blocked' }],
  }));
  const receipt = runWith({ stage4xReceiptPath: badReceiptPath });
  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4xReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks transition artifact when owner approval is missing or transition is applied here', () => {
  const badArtifactPath = writeTempJson(artifactPath, (artifact) => ({
    ...artifact,
    ownerApproval: {
      ...artifact.ownerApproval,
      status: 'pending_review',
    },
    transitionIntent: {
      ...artifact.transitionIntent,
      transitionAppliedHere: true,
    },
  }));
  const receipt = runWith({ artifactPath: badArtifactPath });
  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'artifact' && blocker.id === 'owner_status'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'artifact' && blocker.id === 'transition_not_applied_here'), true);
});
