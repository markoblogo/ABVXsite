import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateImportPacket } from '../src/import-ledger.mjs';
import { admitImportPacket } from '../src/import-admission-policy.mjs';

const fixture = path.join(import.meta.dirname, '../examples/synthetic-import-packet-base-cortex.json');
const policyPath = path.join(import.meta.dirname, '../config/import-admission-policy.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

test('synthetic base-cortex import packet validates against the Packet schema', () => {
  const packet = readJson(fixture);
  assert.doesNotThrow(() => validateImportPacket(packet));
});

test('admitting synthetic import packet creates an append-only entry with retention and eligibility', () => {
  const ledgerPath = path.join(mkdtempSync(path.join(tmpdir(), 'cortex-abv-import-ledger-')), 'import-ledger.jsonl');
  const packet = readJson(fixture);
  const policy = readJson(policyPath);
  const { admission, result } = admitImportPacket({
    ledgerPath,
    packet,
    policy,
    receivedAt: '2026-07-20T10:30:00.000Z',
  });

  assert.equal(result.appended, true);
  assert.equal(admission.status, 'admitted');
  assert.equal(admission.classification, 'protected');
  assert.equal(admission.packetDigest.length, 64);
  assert.equal(admission.retention.maxAgeDays, 14);
  assert.equal(admission.personalSurfaceEligibility.mode, 'private_context_only');
});
