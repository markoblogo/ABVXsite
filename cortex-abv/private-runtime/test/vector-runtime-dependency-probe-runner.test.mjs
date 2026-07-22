import { mkdtempSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeDependencyProbe } from '../src/vector-runtime-dependency-probe-runner.mjs';

const planPath = path.join(import.meta.dirname, '../config/vector-retrieval-turbovec-pilot.v1.json');
const benchmarkPath = path.join(import.meta.dirname, '../examples/synthetic-vector-retrieval-benchmark.v1.json');
const policyPath = path.join(import.meta.dirname, '../config/vector-runtime-package-policy.v1.json');

test('blocks dependency probe when real turbovec executor is unavailable', () => {
  const receipt = runVectorRuntimeDependencyProbe({
    planPath,
    benchmarkPath,
    policyPath,
    runAt: '2026-07-22T18:30:00.000Z',
    executor: () => ({
      ok: false,
      dependencyAvailable: false,
      dependencyInstallAttempted: false,
      error: 'No module named turbovec',
    }),
  });

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeDependencyProbeReceipt');
  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.acceptance.indexBuild.status, 'blocked');
  assert.equal(receipt.acceptance.query.status, 'blocked');
  assert.equal(receipt.governance.readOnly, true);
  assert.equal(receipt.governance.proposalOnly, true);
  assert.equal(receipt.governance.publicActionAuthority, false);
  assert.equal(receipt.package, 'turbovec==0.8.0');
  assert.equal(receipt.packagePolicy.policyReceiptRequired, true);
});

test('accepts dependency probe only when index-build and query gates pass', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-turbovec-dep-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-dependency-probe-receipt.v1.json');
  const receipt = runVectorRuntimeDependencyProbe({
    planPath,
    benchmarkPath,
    policyPath,
    receiptPath,
    runAt: '2026-07-22T18:31:00.000Z',
    executor: () => ({
      ok: true,
      dependencyAvailable: true,
      dependencyInstallAttempted: true,
      installLog: [{ args: ['-m', 'pip', 'install', 'turbovec==0.8.0'], ok: true }],
      output: {
        status: 'passed',
        package: 'turbovec',
        indexType: 'IdMapIndex',
        documentCount: 4,
        recallAtK: 1,
        results: [
          {
            probeId: 'probe-index-summary',
            status: 'passed',
            candidateIds: ['pp-index-spike-updates'],
            matchedExpected: ['pp-index-spike-updates'],
            recallAtK: 1,
            candidates: [
              {
                id: 'pp-index-spike-updates',
                score: 0.99,
                evidenceRefs: [{ path: 'cortex-abv/public-presence-index.v1.json', ref: 'projects.index-spike.summary' }],
              },
            ],
          },
        ],
      },
    }),
  });
  const persisted = JSON.parse(readFileSync(receiptPath, 'utf8'));

  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.acceptance.indexBuild.status, 'accepted');
  assert.equal(receipt.acceptance.query.status, 'accepted');
  assert.equal(receipt.decisionTrace.claimEvidence.length, 1);
  assert.equal(receipt.review.pendingReview, true);
  assert.equal(receipt.packagePolicy.installSpec, 'turbovec==0.8.0');
  assert.equal(typeof receipt.packagePolicy.policyDigest, 'string');
  assert.deepEqual(persisted.acceptance, receipt.acceptance);
});
