import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeImplementationPocDryRun } from '../src/vector-runtime-implementation-poc-dry-run.mjs';

const runtimeRoot = path.join(import.meta.dirname, '..');
const designPath = path.join(runtimeRoot, 'config/vector-runtime-implementation-poc-dry-run.v1.json');
const reviewReceiptPath = path.join(runtimeRoot, 'receipts/vector-runtime-implementation-poc-review-receipt.v1.json');
const planPath = path.join(runtimeRoot, 'config/vector-retrieval-turbovec-pilot.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-poc-dry-run-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

test('builds a local gitignored index artifact and receipt without runtime authority', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-poc-dry-run-'));
  const artifactRoot = path.join(tmpDir, 'artifact-root');
  const receiptPath = path.join(tmpDir, 'receipt.json');
  const receipt = runVectorRuntimeImplementationPocDryRun({
    designPath,
    reviewReceiptPath,
    planPath,
    artifactRoot,
    receiptPath,
    runtimeRoot,
    runAt: '2026-07-22T22:00:00.000Z',
  });
  const persisted = readJson(receiptPath);
  const artifactPath = path.join(artifactRoot, 'index-artifact.v1.json');

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeImplementationPocDryRunReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_controlled_runtime_module_review');
  assert.equal(receipt.governance.runtimeIntegration, false);
  assert.equal(receipt.governance.endpoint, false);
  assert.equal(receipt.governance.networkCalls, false);
  assert.equal(receipt.artifact.committed, false);
  assert.equal(receipt.artifact.gitignored, true);
  assert.equal(receipt.rollback.baselineAdvanced, false);
  assert.equal(receipt.probeResults.every((probe) => probe.status === 'passed'), true);
  assert.equal(receipt.probeResults.every((probe) => probe.candidates.every((candidate) => candidate.evidenceRefs.length > 0)), true);
  assert.equal(existsSync(artifactPath), true);
  assert.equal(persisted.digests.indexDigest, receipt.digests.indexDigest);
});

test('blocks dry-run when POC review receipt is not eligible', () => {
  const badReviewPath = writeTempJson(reviewReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'review', id: 'no_network', status: 'blocked' }],
  }));
  const receipt = runVectorRuntimeImplementationPocDryRun({
    designPath,
    reviewReceiptPath: badReviewPath,
    planPath,
    runtimeRoot,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'review_prerequisite_eligibility'), true);
});

test('blocks dry-run when a non-allowlisted command is introduced', () => {
  const badDesignPath = writeTempJson(designPath, (design) => ({
    ...design,
    commands: {
      ...design.commands,
      build: 'build_index_poc',
    },
  }));
  const receipt = runVectorRuntimeImplementationPocDryRun({
    designPath: badDesignPath,
    reviewReceiptPath,
    planPath,
    runtimeRoot,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'command_build'), true);
});
