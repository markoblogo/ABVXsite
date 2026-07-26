import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeLocalEffectTransitionDryRun } from '../src/vector-runtime-local-effect-transition-dry-run.mjs';

const designPath = path.join(import.meta.dirname, '../config/vector-runtime-local-effect-transition-dry-run.v1.json');
const stage4aeReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-local-effect-transition-receipt.v1.json');
const artifactPath = path.join(import.meta.dirname, '../data/vector-indexes/turbovec-poc/index-artifact.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-effect-transition-dry-run-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeLocalEffectTransitionDryRun({
    designPath,
    stage4aeReceiptPath,
    artifactPath,
    runtimeRoot: path.join(import.meta.dirname, '..'),
    runAt: '2026-07-26T23:00:00.000Z',
    ...overrides,
  });
}

test('runs local effect transition dry-run without applying transitions', async () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-effect-transition-dry-run-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-local-effect-transition-dry-run-receipt.v1.json');
  const receipt = await runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeLocalEffectTransitionDryRunReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_local_transition_state_effect_review');
  assert.equal(receipt.governance.runtimeActivationApplied, false);
  assert.equal(receipt.governance.stateTransitionApplied, false);
  assert.equal(receipt.governance.effectTransitionApplied, false);
  assert.equal(receipt.module.importable, true);
  assert.equal(receipt.module.effectTransitionApplied, false);
  assert.equal(receipt.queryResults.every((result) => result.status === 'passed'), true);
  assert.equal(receipt.commandsExecuted.length, 4);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.digests.stage4aeReceiptDigest, receipt.digests.stage4aeReceiptDigest);
});

test('blocks local effect transition dry-run when Stage 4ae receipt is not eligible', async () => {
  const badReceiptPath = writeTempJson(stage4aeReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'artifact', id: 'owner_status', status: 'blocked' }],
  }));

  const receipt = await runWith({ stage4aeReceiptPath: badReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'stage4ae_status'), true);
});

test('blocks local effect transition dry-run when module or governance introduces forbidden authority', async () => {
  const badDesignPath = writeTempJson(designPath, (design) => ({
    ...design,
    governance: {
      ...design.governance,
      stateTransitionApplied: true,
      publicActionAuthority: true,
    },
  }));

  const receipt = await runWith({ designPath: badDesignPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'governance_stateTransitionApplied'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'governance_publicActionAuthority'), true);
});
