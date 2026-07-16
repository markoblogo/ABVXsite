import assert from 'node:assert/strict';
import test from 'node:test';
import { createIndexSpikeShadowImport } from '../src/index-spike-shadow-import.mjs';

const projectUpdate = {
  schemaVersion: 1,
  kind: 'IndexSpikeProjectUpdatePacket',
  updateId: 'synthetic-spike-update-001',
  projectId: 'index/spike',
  sourceStatus: 'observed',
  changeSet: [{ surface: 'repository', kind: 'synthetic_metadata_update', ref: 'synthetic:index:spike:001' }],
  evidence: [{ ref: 'synthetic:evidence:spike:001', status: 'observed' }],
  review: { status: 'not_requested' },
  blockers: [],
  observedAt: '2026-07-16T14:00:00.000Z',
  sourceDigest: 'd'.repeat(64),
};

test('wraps a future Index/spike update as a protected inbound-only shadow import', () => {
  const imported = createIndexSpikeShadowImport({ projectUpdate });

  assert.deepEqual(imported, {
    schemaVersion: 1,
    kind: 'CortexABVImportPacket',
    packetId: 'packet:index-spike:synthetic-spike-update-001',
    direction: 'inbound_to_cortex_abv',
    source: { kind: 'owned_project_ecosystem', id: 'index/spike' },
    classification: 'protected',
    dataKind: 'index_spike_project_update',
    observedAt: '2026-07-16T14:00:00.000Z',
    provenance: [{ kind: 'index_spike_project_update', ref: 'synthetic-spike-update-001', digest: 'd'.repeat(64) }],
    permittedUse: ['private_context'],
    returnAuthority: 'none',
    payload: {
      mode: 'shadow',
      publicActionAuthority: 'none',
      projectUpdate,
    },
  });
});

test('rejects a packet whose project identity is not Index/spike', () => {
  assert.throws(() => createIndexSpikeShadowImport({ projectUpdate: { ...projectUpdate, projectId: 'cropto' } }), /projectId must be index\/spike/);
});
