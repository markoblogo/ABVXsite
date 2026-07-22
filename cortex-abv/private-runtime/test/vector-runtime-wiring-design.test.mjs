import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeWiringDesignGate } from '../src/vector-runtime-wiring-design.mjs';

const designPath = path.join(import.meta.dirname, '../config/vector-runtime-wiring-design.v1.json');
const preflightReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-integration-preflight-receipt.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-wiring-design-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

test('validates runtime wiring design as eligible for implementation POC review only', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-wiring-design-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-wiring-design-receipt.v1.json');
  const receipt = runVectorRuntimeWiringDesignGate({
    designPath,
    preflightReceiptPath,
    receiptPath,
    runAt: '2026-07-22T20:00:00.000Z',
  });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeWiringDesignReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_implementation_poc_review');
  assert.equal(receipt.governance.runtimeIntegration, false);
  assert.equal(receipt.governance.implementationPocApproved, false);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(receipt.gates.design.every((gate) => gate.status === 'accepted'), true);
  assert.equal(receipt.gates.preflight.every((gate) => gate.status === 'accepted'), true);
  assert.deepEqual(persisted.eligibility, receipt.eligibility);
});

test('blocks design review when runtime endpoint is enabled in design', () => {
  const badDesignPath = writeTempJson(designPath, (design) => ({
    ...design,
    runtimeBoundary: {
      ...design.runtimeBoundary,
      endpoint: true,
    },
  }));

  const receipt = runVectorRuntimeWiringDesignGate({
    designPath: badDesignPath,
    preflightReceiptPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'no_endpoint'), true);
});

test('blocks design review when preflight is no longer eligible', () => {
  const badPreflightPath = writeTempJson(preflightReceiptPath, (preflight) => ({
    ...preflight,
    eligibility: 'not_eligible_for_design_review',
    blockers: [{ group: 'dependencyProbe', id: 'query', status: 'blocked' }],
  }));

  const receipt = runVectorRuntimeWiringDesignGate({
    designPath,
    preflightReceiptPath: badPreflightPath,
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'preflight' && blocker.id === 'eligibility'), true);
  assert.equal(receipt.review.pendingReview, false);
});
