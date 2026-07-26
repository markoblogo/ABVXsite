import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeLocalEffectApplicationDecision } from '../src/vector-runtime-local-effect-application-decision.mjs';

const decisionPath = path.join(import.meta.dirname, '../config/vector-runtime-local-effect-application-decision.v1.json');
const stage4acReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-local-effect-application-review-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-effect-application-decision-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeLocalEffectApplicationDecision({
    decisionPath,
    stage4acReceiptPath,
    runAt: '2026-07-27T00:00:00.000Z',
    ...overrides,
  });
}

test('records explicit local effect-application decision without applying effects', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-effect-application-decision-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-local-effect-application-decision-receipt.v1.json');
  const receipt = runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeLocalEffectApplicationDecisionReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_local_effect_transition_artifact');
  assert.equal(receipt.decisionDefinition.effectApplicationAppliedHere, false);
  assert.equal(receipt.decisionDefinition.runtimeActivationAppliedHere, false);
  assert.equal(receipt.decisionDefinition.stateTransitionAppliedHere, false);
  assert.equal(receipt.governance.runtimeActivationApplied, false);
  assert.equal(receipt.governance.stateTransitionApplied, false);
  assert.equal(receipt.decisionTrace.effectApplicationAllowed, false);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.stage4acReceiptDigest, receipt.stage4acReceiptDigest);
});

test('blocks decision when Stage 4ac receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(stage4acReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'local_effect_application', id: 'gate_blocked', status: 'blocked' }],
  }));
  const receipt = runWith({ stage4acReceiptPath: badReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'stage4acReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks decision when effect application appears or endpoint authority is introduced', () => {
  const badDecisionPath = writeTempJson(decisionPath, (decision) => ({
    ...decision,
    decisionDefinition: {
      ...decision.decisionDefinition,
      effectApplicationAppliedHere: true,
      requiredBindings: ['loadIndexArtifact', 'forbiddenBinding'],
    },
    forbiddenAuthority: {
      ...decision.forbiddenAuthority,
      endpointAllowed: true,
    },
  }));

  const receipt = runWith({ decisionPath: badDecisionPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'decision' && blocker.id === 'decision_not_applied_here'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'decision' && blocker.id === 'decision_bindings'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'decision' && blocker.id === 'forbidden_endpointAllowed'), true);
});
