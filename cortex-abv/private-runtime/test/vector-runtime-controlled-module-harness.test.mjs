import { mkdtempSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadIndexArtifact, queryCandidates, verifyClaimEvidence, sha256 } from '../src/vector-runtime-controlled-module-harness.mjs';
import { runVectorRuntimeImplementationPocDryRun } from '../src/vector-runtime-implementation-poc-dry-run.mjs';

const runtimeRoot = path.join(import.meta.dirname, '..');
const stage4jReceiptPath = path.join(runtimeRoot, 'receipts/vector-runtime-controlled-module-poc-review-receipt.v1.json');
const stage4hDesignPath = path.join(runtimeRoot, 'config/vector-runtime-implementation-poc-dry-run.v1.json');
const pocReviewReceiptPath = path.join(runtimeRoot, 'receipts/vector-runtime-implementation-poc-review-receipt.v1.json');
const planPath = path.join(runtimeRoot, 'config/vector-retrieval-turbovec-pilot.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function makeFixture() {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-harness-fixture-'));
  const artifactRoot = path.join(tmpDir, 'artifact-root');
  const stage4hReceiptPath = path.join(tmpDir, 'stage4h-receipt.json');
  const stage4hReceipt = runVectorRuntimeImplementationPocDryRun({
    designPath: stage4hDesignPath,
    reviewReceiptPath: pocReviewReceiptPath,
    planPath,
    artifactRoot,
    receiptPath: stage4hReceiptPath,
    runtimeRoot,
    runAt: '2026-07-26T10:00:00.000Z',
  });
  return {
    artifactPath: path.join(artifactRoot, 'index-artifact.v1.json'),
    stage4hReceipt,
    stage4jReceipt: readJson(stage4jReceiptPath),
  };
}

test('loads Stage 4h artifact read-only and verifies Stage 4j receipt digest', () => {
  const { artifactPath, stage4hReceipt, stage4jReceipt } = makeFixture();
  const loaded = loadIndexArtifact({
    artifactPath,
    expectedIndexDigest: stage4hReceipt.digests.indexDigest,
    expectedSourceDigest: stage4hReceipt.digests.sourceDigest,
    expectedStage4jReceiptDigest: sha256(stage4jReceipt),
    stage4jReceipt,
  });

  assert.equal(loaded.artifact.kind, 'CortexABVVectorRuntimeIndexArtifact');
  assert.equal(loaded.digests.indexDigest, stage4hReceipt.digests.indexDigest);
  assert.equal(loaded.digests.sourceDigest, stage4hReceipt.digests.sourceDigest);
  assert.equal(loaded.decisionTrace.endpoint, false);
  assert.equal(loaded.decisionTrace.networkCalls, false);
});

test('queries tenant-scoped candidates and verifies evidence refs', () => {
  const { artifactPath, stage4hReceipt, stage4jReceipt } = makeFixture();
  const loaded = loadIndexArtifact({
    artifactPath,
    expectedIndexDigest: stage4hReceipt.digests.indexDigest,
    expectedSourceDigest: stage4hReceipt.digests.sourceDigest,
    expectedStage4jReceiptDigest: sha256(stage4jReceipt),
    stage4jReceipt,
  });
  const result = queryCandidates({
    loadedIndex: loaded,
    query: 'monitor mn7r repository readiness status',
    tenant: 'monitor-mn7r',
    topK: 3,
    minScore: 0.05,
  });
  const verification = verifyClaimEvidence({ candidates: result.candidates });

  assert.deepEqual(result.candidates.map((candidate) => candidate.tenant), ['monitor-mn7r']);
  assert.equal(result.candidates[0].candidateId, 'pp-monitor-mn7r-dashboard');
  assert.equal(result.decisionTrace.candidatesOnly, true);
  assert.equal(verification.passed, true);
});

test('rejects an artifact digest mismatch', () => {
  const { artifactPath, stage4hReceipt, stage4jReceipt } = makeFixture();

  assert.throws(() => loadIndexArtifact({
    artifactPath,
    expectedIndexDigest: '0'.repeat(64),
    expectedSourceDigest: stage4hReceipt.digests.sourceDigest,
    expectedStage4jReceiptDigest: sha256(stage4jReceipt),
    stage4jReceipt,
  }), /indexDigest/);
});
