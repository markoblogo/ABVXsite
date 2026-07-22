import { mkdtempSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeReadiness } from '../src/vector-runtime-readiness-runner.mjs';

const planPath = path.join(import.meta.dirname, '../config/vector-retrieval-turbovec-pilot.v1.json');
const benchmarkPath = path.join(import.meta.dirname, '../examples/synthetic-vector-retrieval-benchmark.v1.json');

test('writes a vector runtime readiness receipt for buildIndex/query shim', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-vector-runtime-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-readiness-receipt.v1.json');

  const receipt = runVectorRuntimeReadiness({
    planPath,
    benchmarkPath,
    receiptPath,
    runAt: '2026-07-22T18:00:00.000Z',
  });
  const persisted = JSON.parse(readFileSync(receiptPath, 'utf8'));

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeReadinessReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.mode, 'synthetic_runtime_readiness');
  assert.equal(receipt.decisionTrace.index.fallbackApplied, true);
  assert.equal(receipt.metrics.recallAtK, 1);
  assert.equal(receipt.decisionTrace.claimEvidence.length > 0, true);
  assert.deepEqual(persisted.outputIntegrity, receipt.outputIntegrity);
});
