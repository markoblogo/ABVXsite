import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { validateCoqPiSharedRagIngress } from '../src/coqpi-shared-rag-ingress.mjs';

const fixture = JSON.parse(readFileSync(new URL('../examples/synthetic-coqpi-shared-rag-ingress.json', import.meta.url), 'utf8'));

test('keeps new CoqPi ingress pending, owner-controlled, and CoqPi-only', () => {
  const ingress = validateCoqPiSharedRagIngress(fixture);
  assert.equal(ingress.contentHash, null);
  assert.deepEqual(ingress.retrievalScopes, ['coqpi_pending_classification']);
  assert.equal(ingress.promotion, 'explicit_audit_required');
});

test('rejects premature promotion or an invented content hash', () => {
  assert.throws(
    () => validateCoqPiSharedRagIngress({ ...fixture, contentHash: 'a'.repeat(64) }),
    /must not claim a content hash/
  );
  assert.throws(
    () => validateCoqPiSharedRagIngress({ ...fixture, retrievalScopes: ['cortex_personal'] }),
    /CoqPi-only/
  );
});
