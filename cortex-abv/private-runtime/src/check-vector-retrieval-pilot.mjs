import { readFileSync } from 'node:fs';

function requireObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(message);
  }
}

function requireString(value, message) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(message);
  }
}

function requireBoolean(value, message) {
  if (typeof value !== 'boolean') {
    throw new Error(message);
  }
}

function requirePositiveNumber(value, message) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(message);
  }
}

function requireArray(value, message) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(message);
  }
}

export function validateVectorRetrievalPilotPlan(plan) {
  requireObject(plan, 'vector retrieval pilot plan must be an object');
  if (plan.schemaVersion !== 1) throw new Error('vector retrieval pilot plan must have schemaVersion 1');
  if (plan.kind !== 'CortexABVVectorRetrievalPilotPlan') throw new Error('vector retrieval pilot plan kind must be CortexABVVectorRetrievalPilotPlan');
  if (plan.version !== 'v1') throw new Error('vector retrieval pilot plan version must be v1');
  if (plan.engine !== 'turbovec') throw new Error('vector retrieval pilot plan engine must be turbovec');
  requireObject(plan.safetyControls, 'vector retrieval pilot plan requires safetyControls object');
  requireBoolean(plan.runtimeIntegration, 'runtimeIntegration must be boolean');
  requireBoolean(plan.externalSideEffects, 'externalSideEffects must be boolean');
  if (plan.runtimeIntegration !== false) {
    throw new Error('vector retrieval pilot must remain runtimeIntegration=false');
  }
  if (plan.externalSideEffects !== false) {
    throw new Error('vector retrieval pilot must remain externalSideEffects=false');
  }

  if (plan.authority !== 'plan_only') {
    throw new Error('vector retrieval pilot must be plan_only');
  }

  requireObject(plan.engineNotes, 'vector retrieval pilot requires engineNotes');
  requireString(plan.engineNotes.goal, 'engineNotes.goal is required');
  if (!Array.isArray(plan.engineNotes.notes) || !plan.engineNotes.notes.length) {
    throw new Error('engineNotes.notes must be a non-empty array');
  }
  requireString(plan.engineNotes.reference, 'engineNotes.reference is required');

  requireArray(plan.pilotScope, 'pilotScope must be a non-empty array');
  for (const scope of plan.pilotScope) {
    if (!scope || typeof scope !== 'object') {
      throw new Error('each pilotScope item must be an object');
    }
    requireString(scope.id, 'pilotScope.id is required');
    requireString(scope.source, 'pilotScope.source is required');
    requireBoolean(scope.readOnly, 'pilotScope.readOnly must be boolean');
    if (scope.readOnly !== true) {
      throw new Error('pilotScope entries must be read-only');
    }
  }

  const candidatePolicy = plan.candidatePolicy;
  requireObject(candidatePolicy, 'candidatePolicy is required');
  if (candidatePolicy.mode !== 'allowlist') {
    throw new Error('candidatePolicy.mode must be allowlist');
  }
  requirePositiveNumber(candidatePolicy.maxReturn, 'candidatePolicy.maxReturn must be a positive integer');
  if (typeof candidatePolicy.minScoreFloor !== 'number' || candidatePolicy.minScoreFloor < 0 || candidatePolicy.minScoreFloor > 1) {
    throw new Error('candidatePolicy.minScoreFloor must be a number in [0,1]');
  }
  requireBoolean(candidatePolicy.requiresClaimEvidence, 'candidatePolicy.requiresClaimEvidence must be boolean');
  if (candidatePolicy.requiresClaimEvidence !== true) {
    throw new Error('candidatePolicy requires explicit claim evidence');
  }

  requireArray(plan.evaluation?.required || [], 'evaluation.required must be a non-empty array');
  return {
    kind: plan.kind,
    version: plan.version,
    mode: candidatePolicy.mode,
    scopeCount: plan.pilotScope.length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const planPath = process.argv[2] || new URL('../config/vector-retrieval-turbovec-pilot.v1.json', import.meta.url);
  const plan = JSON.parse(readFileSync(planPath, 'utf8'));
  const result = validateVectorRetrievalPilotPlan(plan);
  console.log(`Vector retrieval pilot valid: kind=${result.kind} version=${result.version} scope=${result.scopeCount}`);
}
