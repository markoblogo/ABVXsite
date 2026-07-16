import assert from 'node:assert/strict';
import test from 'node:test';
import { createMonitorMn7rShadowImport } from '../src/monitor-mn7r-shadow-import.mjs';

const projectUpdate = {
  schemaVersion: 1,
  kind: 'MonitorProjectUpdatePacket',
  updateId: 'synthetic-monitor-update-001',
  projectId: 'monitor',
  productId: 'mn7r',
  sourceStatus: 'observed',
  changeSet: [{ surface: 'repository', kind: 'synthetic_metadata_update', ref: 'synthetic:monitor:mn7r:001' }],
  evidence: [{ ref: 'synthetic:evidence:monitor:001', status: 'observed' }],
  review: { status: 'not_requested' },
  blockers: [],
  observedAt: '2026-07-16T16:00:00.000Z',
  sourceDigest: 'e'.repeat(64),
};

test('wraps a future Monitor/MN7R update as a protected inbound-only shadow import', () => {
  const imported = createMonitorMn7rShadowImport({ projectUpdate });

  assert.deepEqual(imported, {
    schemaVersion: 1,
    kind: 'CortexABVImportPacket',
    packetId: 'packet:monitor-mn7r:synthetic-monitor-update-001',
    direction: 'inbound_to_cortex_abv',
    source: { kind: 'owned_project_ecosystem', id: 'monitor' },
    classification: 'protected',
    dataKind: 'monitor_project_update',
    observedAt: '2026-07-16T16:00:00.000Z',
    provenance: [{ kind: 'monitor_mn7r_project_update', ref: 'synthetic-monitor-update-001', digest: 'e'.repeat(64) }],
    permittedUse: ['private_context'],
    returnAuthority: 'none',
    payload: {
      mode: 'shadow',
      publicActionAuthority: 'none',
      projectUpdate,
    },
  });
});

test('rejects a Monitor update that is not for MN7R', () => {
  assert.throws(() => createMonitorMn7rShadowImport({ projectUpdate: { ...projectUpdate, productId: 'other' } }), /productId must be mn7r/);
});
