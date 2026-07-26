import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeControlledModuleHarnessDryRun } from '../src/vector-runtime-controlled-module-harness-dry-run.mjs';
import { runVectorRuntimeImplementationPocDryRun } from '../src/vector-runtime-implementation-poc-dry-run.mjs';
import { sha256 } from '../src/vector-runtime-controlled-module-harness.mjs';

const runtimeRoot = path.join(import.meta.dirname, '..');
const designPath = path.join(runtimeRoot, 'config/vector-runtime-controlled-module-harness-dry-run.v1.json');
const stage4jReceiptPath = path.join(runtimeRoot, 'receipts/vector-runtime-controlled-module-poc-review-receipt.v1.json');
const stage4hDesignPath = path.join(runtimeRoot, 'config/vector-runtime-implementation-poc-dry-run.v1.json');
const pocReviewReceiptPath = path.join(runtimeRoot, 'receipts/vector-runtime-implementation-poc-review-receipt.v1.json');
const planPath = path.join(runtimeRoot, 'config/vector-retrieval-turbovec-pilot.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-harness-dry-run-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function makeFixture() {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-harness-dry-run-fixture-'));
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
  const stage4jReceiptPathFixture = writeTempJson(stage4jReceiptPath, (receipt) => ({
    ...receipt,
    digests: {
      ...receipt.digests,
      stage4hDryRunReceiptDigest: sha256(stage4hReceipt),
    },
  }));
  return {
    artifactPath: path.join(artifactRoot, 'index-artifact.v1.json'),
    stage4hReceiptPath,
    stage4jReceiptPath: stage4jReceiptPathFixture,
  };
}

test('runs controlled module harness dry-run without endpoint, network or LLM authority', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-harness-dry-run-'));
  const fixture = makeFixture();
  const receiptPath = path.join(tmpDir, 'receipt.json');
  const receipt = runVectorRuntimeControlledModuleHarnessDryRun({
    designPath,
    stage4jReceiptPath: fixture.stage4jReceiptPath,
    stage4hReceiptPath: fixture.stage4hReceiptPath,
    artifactPath: fixture.artifactPath,
    receiptPath,
    runtimeRoot,
    runAt: '2026-07-26T10:00:00.000Z',
  });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeControlledModuleHarnessDryRunReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_controlled_runtime_wiring_design_review');
  assert.equal(receipt.governance.endpoint, false);
  assert.equal(receipt.governance.networkCalls, false);
  assert.equal(receipt.governance.llmCalls, false);
  assert.equal(receipt.queryResults.every((result) => result.status === 'passed'), true);
  assert.equal(receipt.queryResults.every((result) => result.evidenceVerification.passed), true);
  assert.equal(persisted.digests.stage4jReceiptDigest, receipt.digests.stage4jReceiptDigest);
});

test('blocks harness dry-run when Stage 4j receipt is not eligible', () => {
  const fixture = makeFixture();
  const badReceiptPath = writeTempJson(stage4jReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'review', id: 'no_endpoint', status: 'blocked' }],
  }));
  const receipt = runVectorRuntimeControlledModuleHarnessDryRun({
    designPath,
    stage4jReceiptPath: badReceiptPath,
    stage4hReceiptPath: fixture.stage4hReceiptPath,
    artifactPath: fixture.artifactPath,
    runtimeRoot,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.commandsExecuted.length, 0);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'stage4j_eligibility'), true);
});

test('blocks harness dry-run when endpoint authority is introduced in design', () => {
  const fixture = makeFixture();
  const badDesignPath = writeTempJson(designPath, (design) => ({
    ...design,
    governance: {
      ...design.governance,
      endpoint: true,
    },
  }));
  const receipt = runVectorRuntimeControlledModuleHarnessDryRun({
    designPath: badDesignPath,
    stage4jReceiptPath: fixture.stage4jReceiptPath,
    stage4hReceiptPath: fixture.stage4hReceiptPath,
    artifactPath: fixture.artifactPath,
    runtimeRoot,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'governance_endpoint'), true);
});
