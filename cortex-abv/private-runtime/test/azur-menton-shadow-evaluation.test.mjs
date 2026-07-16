import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { validateAzurMentonShadowEvaluationPack } from '../src/azur-menton-shadow-evaluation.mjs';

const sourcePack = JSON.parse(readFileSync(new URL('../config/azur-menton-source-pack.v1.json', import.meta.url), 'utf8'));
const guestChatPolicy = JSON.parse(readFileSync(new URL('../config/azur-menton-guest-chat-policy.v1.json', import.meta.url), 'utf8'));
const evaluationPack = JSON.parse(readFileSync(new URL('../config/azur-menton-shadow-evaluation.v1.json', import.meta.url), 'utf8'));

test('defines a static shadow-only evaluation pack for grounded, abstain, and handoff guest outcomes', () => {
  const validated = validateAzurMentonShadowEvaluationPack({ sourcePack, guestChatPolicy, evaluationPack });
  assert.equal(validated.status, 'shadow_only');
  assert.equal(validated.guestDataIncluded, false);
  assert.deepEqual([...new Set(validated.scenarios.map((scenario) => scenario.expectedDisposition))].sort(), ['abstain', 'grounded_answer', 'handoff']);
  assert.ok(validated.scenarios.every((scenario) => scenario.fixtureOrigin === 'synthetic_intent_template'));
});

test('rejects a grounded scenario that permits an uncited factual answer', () => {
  const unsafe = {
    ...evaluationPack,
    scenarios: evaluationPack.scenarios.map((scenario) => scenario.expectedDisposition === 'grounded_answer'
      ? { ...scenario, citationRequired: false }
      : scenario),
  };
  assert.throws(() => validateAzurMentonShadowEvaluationPack({ sourcePack, guestChatPolicy, evaluationPack: unsafe }), /citationRequired/);
});

test('rejects an availability scenario that does not hand off', () => {
  const unsafe = {
    ...evaluationPack,
    scenarios: evaluationPack.scenarios.map((scenario) => scenario.policyTopic === 'booking_or_availability'
      ? { ...scenario, expectedDisposition: 'grounded_answer', citationRequired: true, requiredSourceKinds: ['guide'] }
      : scenario),
  };
  assert.throws(() => validateAzurMentonShadowEvaluationPack({ sourcePack, guestChatPolicy, evaluationPack: unsafe }), /booking_or_availability.*handoff/);
});
