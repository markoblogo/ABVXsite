import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeControlledModuleDesignGate } from '../src/vector-runtime-controlled-module-design.mjs';

const designPath = path.join(import.meta.dirname, '../config/vector-runtime-controlled-module-design.v1.json');
const dryRunReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-implementation-poc-dry-run-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-controlled-module-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

test('validates controlled runtime module design without approving implementation or wiring', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-controlled-module-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-controlled-module-design-receipt.v1.json');
  const receipt = runVectorRuntimeControlledModuleDesignGate({
    designPath,
    dryRunReceiptPath,
    receiptPath,
    runAt: '2026-07-22T23:00:00.000Z',
  });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeControlledModuleDesignReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_controlled_runtime_module_poc_review');
  assert.equal(receipt.governance.implementationApproved, false);
  assert.equal(receipt.governance.wiringApproved, false);
  assert.equal(receipt.governance.runtimeIntegration, false);
  assert.equal(receipt.moduleContract.artifactInterface.requiredArtifactRoot, 'data/vector-indexes/turbovec-poc');
  assert.deepEqual(receipt.moduleContract.moduleInterface.allowedFunctions, [
    'loadIndexArtifact',
    'queryCandidates',
    'verifyClaimEvidence',
  ]);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.digests.dryRunReceiptDigest, receipt.digests.dryRunReceiptDigest);
});

test('blocks controlled module design when Stage 4h receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(dryRunReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'query', id: 'all_probes_passed', status: 'blocked' }],
  }));

  const receipt = runVectorRuntimeControlledModuleDesignGate({
    designPath,
    dryRunReceiptPath: badReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'dryRunReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks controlled module design when endpoint authority is introduced', () => {
  const badDesignPath = writeTempJson(designPath, (design) => ({
    ...design,
    moduleBoundary: {
      ...design.moduleBoundary,
      endpointAllowed: true,
    },
    governance: {
      ...design.governance,
      endpoint: true,
    },
  }));

  const receipt = runVectorRuntimeControlledModuleDesignGate({
    designPath: badDesignPath,
    dryRunReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'no_endpoint'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'governance_endpoint'), true);
});
