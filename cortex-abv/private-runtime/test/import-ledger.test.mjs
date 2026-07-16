import assert from 'node:assert/strict';
import { appendFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { appendImportPacket, readImportLedger } from '../src/import-ledger.mjs';

function packet(overrides = {}) {
  return {
    schemaVersion: 1,
    kind: 'CortexABVImportPacket',
    packetId: 'packet:base-cortex:market-update-001',
    direction: 'inbound_to_cortex_abv',
    source: { kind: 'base_cortex', id: 'base-cortex' },
    classification: 'protected',
    dataKind: 'market_state_update',
    observedAt: '2026-07-16T12:00:00.000Z',
    provenance: [{ kind: 'cortex_ledger', ref: 'ledger:market-update-001', digest: 'a'.repeat(64) }],
    permittedUse: ['private_context', 'personal_surface_proposal_preparation'],
    returnAuthority: 'none',
    payload: { summary: 'Synthetic market update only.' },
    ...overrides,
  };
}

test('appends a validated inbound packet once and preserves a verifiable hash chain', () => {
  const ledgerPath = path.join(mkdtempSync(path.join(tmpdir(), 'cortex-abv-ledger-')), 'imports.jsonl');
  const first = appendImportPacket({ ledgerPath, packet: packet(), receivedAt: '2026-07-16T12:01:00.000Z' });
  const duplicate = appendImportPacket({ ledgerPath, packet: packet(), receivedAt: '2026-07-16T12:02:00.000Z' });
  const second = appendImportPacket({
    ledgerPath,
    packet: packet({
      packetId: 'packet:index:spike-001',
      source: { kind: 'owned_project_ecosystem', id: 'index/spike' },
      classification: 'public',
      dataKind: 'repository_update',
      observedAt: '2026-07-16T12:03:00.000Z',
      provenance: [{ kind: 'repository_event', ref: 'markoblogo/index@main', digest: 'b'.repeat(64) }],
    }),
    receivedAt: '2026-07-16T12:04:00.000Z',
  });

  assert.equal(first.appended, true);
  assert.equal(duplicate.appended, false);
  assert.equal(second.entry.sequence, 2);
  assert.equal(second.entry.previousEntryDigest, first.entry.entryDigest);
  assert.deepEqual(readImportLedger(ledgerPath).map((entry) => entry.packet.packetId), [
    'packet:base-cortex:market-update-001',
    'packet:index:spike-001',
  ]);
  assert.equal(readFileSync(ledgerPath, 'utf8').trim().split('\n').length, 2);
});

test('rejects a packet with outbound authority or an unrecognized project source', () => {
  const ledgerPath = path.join(mkdtempSync(path.join(tmpdir(), 'cortex-abv-ledger-')), 'imports.jsonl');
  assert.throws(() => appendImportPacket({
    ledgerPath,
    packet: packet({ returnAuthority: 'feedback' }),
    receivedAt: '2026-07-16T12:01:00.000Z',
  }), /returnAuthority must be none/);
  assert.throws(() => appendImportPacket({
    ledgerPath,
    packet: packet({ source: { kind: 'owned_project_ecosystem', id: 'unrelated-project' } }),
    receivedAt: '2026-07-16T12:01:00.000Z',
  }), /not an approved owned project ecosystem/);
});

test('fails closed when an existing ledger entry breaks the hash chain', () => {
  const ledgerPath = path.join(mkdtempSync(path.join(tmpdir(), 'cortex-abv-ledger-')), 'imports.jsonl');
  appendImportPacket({ ledgerPath, packet: packet(), receivedAt: '2026-07-16T12:01:00.000Z' });
  appendFileSync(ledgerPath, '{"kind":"CortexABVImportLedgerEntry","sequence":2}\n');
  assert.throws(() => readImportLedger(ledgerPath), /breaks the hash chain/);
});
