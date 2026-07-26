import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeLocalActivationDryRun } from '../src/vector-runtime-local-activation-dry-run.mjs';

const designPath = path.join(import.meta.dirname, '../config/vector-runtime-local-activation-dry-run.v1.json');
const stage4uReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-activation-decision-receipt.v1.json');
const artifactPath = path.join(import.meta.dirname, '../data/vector-indexes/turbovec-poc/index-artifact.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-activation-dry-run-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeLocalActivationDryRun({
    designPath,
    stage4uReceiptPath,
    artifactPath,
    runtimeRoot: path.join(import.meta.dirname, '..'),
    runAt: '2026-07-26T18:35:00.000Z',
    ...overrides,
  });
}

test('runs local runtime activation dry-run without applying activation or exposing endpoint', async () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-local-activation-dry-run-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-local-activation-dry-run-receipt.v1.json');
  const receipt = await runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeLocalActivationDryRunReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_local_runtime_activation_state_review');
  assert.equal(receipt.governance.runtimeActivationApplied, false);
  assert.equal(receipt.governance.endpoint, false);
  assert.equal(receipt.module.importable, true);
  assert.equal(receipt.module.activationApplied, false);
  assert.equal(receipt.queryResults.every((result) => result.status === 'passed'), true);
  assert.equal(receipt.commandsExecuted.length, 4);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.digests.stage4uReceiptDigest, receipt.digests.stage4uReceiptDigest);
});

test('blocks local runtime activation dry-run when Stage 4u receipt is not eligible', async () => {
  const badReceiptPath = writeTempJson(stage4uReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'decision', id: 'owner_status', status: 'blocked' }],
  }));

  const receipt = await runWith({ stage4uReceiptPath: badReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'stage4u_eligibility'), true);
});

test('blocks local runtime activation dry-run when activation-applied or endpoint authority is introduced', async () => {
  const badDesignPath = writeTempJson(designPath, (design) => ({
    ...design,
    governance: {
      ...design.governance,
      runtimeActivationApplied: true,
      endpoint: true
    }
  }));

  const receipt = await runWith({ designPath: badDesignPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'governance_runtimeActivationApplied'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'governance_endpoint'), true);
});
