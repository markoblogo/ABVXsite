import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeControlledWiringDesignGate } from '../src/vector-runtime-controlled-wiring-design.mjs';

const designPath = path.join(import.meta.dirname, '../config/vector-runtime-controlled-wiring-design.v1.json');
const harnessReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-controlled-module-harness-dry-run-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-wiring-design-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

test('validates controlled wiring design without approving wiring activation', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-wiring-design-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-controlled-wiring-design-receipt.v1.json');
  const receipt = runVectorRuntimeControlledWiringDesignGate({
    designPath,
    harnessReceiptPath,
    receiptPath,
    runAt: '2026-07-26T11:00:00.000Z',
  });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeControlledWiringDesignReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_controlled_runtime_wiring_poc_review');
  assert.equal(receipt.governance.wiringImplementationApproved, false);
  assert.equal(receipt.governance.runtimeActivationApproved, false);
  assert.equal(receipt.governance.runtimeIntegration, false);
  assert.equal(receipt.wiringContract.wiringBoundary.wiringMode, 'in_process_local_library_binding_only');
  assert.deepEqual(receipt.wiringContract.bindingContract.allowedBindings, [
    'loadIndexArtifact',
    'queryCandidates',
    'verifyClaimEvidence',
  ]);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.digests.harnessDryRunReceiptDigest, receipt.digests.harnessDryRunReceiptDigest);
});

test('blocks controlled wiring design when Stage 4k receipt is not eligible', () => {
  const badReceiptPath = writeTempJson(harnessReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'query', id: 'tenant_scoped_queries', status: 'blocked' }],
  }));

  const receipt = runVectorRuntimeControlledWiringDesignGate({
    designPath,
    harnessReceiptPath: badReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'harnessReceipt' && blocker.id === 'eligibility'), true);
});

test('blocks controlled wiring design when endpoint or activation is introduced', () => {
  const badDesignPath = writeTempJson(designPath, (design) => ({
    ...design,
    wiringBoundary: {
      ...design.wiringBoundary,
      activationApproved: true,
      endpointAllowed: true,
    },
    governance: {
      ...design.governance,
      runtimeIntegration: true,
      endpoint: true,
    },
  }));

  const receipt = runVectorRuntimeControlledWiringDesignGate({
    designPath: badDesignPath,
    harnessReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'no_activation'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'no_endpoint'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'governance_runtimeIntegration'), true);
});
