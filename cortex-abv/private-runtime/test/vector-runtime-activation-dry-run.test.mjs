import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeActivationDryRun } from '../src/vector-runtime-activation-dry-run.mjs';

const designPath = path.join(import.meta.dirname, '../config/vector-runtime-activation-dry-run.v1.json');
const stage4qReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-activation-dry-run-review-receipt.v1.json');
const stage4pReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-activation-review-receipt.v1.json');
const artifactPath = path.join(import.meta.dirname, '../data/vector-indexes/turbovec-poc/index-artifact.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-activation-dry-run-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeActivationDryRun({
    designPath,
    stage4qReceiptPath,
    stage4pReceiptPath,
    artifactPath,
    runtimeRoot: path.join(import.meta.dirname, '..'),
    runAt: '2026-07-26T16:30:00.000Z',
    ...overrides,
  });
}

test('runs local activation dry-run without activating runtime or exposing endpoint', async () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-activation-dry-run-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-activation-dry-run-receipt.v1.json');
  const receipt = await runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeActivationDryRunReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_runtime_readiness_review');
  assert.equal(receipt.governance.runtimeActivation, false);
  assert.equal(receipt.governance.runtimeIntegration, false);
  assert.equal(receipt.governance.endpoint, false);
  assert.equal(receipt.module.importable, true);
  assert.equal(receipt.module.activationExposed, false);
  assert.equal(receipt.queryResults.every((result) => result.status === 'passed'), true);
  assert.equal(receipt.commandsExecuted.length, 4);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.digests.stage4qReceiptDigest, receipt.digests.stage4qReceiptDigest);
});

test('blocks local activation dry-run when Stage 4q receipt is not eligible', async () => {
  const badReceiptPath = writeTempJson(stage4qReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'review', id: 'receipt_only_writes', status: 'blocked' }],
  }));

  const receipt = await runWith({ stage4qReceiptPath: badReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'stage4q_eligibility'), true);
});

test('blocks local activation dry-run when activation or endpoint authority is introduced', async () => {
  const badDesignPath = writeTempJson(designPath, (design) => ({
    ...design,
    governance: {
      ...design.governance,
      runtimeActivation: true,
      endpoint: true
    }
  }));

  const receipt = await runWith({ designPath: badDesignPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'governance_runtimeActivation'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'governance_endpoint'), true);
});
