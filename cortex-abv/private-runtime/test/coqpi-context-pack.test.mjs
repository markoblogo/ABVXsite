import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { validateCoqPiContextPack } from '../src/coqpi-context-pack.mjs';

const fixture = JSON.parse(readFileSync(new URL('../examples/synthetic-coqpi-context-pack.json', import.meta.url), 'utf8'));

test('validates an approved compact CoqPi context pack without source content', () => {
  const pack = validateCoqPiContextPack(fixture);
  assert.equal(pack.authority, 'read_only');
  assert.equal(pack.sourceContentIncluded, false);
  assert.equal(pack.compactContext, fixture.compactContext);
  assert.equal(pack.sourceRefs[0].sourceId, 'personal:synthetic-profile');
  assert.equal(pack.eligibility.consumer, 'coqpi');
});

test('rejects a compact pack without the required abstention boundary', () => {
  assert.throws(
    () => validateCoqPiContextPack({ ...fixture, abstention: {} }),
    /must require clarification or abstention/
  );
});

test('rejects a compact pack with an undeclared raw source field', () => {
  assert.throws(
    () => validateCoqPiContextPack({ ...fixture, rawSourceText: 'must never cross the adapter' }),
    /unsupported field/
  );
});
