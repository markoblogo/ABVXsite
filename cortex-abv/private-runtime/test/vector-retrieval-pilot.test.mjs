import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVectorRetrievalPilotPlan } from '../src/check-vector-retrieval-pilot.mjs';

const fixture = fileURLToPath(new URL('../config/vector-retrieval-turbovec-pilot.v1.json', import.meta.url));

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

test('vector retrieval pilot plan validates', () => {
  const plan = readJson(fixture);
  assert.doesNotThrow(() => validateVectorRetrievalPilotPlan(plan));
  const result = validateVectorRetrievalPilotPlan(plan);
  assert.equal(result.kind, 'CortexABVVectorRetrievalPilotPlan');
  assert.equal(result.scopeCount >= 2, true);
});

test('vector retrieval pilot rejects write authority', () => {
  const plan = readJson(fixture);
  plan.externalSideEffects = true;
  assert.throws(() => validateVectorRetrievalPilotPlan(plan), /externalSideEffects/);
});
