import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeLocalTransitionStateEffectArtifact } from '../src/vector-runtime-local-transition-state-effect.mjs';

const artifactPath = path.join(import.meta.dirname, '../config/vector-runtime-local-transition-state-effect.v1.json');
const stage4aaReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-local-transition-state-effect-review-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-transition-state-effect-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeLocalTransitionStateEffectArtifact({
    artifactPath,
    stage4aaReceiptPath,
    runAt: '2026-07-26T23:20:00.000Z',
    ...overrides,
  });
}

test('records local transition state effect artifact without applying effect', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-transition-state-effect-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-local-transition-state-effect-receipt.v1.json');
  const receipt = runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeLocalTransitionStateEffectReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_local_effect_application_review');
  assert.equal(receipt.effectIntent.effectAppliedHere, false);
  assert.equal(receipt.effectIntent.stateTransitionAppliedHere, false);
  assert.equal(receipt.ownerApproval.status, 'approved');
  assert.equal(receipt.nextGate.targetEligibility, 'eligible_for_local_effect_application_review');
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4aaReceiptDigest, receipt.stage4aaReceiptDigest);
});

test('blocks transition state effect artifact when Stage 4aa receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4aaReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'review', id: 'effect_not_applied_here', status: 'blocked' }],
  }));
  const receipt = runWith({ stage4aaReceiptPath: badReceiptPath });
  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4aaReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks transition state effect artifact when owner approval is missing or effect is applied here', () => {
  const badArtifactPath = writeTempJson(artifactPath, (artifact) => ({
    ...artifact,
    ownerApproval: {
      ...artifact.ownerApproval,
      status: 'pending_review',
    },
    effectIntent: {
      ...artifact.effectIntent,
      effectAppliedHere: true,
    },
  }));
  const receipt = runWith({ artifactPath: badArtifactPath });
  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'artifact' && blocker.id === 'owner_status'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'artifact' && blocker.id === 'effect_not_applied_here'), true);
});
