import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runVectorRuntimePackagePolicyGate,
  validateVectorRuntimePackagePolicy,
} from '../src/vector-runtime-package-policy.mjs';

const policyPath = path.join(import.meta.dirname, '../config/vector-runtime-package-policy.v1.json');

function readPolicy() {
  return JSON.parse(readFileSync(policyPath, 'utf8'));
}

test('validates pinned PyPI turbovec package policy and writes reproducibility receipt', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-vector-policy-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-package-policy-receipt.v1.json');
  const receipt = runVectorRuntimePackagePolicyGate({
    policyPath,
    receiptPath,
    runAt: '2026-07-22T19:00:00.000Z',
    platform: {
      os: process.platform,
      arch: process.arch,
      node: process.version,
      host: 'test',
      release: 'test',
    },
  });
  const persisted = JSON.parse(readFileSync(receiptPath, 'utf8'));

  assert.equal(receipt.kind, 'CortexABVVectorRuntimePackagePolicyReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.package.installSpec, 'turbovec==0.8.0');
  assert.equal(receipt.venvPolicy.allowProjectCommittedVenv, false);
  assert.equal(receipt.governance.proposalOnly, true);
  assert.equal(receipt.acceptance.reproducibility.status, 'accepted');
  assert.deepEqual(persisted.policyDigest, receipt.policyDigest);
});

test('rejects unpinned or mismatched package install specs', () => {
  const policy = readPolicy();
  assert.throws(
    () => validateVectorRuntimePackagePolicy({
      ...policy,
      package: {
        ...policy.package,
        versionPin: '0.8.0',
        installSpec: 'turbovec',
      },
    }),
    /installSpec/,
  );
});

test('rejects unsupported platform constraints', () => {
  const policy = readPolicy();
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-vector-policy-'));
  const tmpPolicy = path.join(tmpDir, 'vector-runtime-package-policy.v1.json');
  writeFileSync(tmpPolicy, `${JSON.stringify({
    ...policy,
    platformConstraints: {
      ...policy.platformConstraints,
      os: ['unsupported-os'],
    },
  }, null, 2)}\n`);

  assert.throws(
    () => runVectorRuntimePackagePolicyGate({ policyPath: tmpPolicy }),
    /unsupported platform os/,
  );
});
