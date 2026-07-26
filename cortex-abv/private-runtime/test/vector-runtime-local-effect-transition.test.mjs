import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeLocalEffectTransitionArtifact } from '../src/vector-runtime-local-effect-transition.mjs';

const artifactPath = path.join(import.meta.dirname, '../config/vector-runtime-local-effect-transition.v1.json');
const stage4adReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-local-effect-application-decision-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-effect-transition-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeLocalEffectTransitionArtifact({
    artifactPath,
    stage4adReceiptPath,
    runAt: '2026-07-27T00:00:00.000Z',
    ...overrides,
  });
}

test('records local effect transition artifact without applying transition', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-effect-transition-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-local-effect-transition-receipt.v1.json');
  const receipt = runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeLocalEffectTransitionReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_local_effect_transition_dry_run');
  assert.equal(receipt.effectTransitionDefinition.effectTransitionAppliedHere, false);
  assert.equal(receipt.effectTransitionDefinition.stateTransitionAppliedHere, false);
  assert.equal(receipt.effectTransitionDefinition.runtimeActivationAppliedHere, false);
  assert.equal(receipt.decisionTrace.effectTransitionApplied, false);
  assert.equal(receipt.decisionTrace.runtimeActivationApplied, false);
  assert.equal(receipt.nextGate.targetEligibility, 'eligible_for_local_effect_transition_dry_run');
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4adReceiptDigest, receipt.stage4adReceiptDigest);
});

test('blocks transition artifact when Stage 4ad receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4adReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'stage4adReceipt', id: 'stage4ad_receipt_blocked', status: 'blocked' }],
  }));

  const receipt = runWith({ stage4adReceiptPath: badReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4adReceipt' && blocker.id === 'status'), true);
});

test('blocks transition artifact when transition is applied here or target state drifts', () => {
  const badArtifactPath = writeTempJson(artifactPath, (artifact) => ({
    ...artifact,
    effectTransitionDefinition: {
      ...artifact.effectTransitionDefinition,
      effectTransitionAppliedHere: true,
      targetState: 'invalid_state',
    },
  }));

  const receipt = runWith({ artifactPath: badArtifactPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'artifact' && blocker.id === 'transition_not_applied_here'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'artifact' && blocker.id === 'transition_target_state'), true);
});
