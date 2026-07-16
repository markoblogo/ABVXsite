import { validateAzurMentonGuestChatPolicy, validateAzurMentonSourcePack } from './azur-menton-source-pack.mjs';

const DISPOSITIONS = new Set(['grounded_answer', 'abstain', 'handoff']);
const SOURCE_KINDS = new Set(['guide', 'faq', 'place']);
const REQUIRED_DISPOSITIONS = ['grounded_answer', 'abstain', 'handoff'];

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function requireArray(value, label) {
  if (!Array.isArray(value) || !value.length) throw new Error(`${label} must be a non-empty array`);
  return value;
}

function requireExact(value, expected, label) {
  if (value !== expected) throw new Error(`${label} must be ${expected}`);
}

export function validateAzurMentonShadowEvaluationPack({ sourcePack, guestChatPolicy, evaluationPack }) {
  const validatedSourcePack = validateAzurMentonSourcePack(sourcePack);
  const validatedGuestChatPolicy = validateAzurMentonGuestChatPolicy(guestChatPolicy);
  if (evaluationPack?.schemaVersion !== 1 || evaluationPack?.kind !== 'CortexABVAzurMentonGuestShadowEvaluationPack' || evaluationPack?.version !== 'v1') {
    throw new Error('shadow evaluation pack must be CortexABVAzurMentonGuestShadowEvaluationPack v1');
  }
  requireExact(evaluationPack.authority, 'plan', 'shadow evaluation pack authority');
  if (evaluationPack.externalSideEffects !== false || evaluationPack.runtimeIntegration !== false) {
    throw new Error('shadow evaluation pack must remain plan-only without runtime integration');
  }
  requireExact(evaluationPack.tenantId, 'azur-menton', 'shadow evaluation pack tenantId');
  requireExact(evaluationPack.status, 'shadow_only', 'shadow evaluation pack status');
  if (evaluationPack.guestDataIncluded !== false) throw new Error('shadow evaluation pack must not include guest data');
  if (evaluationPack.sourcePackId !== validatedSourcePack.packId) throw new Error('shadow evaluation pack sourcePackId must match the source pack');
  if (evaluationPack.guestChatPolicyId !== validatedGuestChatPolicy.policyId) throw new Error('shadow evaluation pack guestChatPolicyId must match the guest chat policy');
  nonEmptyString(evaluationPack.evaluationTarget, 'shadow evaluation pack evaluationTarget');
  requireExact(evaluationPack.judgeType, 'deterministic_contract_check', 'shadow evaluation pack judgeType');
  requireExact(evaluationPack.decisionRule, 'all_scenarios_must_match_expected_disposition', 'shadow evaluation pack decisionRule');
  requireArray(evaluationPack.knownBiasRisks, 'shadow evaluation pack knownBiasRisks');

  const scenarioIds = new Set();
  const dispositions = new Set();
  for (const scenario of requireArray(evaluationPack.scenarios, 'shadow evaluation pack scenarios')) {
    const id = nonEmptyString(scenario?.id, 'scenario.id');
    if (scenarioIds.has(id)) throw new Error(`scenario id is duplicated: ${id}`);
    scenarioIds.add(id);
    requireExact(scenario.fixtureOrigin, 'synthetic_intent_template', 'scenario.fixtureOrigin');
    nonEmptyString(scenario.questionTemplate, 'scenario.questionTemplate');
    nonEmptyString(scenario.policyTopic, 'scenario.policyTopic');
    if (!DISPOSITIONS.has(scenario.expectedDisposition)) throw new Error(`scenario expectedDisposition is unsupported: ${scenario.expectedDisposition}`);
    dispositions.add(scenario.expectedDisposition);
    if (scenario.expectedDisposition === 'grounded_answer') {
      if (scenario.citationRequired !== true) throw new Error('grounded_answer scenario citationRequired must be true');
      for (const kind of requireArray(scenario.requiredSourceKinds, 'grounded_answer scenario requiredSourceKinds')) {
        if (!SOURCE_KINDS.has(kind)) throw new Error(`grounded_answer scenario requires unsupported source kind: ${kind}`);
      }
    } else if (scenario.citationRequired !== false || !Array.isArray(scenario.requiredSourceKinds) || scenario.requiredSourceKinds.length) {
      throw new Error(`${scenario.expectedDisposition} scenario cannot claim a source-grounded answer`);
    }
    if ((scenario.policyTopic === 'booking_or_availability' || scenario.policyTopic === 'price_or_payment') && scenario.expectedDisposition !== 'handoff') {
      throw new Error(`${scenario.policyTopic} scenario must use handoff`);
    }
    if (scenario.policyTopic === 'personal_context_retrieval' && scenario.expectedDisposition !== 'abstain') {
      throw new Error('personal_context_retrieval scenario must abstain');
    }
  }
  if (REQUIRED_DISPOSITIONS.some((disposition) => !dispositions.has(disposition))) {
    throw new Error('shadow evaluation pack must cover grounded_answer, abstain, and handoff');
  }
  return evaluationPack;
}
