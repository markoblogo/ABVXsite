import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { scanCortexAbvPrivateRuntimeExport } from '../scripts/check-cortex-abv-private-runtime-export.mjs';

test('public CortexABV private-runtime snapshot excludes data stores, credentials, and token-like values', () => {
  const report = scanCortexAbvPrivateRuntimeExport({
    runtimeRoot: new URL('../cortex-abv/private-runtime/', import.meta.url),
  });
  assert.equal(report.safe, true);
  assert.equal(report.violations.length, 0);
  assert.ok(report.fileCount > 20);
});

test('blocks an attempted ledger-store export', () => {
  const root = mkdtempSync(join(tmpdir(), 'cortex-abv-export-'));
  try {
    mkdirSync(join(root, 'data'));
    writeFileSync(join(root, 'data', 'ledger.jsonl'), '{}');
    const report = scanCortexAbvPrivateRuntimeExport({ runtimeRoot: root });
    assert.equal(report.safe, false);
    assert.deepEqual(report.violations, [{ path: 'data/ledger.jsonl', rule: 'data_store_path' }]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('allows local gitignored vector index artifacts while keeping data stores blocked', () => {
  const root = mkdtempSync(join(tmpdir(), 'cortex-abv-export-'));
  try {
    mkdirSync(join(root, 'data', 'vector-indexes', 'turbovec-poc'), { recursive: true });
    writeFileSync(join(root, 'data', 'vector-indexes', 'turbovec-poc', 'index-artifact.v1.json'), '{}');
    const report = scanCortexAbvPrivateRuntimeExport({ runtimeRoot: root });
    assert.equal(report.safe, true);
    assert.deepEqual(report.violations, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
