import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function requireArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${label} must be a non-empty array`);
}

function gate(id, passed, reason, evidence = {}) {
  return { id, status: passed ? 'accepted' : 'blocked', reason, evidence };
}

function validateDecision(decision) {
  requireObject(decision, 'decision');
  const gates = [
    gate('kind', decision.kind === 'CortexABVVectorRuntimeLocalEffectApplicationDecision', 'decision kind must match', { kind: decision.kind }),
    gate('version', decision.version === 'v1', 'decision version must be v1', { version: decision.version }),
    gate('authority', decision.authority === 'local_effect_application_decision_only', 'decision authority must be local_effect_application_decision_only', { authority: decision.authority }),
    gate('engine', decision.engine === 'turbovec', 'decision engine must be turbovec', { engine: decision.engine }),
  ];

  requireObject(decision.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4ac_prerequisite', decision.prerequisites.requiredLocalEffectApplicationReviewReceiptEligibility === 'eligible_for_local_effect_application', 'decision must require eligible Stage 4ac review receipt', decision.prerequisites),
    gate('stage4ac_status', decision.prerequisites.requiredLocalEffectApplicationReviewReceiptStatus === 'passed', 'decision must require Stage 4ac passed receipt', decision.prerequisites),
    gate('stage4ac_kind', decision.prerequisites.requiredLocalEffectApplicationReviewReceiptKind === 'CortexABVVectorRuntimeLocalEffectApplicationReviewReceipt', 'decision must require the local effect application review receipt kind', decision.prerequisites),
    gate('stage4ac_digest_required', decision.prerequisites.requiresLocalEffectApplicationReviewReceiptDigest === true, 'local effect application review receipt digest is required', decision.prerequisites),
  );

  requireObject(decision.ownerApproval, 'ownerApproval');
  gates.push(
    gate('owner_required', decision.ownerApproval.required === true, 'owner approval must be required', decision.ownerApproval),
    gate('owner_mode', decision.ownerApproval.approvalMode === 'explicit_owner_manual_decision', 'owner approval mode must be explicit manual decision', decision.ownerApproval),
    gate('owner_role', decision.ownerApproval.approvedByRole === 'owner', 'owner approval role must be owner', decision.ownerApproval),
    gate('owner_status', decision.ownerApproval.status === 'approved', 'owner approval status must be approved', decision.ownerApproval),
    gate('owner_scope', decision.ownerApproval.scope === 'bounded_local_effect_application_decision_only', 'owner approval scope must stay bounded to effect application decision only', decision.ownerApproval),
  );

  requireObject(decision.decisionDefinition, 'decisionDefinition');
  requireArray(decision.decisionDefinition.allowedLocalDecisionSteps, 'decisionDefinition.allowedLocalDecisionSteps');
  requireArray(decision.decisionDefinition.requiredBindings, 'decisionDefinition.requiredBindings');
  const allowedDecisionSteps = new Set([
    'candidate_query_preview',
    'claim_evidence_verification',
    'rollback_readiness_review',
    'proposal_alignment_review',
  ]);
  const allowedBindings = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  gates.push(
    gate('decision_scope', decision.decisionDefinition.decisionScope === 'strictly_local_receipt_only', 'decision scope must remain strictly local and receipt-only', decision.decisionDefinition),
    gate('decision_state', decision.decisionDefinition.sourceState === 'bounded_owner_initiated_local_active_runtime_candidate', 'decision source state must remain bounded local candidate state', decision.decisionDefinition),
    gate('decision_artifact_kind', decision.decisionDefinition.decisionArtifactKind === 'CortexABVVectorRuntimeLocalEffectApplicationDecision', 'decision artifact kind must match', decision.decisionDefinition),
    gate('decision_steps', decision.decisionDefinition.allowedLocalDecisionSteps.every((item) => allowedDecisionSteps.has(item)), 'decision steps must stay allowlisted', decision.decisionDefinition),
    gate('decision_module_path', decision.decisionDefinition.requiredModulePath === 'src/vector-runtime-controlled-module-harness.mjs', 'required module path must match fixed harness', decision.decisionDefinition),
    gate('decision_bindings', decision.decisionDefinition.requiredBindings.every((item) => allowedBindings.has(item)), 'required bindings must stay allowlisted', decision.decisionDefinition),
    gate('decision_not_applied_here', decision.decisionDefinition.effectApplicationAppliedHere === false, 'effect application must not be applied in this decision stage', decision.decisionDefinition),
    gate('transition_not_applied_here', decision.decisionDefinition.stateTransitionAppliedHere === false, 'state transition must not be applied in this decision stage', decision.decisionDefinition),
    gate('activation_not_applied_here', decision.decisionDefinition.runtimeActivationAppliedHere === false, 'runtime activation must not be applied in this decision stage', decision.decisionDefinition),
  );

  requireObject(decision.decisionPolicy, 'decisionPolicy');
  for (const [key, expected] of Object.entries({
    proposalOnly: true,
    readOnlyEvidence: true,
    decisionTraceRequired: true,
    tenantScopedCandidateOnly: true,
    noAnswerGeneration: true,
    noCandidateMutation: true,
  })) {
    gates.push(gate(`decision_policy_${key}`, decision.decisionPolicy[key] === expected, `decisionPolicy.${key} must be ${expected}`, decision.decisionPolicy));
  }

  requireObject(decision.rollbackDecisionPolicy, 'rollbackDecisionPolicy');
  for (const [key, expected] of Object.entries({
    required: true,
    strategy: 'retain_decision_receipt_and_keep_effects_unapplied',
    ownerReversalAllowed: true,
    receiptOnlyEvidence: true,
    externalMutationAllowed: false,
  })) {
    gates.push(gate(`rollback_${key}`, decision.rollbackDecisionPolicy[key] === expected, `rollbackDecisionPolicy.${key} must be ${expected}`, decision.rollbackDecisionPolicy));
  }

  requireObject(decision.nextGate, 'nextGate');
  for (const [key, expected] of Object.entries({
    targetEligibility: 'eligible_for_local_effect_transition_artifact',
    futureArtifactKind: 'CortexABVVectorRuntimeLocalEffectTransitionArtifact',
    futureArtifactMode: 'local_effect_transition_artifact_only',
    effectAppliedHere: false,
  })) {
    gates.push(gate(`next_gate_${key}`, decision.nextGate[key] === expected, `nextGate.${key} must be ${expected}`, decision.nextGate));
  }

  requireObject(decision.forbiddenAuthority, 'forbiddenAuthority');
  for (const [key, expected] of Object.entries({
    effectAppliedHere: false,
    stateTransitionAppliedHere: false,
    runtimeActivationAppliedHere: false,
    persistentServiceAllowed: false,
    daemonProcessAllowed: false,
    schedulerAllowed: false,
    endpointAllowed: false,
    networkCallsAllowed: false,
    llmCallsAllowed: false,
    publicActionAuthorityAllowed: false,
    answerGenerationAllowed: false,
    sourceMutationAllowed: false,
    artifactMutationAllowed: false,
    writesOutsideReceiptAllowed: false,
    crossTenantQueriesAllowed: false,
    autonomousExecutionAllowed: false,
  })) {
    gates.push(gate(`forbidden_${key}`, decision.forbiddenAuthority[key] === expected, `forbiddenAuthority.${key} must be ${expected}`, decision.forbiddenAuthority));
  }

  requireObject(decision.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    localEffectApplicationDecisionOnly: true,
    runtimeActivationApplied: false,
    stateTransitionApplied: false,
    runtimeIntegration: false,
    endpoint: false,
    scheduler: false,
    networkCalls: false,
    llmCalls: false,
    writesOutsideReceipt: false,
    publicActionAuthority: false,
  })) {
    gates.push(gate(`governance_${key}`, decision.governance[key] === expected, `governance.${key} must be ${expected}`, decision.governance));
  }

  return gates;
}

function validateStage4acReceipt(receipt, decision) {
  return [
    gate('kind', receipt.kind === decision.prerequisites.requiredLocalEffectApplicationReviewReceiptKind, 'Stage 4ac receipt kind must match prerequisite', { kind: receipt.kind }),
    gate('status', receipt.status === decision.prerequisites.requiredLocalEffectApplicationReviewReceiptStatus, 'Stage 4ac receipt status must be passed', { status: receipt.status }),
    gate('eligibility', receipt.eligibility === decision.prerequisites.requiredLocalEffectApplicationReviewReceiptEligibility, 'Stage 4ac receipt eligibility must match prerequisite', { eligibility: receipt.eligibility }),
    gate('no_blockers', Array.isArray(receipt.blockers) && receipt.blockers.length === 0, 'Stage 4ac receipt must have no blockers', { blockers: receipt.blockers }),
    gate('stage4ab_receipt_digest_present', typeof receipt.stage4abReceiptDigest === 'string' && receipt.stage4abReceiptDigest.length === 64, 'Stage 4ab receipt digest must be present', { stage4abReceiptDigest: receipt.stage4abReceiptDigest }),
    gate('stage4aa_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4aaReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4aaReceiptDigest.length === 64, 'Stage 4aa digest must be present', receipt.prerequisiteDigests),
    gate('stage4z_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4zReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4zReceiptDigest.length === 64, 'Stage 4z digest must be present', receipt.prerequisiteDigests),
    gate('stage4y_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4yReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4yReceiptDigest.length === 64, 'Stage 4y digest must be present', receipt.prerequisiteDigests),
    gate('stage4x_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4xReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4xReceiptDigest.length === 64, 'Stage 4x digest must be present', receipt.prerequisiteDigests),
    gate('stage4w_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4wReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4wReceiptDigest.length === 64, 'Stage 4w digest must be present', receipt.prerequisiteDigests),
    gate('stage4v_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4vReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4vReceiptDigest.length === 64, 'Stage 4v digest must be present', receipt.prerequisiteDigests),
    gate('stage4u_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4uReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4uReceiptDigest.length === 64, 'Stage 4u digest must be present', receipt.prerequisiteDigests),
    gate('stage4t_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4tReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4tReceiptDigest.length === 64, 'Stage 4t digest must be present', receipt.prerequisiteDigests),
    gate('stage4s_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4sReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4sReceiptDigest.length === 64, 'Stage 4s digest must be present', receipt.prerequisiteDigests),
    gate('stage4r_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4rReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4rReceiptDigest.length === 64, 'Stage 4r digest must be present', receipt.prerequisiteDigests),
    gate('stage4q_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4qReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4qReceiptDigest.length === 64, 'Stage 4q digest must be present', receipt.prerequisiteDigests),
    gate('stage4p_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4pReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4pReceiptDigest.length === 64, 'Stage 4p digest must be present', receipt.prerequisiteDigests),
    gate('stage4o_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4oReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4oReceiptDigest.length === 64, 'Stage 4o digest must be present', receipt.prerequisiteDigests),
    gate('stage4n_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4nReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4nReceiptDigest.length === 64, 'Stage 4n digest must be present', receipt.prerequisiteDigests),
    gate('stage4h_index_digest_present', typeof receipt.prerequisiteDigests?.stage4hIndexDigest === 'string' && receipt.prerequisiteDigests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', receipt.prerequisiteDigests),
    gate('stage4h_source_digest_present', typeof receipt.prerequisiteDigests?.stage4hSourceDigest === 'string' && receipt.prerequisiteDigests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', receipt.prerequisiteDigests),
    gate('receipt_linkage_digest_present', typeof receipt.prerequisiteDigests?.receiptLinkageDigest === 'string' && receipt.prerequisiteDigests.receiptLinkageDigest.length === 64, 'receipt linkage digest must be present', receipt.prerequisiteDigests),
    gate('decision_scope_match', receipt.applicationDefinition?.applicationScope === decision.decisionDefinition.decisionScope, 'application scope in Stage 4ac receipt must match decision scope', { receipt: receipt.applicationDefinition, decision: decision.decisionDefinition }),
    gate('decision_state_match', receipt.applicationDefinition?.sourceState === decision.decisionDefinition.sourceState, 'application source state in Stage 4ac receipt must match decision source state', { receipt: receipt.applicationDefinition, decision: decision.decisionDefinition }),
    gate('decision_steps_match', JSON.stringify(receipt.applicationDefinition?.allowedLocalApplications ?? []) === JSON.stringify(decision.decisionDefinition.allowedLocalDecisionSteps), 'allowed local applications in Stage 4ac receipt must align with decision steps', { receipt: receipt.applicationDefinition, decision: decision.decisionDefinition }),
    gate('decision_module_match', receipt.applicationDefinition?.requiredModulePath === decision.decisionDefinition.requiredModulePath, 'required module path in receipt must match decision contract', { receipt: receipt.applicationDefinition, requiredModulePath: decision.decisionDefinition.requiredModulePath }),
    gate('decision_bindings_match', JSON.stringify(receipt.applicationDefinition?.requiredBindings ?? []) === JSON.stringify(decision.decisionDefinition.requiredBindings), 'required bindings in receipt must match decision contract', { receipt: receipt.applicationDefinition, requiredBindings: decision.decisionDefinition.requiredBindings }),
    gate('decision_not_applied', receipt.applicationDefinition?.appliesEffectHere === false, 'effect application must not be applied in Stage 4ac receipt', receipt.applicationDefinition),
    gate('decision_transition_not_applied', receipt.applicationDefinition?.stateTransitionAppliedHere === false, 'state transition must not be applied in Stage 4ac receipt', receipt.applicationDefinition),
    gate('decision_activation_not_applied', receipt.applicationDefinition?.runtimeActivationAppliedHere === false, 'runtime activation must not be applied in Stage 4ac receipt', receipt.applicationDefinition),
  ];
}

export function runVectorRuntimeLocalEffectApplicationDecision({ decisionPath, stage4acReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(decisionPath)) throw new Error(`local effect application decision file not found: ${decisionPath}`);
  if (!existsSync(stage4acReceiptPath)) throw new Error(`local effect application review receipt file not found: ${stage4acReceiptPath}`);

  const decision = readJson(decisionPath);
  const stage4acReceipt = readJson(stage4acReceiptPath);
  const gates = {
    decision: validateDecision(decision),
    stage4acReceipt: validateStage4acReceipt(stage4acReceipt, decision),
  };
  const blockers = Object.entries(gates).flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const decisionDigest = sha256(decision);
  const stage4acReceiptDigest = sha256(stage4acReceipt);

  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeLocalEffectApplicationDecisionReceipt',
    version: 'v1',
    authority: 'local_effect_application_decision_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_local_effect_transition_artifact' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'local_effect_application_decision',
    engine: decision.engine,
    decisionDigest,
    stage4acReceiptDigest,
    prerequisiteDigests: {
      stage4abReceiptDigest: stage4acReceipt.stage4abReceiptDigest,
      stage4aaReceiptDigest: stage4acReceipt.prerequisiteDigests?.stage4aaReceiptDigest,
      stage4zReceiptDigest: stage4acReceipt.prerequisiteDigests?.stage4zReceiptDigest,
      stage4yReceiptDigest: stage4acReceipt.prerequisiteDigests?.stage4yReceiptDigest,
      stage4xReceiptDigest: stage4acReceipt.prerequisiteDigests?.stage4xReceiptDigest,
      stage4wReceiptDigest: stage4acReceipt.prerequisiteDigests?.stage4wReceiptDigest,
      stage4vReceiptDigest: stage4acReceipt.prerequisiteDigests?.stage4vReceiptDigest,
      stage4uReceiptDigest: stage4acReceipt.prerequisiteDigests?.stage4uReceiptDigest,
      stage4tReceiptDigest: stage4acReceipt.prerequisiteDigests?.stage4tReceiptDigest,
      stage4sReceiptDigest: stage4acReceipt.prerequisiteDigests?.stage4sReceiptDigest,
      stage4rReceiptDigest: stage4acReceipt.prerequisiteDigests?.stage4rReceiptDigest,
      stage4qReceiptDigest: stage4acReceipt.prerequisiteDigests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4acReceipt.prerequisiteDigests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4acReceipt.prerequisiteDigests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4acReceipt.prerequisiteDigests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4acReceipt.prerequisiteDigests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4acReceipt.prerequisiteDigests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4acReceipt.prerequisiteDigests?.receiptLinkageDigest,
    },
    ownerApproval: decision.ownerApproval,
    decisionDefinition: decision.decisionDefinition,
    decisionPolicy: decision.decisionPolicy,
    rollbackDecisionPolicy: decision.rollbackDecisionPolicy,
    nextGate: decision.nextGate,
    governance: {
      readOnly: true,
      proposalOnly: true,
      localEffectApplicationDecisionOnly: true,
      runtimeActivationApplied: false,
      stateTransitionApplied: false,
      runtimeIntegration: false,
      endpoint: false,
      scheduler: false,
      networkCalls: false,
      llmCalls: false,
      writesOutsideReceipt: false,
      publicActionAuthority: false,
    },
    sources: {
      decision: { path: decisionPath, kind: decision.kind, digest: decisionDigest },
      localEffectApplicationReviewReceipt: {
        path: stage4acReceiptPath,
        kind: stage4acReceipt.kind,
        status: stage4acReceipt.status,
        eligibility: stage4acReceipt.eligibility,
        digest: stage4acReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'local_effect_application_decision_contract_plus_local_effect_application_review_receipt',
      reason: eligible
        ? 'Effect-application decision scope is now explicit and bounded. No effect application, transition or activation is applied in this gate.'
        : 'Local effect-application decision blocked because Stage 4ac review, owner approval, or governance boundary is incomplete.',
      nextAllowedStep: eligible ? 'local_effect_transition_artifact' : 'revise_local_effect_application_decision',
      effectApplicationAllowed: false,
      stateTransitionAllowed: false,
      runtimeActivationAllowed: false,
    },
    summary: eligible
      ? 'Local effect-application decision is now explicitly scoped and owner-approved for bounded local execution planning. No effects are applied.'
      : 'Local effect-application decision is not yet eligible.',
  };

  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = runVectorRuntimeLocalEffectApplicationDecision({
      decisionPath: option('--decision') || path.resolve(process.cwd(), 'config/vector-runtime-local-effect-application-decision.v1.json'),
      stage4acReceiptPath: option('--stage4ac-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-effect-application-review-receipt.v1.json'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-effect-application-decision-receipt.v1.json'),
    });
    console.log(`Vector runtime local effect application decision gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
  } catch (error) {
    console.error(`Vector runtime local effect application decision gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
