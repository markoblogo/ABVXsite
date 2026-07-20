import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { admitAndAppendImportPacket, admitImportPacket } from '../src/import-admission-policy.mjs';
import { readImportLedger } from '../src/import-ledger.mjs';

const policy = JSON.parse(readFileSync(new URL('../config/import-admission-policy.v1.json', import.meta.url), 'utf8'));

function packet(overrides = {}) {
  return {
    schemaVersion: 1,
    kind: 'CortexABVImportPacket',
    packetId: 'packet:index-spike:synthetic-001',
    direction: 'inbound_to_cortex_abv',
    source: { kind: 'owned_project_ecosystem', id: 'index/spike' },
    classification: 'public',
    dataKind: 'index_spike_project_update',
    observedAt: '2026-07-16T14:00:00.000Z',
    provenance: [{ kind: 'synthetic_fixture', ref: 'synthetic:index-spike:001', digest: 'd'.repeat(64) }],
    permittedUse: ['private_context'],
    returnAuthority: 'none',
    payload: { mode: 'shadow', publicActionAuthority: 'none' },
    ...overrides,
  };
}

test('admits a public Index/spike packet for proposal-only personal-surface eligibility', () => {
  const receipt = admitImportPacket({ packet: packet(), policy, admittedAt: '2026-07-16T15:00:00.000Z' });
  assert.equal(receipt.kind, 'CortexABVImportAdmissionReceipt');
  assert.equal(receipt.authority, 'plan');
  assert.equal(receipt.externalSideEffects, false);
  assert.equal(receipt.status, 'admitted');
  assert.deepEqual(receipt.retention, { mode: 'manual_deletion_required', maxAgeDays: 30, expiresAt: '2026-08-15T15:00:00.000Z' });
  assert.deepEqual(receipt.personalSurfaceEligibility, { mode: 'proposal_only', targets: ['abvxsite', 'owner_repository', 'linkedin'] });
});

test('admits a protected Monitor/MN7R packet for private-context-only eligibility', () => {
  const monitorReceipt = admitImportPacket({
    packet: packet({
      packetId: 'packet:monitor-mn7r:synthetic-001',
      source: { kind: 'owned_project_ecosystem', id: 'monitor' },
      classification: 'protected',
      dataKind: 'monitor_project_update',
    }),
    policy,
    admittedAt: '2026-07-20T16:00:00.000Z',
  });

  assert.equal(monitorReceipt.status, 'admitted');
  assert.equal(monitorReceipt.retention.maxAgeDays, 14);
  assert.deepEqual(monitorReceipt.personalSurfaceEligibility, { mode: 'private_context_only', targets: [] });
});

test('keeps protected base Cortex imports private-context-only and rejects a non-allowlisted kind', () => {
  const protectedReceipt = admitImportPacket({
    packet: packet({
      packetId: 'packet:base-cortex:synthetic-001',
      source: { kind: 'base_cortex', id: 'base-cortex' },
      classification: 'protected',
      dataKind: 'cortex_market_workforce_packet',
    }),
    policy,
    admittedAt: '2026-07-16T15:00:00.000Z',
  });
  assert.deepEqual(protectedReceipt.personalSurfaceEligibility, { mode: 'private_context_only', targets: [] });
  assert.equal(protectedReceipt.retention.maxAgeDays, 14);
  assert.throws(() => admitImportPacket({ packet: packet({ dataKind: 'unexpected_kind' }), policy, admittedAt: '2026-07-16T15:00:00.000Z' }), /not allowlisted/);
});

test('persists the admission receipt with a newly appended private ledger entry', () => {
  const ledgerPath = path.join(mkdtempSync(path.join(tmpdir(), 'cortex-abv-admission-')), 'imports.jsonl');
  const { admission, result } = admitAndAppendImportPacket({
    ledgerPath,
    packet: packet(),
    policy,
    receivedAt: '2026-07-16T15:00:00.000Z',
  });
  assert.equal(result.appended, true);
  assert.deepEqual(readImportLedger(ledgerPath)[0].admission, admission);
});
