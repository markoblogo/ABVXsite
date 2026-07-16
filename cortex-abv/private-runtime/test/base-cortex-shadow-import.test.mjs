import assert from 'node:assert/strict';
import test from 'node:test';
import { createBaseCortexShadowImport } from '../src/base-cortex-shadow-import.mjs';

const workforcePacket = {
  schemaVersion: 1,
  kind: 'OneD3xCortexMarketWorkforcePacket',
  taskId: 'synthetic-market-task-001',
  correlationId: 'synthetic-correlation-001',
  diversityMode: 'balanced',
  sourceStatus: 'observed',
  hypotheses: [{ id: 'h-1', statement: 'Synthetic scenario only.' }],
  evidence: [{ ref: 'synthetic:evidence:001' }],
  counterevidence: [],
  officerReview: { status: 'not_requested' },
  humanApproval: { status: 'not_requested' },
  outcome: { status: 'open' },
  blockers: [],
  observedAt: '2026-07-16T13:00:00.000Z',
  sourceDigest: 'c'.repeat(64),
};

test('wraps a future base Cortex workforce packet as a protected, inbound-only shadow import', () => {
  const imported = createBaseCortexShadowImport({ workforcePacket });

  assert.deepEqual(imported, {
    schemaVersion: 1,
    kind: 'CortexABVImportPacket',
    packetId: 'packet:base-cortex:synthetic-market-task-001:synthetic-correlation-001',
    direction: 'inbound_to_cortex_abv',
    source: { kind: 'base_cortex', id: 'base-cortex' },
    classification: 'protected',
    dataKind: 'cortex_market_workforce_packet',
    observedAt: '2026-07-16T13:00:00.000Z',
    provenance: [{ kind: 'base_cortex_workforce_packet', ref: 'synthetic-market-task-001', digest: 'c'.repeat(64) }],
    permittedUse: ['private_context'],
    returnAuthority: 'none',
    payload: {
      mode: 'shadow',
      publicActionAuthority: 'none',
      workforcePacket,
    },
  });
});

test('rejects a source packet that lacks the required workforce review fields', () => {
  const incomplete = { ...workforcePacket };
  delete incomplete.humanApproval;
  assert.throws(() => createBaseCortexShadowImport({ workforcePacket: incomplete }), /humanApproval/);
});
