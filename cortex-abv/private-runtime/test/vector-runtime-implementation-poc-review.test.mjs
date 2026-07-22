import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeImplementationPocReviewGate } from '../src/vector-runtime-implementation-poc-review.mjs';

const reviewPath = path.join(import.meta.dirname, '../config/vector-runtime-implementation-poc-review.v1.json');
const wiringReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-wiring-design-receipt.v1.json');
const runtimeRoot = path.join(import.meta.dirname, '..');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-poc-review-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

test('validates minimum implementation POC dry-run scope without approving implementation', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-poc-review-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-implementation-poc-review-receipt.v1.json');
  const receipt = runVectorRuntimeImplementationPocReviewGate({
    reviewPath,
    wiringReceiptPath,
    receiptPath,
    runtimeRoot,
    runAt: '2026-07-22T21:00:00.000Z',
  });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeImplementationPocReviewReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_implementation_poc_dry_run_review');
  assert.equal(receipt.governance.implementationPocApproved, false);
  assert.equal(receipt.governance.runtimeIntegration, false);
  assert.equal(receipt.minimumPocScope.localIndexArtifactRoot, 'data/vector-indexes/turbovec-poc');
  assert.deepEqual(receipt.minimumPocScope.allowedDryRunCommands, [
    'build_index_poc_dry_run',
    'query_index_poc_dry_run',
    'verify_index_poc_dry_run',
  ]);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.eligibility, receipt.eligibility);
});

test('blocks POC review when index artifact root is not local and gitignored', () => {
  const badReviewPath = writeTempJson(reviewPath, (review) => ({
    ...review,
    pocScope: {
      ...review.pocScope,
      localIndexArtifactRoot: 'public/vector-indexes/turbovec-poc',
    },
  }));

  const receipt = runVectorRuntimeImplementationPocReviewGate({
    reviewPath: badReviewPath,
    wiringReceiptPath,
    runtimeRoot,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'local_index_root'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'review' && blocker.id === 'gitignored_index_root'), true);
});

test('blocks POC review when wiring design receipt is not eligible', () => {
  const badWiringPath = writeTempJson(wiringReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'design', id: 'no_endpoint', status: 'blocked' }],
  }));

  const receipt = runVectorRuntimeImplementationPocReviewGate({
    reviewPath,
    wiringReceiptPath: badWiringPath,
    runtimeRoot,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.review.pendingReview, false);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'wiringDesign' && blocker.id === 'eligibility'), true);
});
