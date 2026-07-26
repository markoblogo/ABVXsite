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

function validateArtifact(artifact) {
  requireObject(artifact, 'artifact');
  const gates = [
    gate('kind', artifact.kind === 'CortexABVVectorRuntimeLocalEffectTransitionArtifact', 'artifact kind must match', { kind: artifact.kind }),
    gate('version', artifact.version === 'v1', 'artifact version must be v1', { version: artifact.version }),
    gate('authority', artifact.authority === 'local_effect_transition_artifact_only', 'artifact authority must be local_effect_transition_artifact_only', { authority: artifact.authority }),
    gate('engine', artifact.engine === 'turbovec', 'artifact engine must be turbovec', { engine: artifact.engine }),
  ];

  requireObject(artifact.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4ad_prerequisite', artifact.prerequisites.requiredLocalEffectApplicationDecisionEligibility === 'eligible_for_local_effect_transition_artifact', 'artifact must require eligible Stage 4ad decision eligibility', artifact.prerequisites),
    gate('stage4ad_status', artifact.prerequisites.requiredLocalEffectApplicationDecisionStatus === 'passed', 'artifact must require passed Stage 4ad decision receipt', artifact.prerequisites),
    gate('stage4ad_kind', artifact.prerequisites.requiredLocalEffectApplicationDecisionReceiptKind === 'CortexABVVectorRuntimeLocalEffectApplicationDecisionReceipt', 'artifact must require Stage 4ad decision receipt kind', artifact.prerequisites),
    gate('stage4ad_digest_required', artifact.prerequisites.requiresLocalEffectApplicationDecisionReceiptDigest === true, 'Stage 4ad decision receipt digest is required', artifact.prerequisites),
  );

  requireObject(artifact.ownerApproval, 'ownerApproval');
  gates.push(
    gate('owner_required', artifact.ownerApproval.required === true, 'owner approval must be required', artifact.ownerApproval),
    gate('owner_mode', artifact.ownerApproval.approvalMode === 'explicit_owner_manual_decision', 'owner approval mode must be explicit manual decision', artifact.ownerApproval),
    gate('owner_role', artifact.ownerApproval.approvedByRole === 'owner', 'owner approval role must be owner', artifact.ownerApproval),
    gate('owner_status', artifact.ownerApproval.status === 'approved', 'owner approval status must be approved', artifact.ownerApproval),
    gate('owner_scope', artifact.ownerApproval.scope === 'bounded_local_effect_transition_artifact_only', 'owner approval scope must stay bounded to effect transition artifact only', artifact.ownerApproval),
  );

  requireObject(artifact.effectTransitionDefinition, 'effectTransitionDefinition');
  requireArray(artifact.effectTransitionDefinition.allowedBindings, 'effectTransitionDefinition.allowedBindings');
  requireArray(artifact.effectTransitionDefinition.allowedLocalDecisionSteps, 'effectTransitionDefinition.allowedLocalDecisionSteps');
  const allowedSteps = new Set([
    'candidate_query_preview',
    'claim_evidence_verification',
    'rollback_readiness_review',
    'proposal_alignment_review',
  ]);
  const allowedBindings = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  gates.push(
    gate('transition_scope', artifact.effectTransitionDefinition.transitionScope === 'strictly_local_receipt_only', 'effect transition scope must remain strictly local and receipt-only', artifact.effectTransitionDefinition),
    gate('transition_source_state', artifact.effectTransitionDefinition.sourceState === 'bounded_owner_initiated_local_active_runtime_candidate', 'effect transition source state must match', artifact.effectTransitionDefinition),
    gate('transition_target_state', artifact.effectTransitionDefinition.targetState === 'bounded_owner_approved_local_effect_transition_candidate', 'effect transition target state must match', artifact.effectTransitionDefinition),
    gate('transition_mode', artifact.effectTransitionDefinition.transitionMode === 'owner_invoked_local_effect_plan_only', 'transition mode must match bounded local effect plan only', artifact.effectTransitionDefinition),
    gate('transition_location', artifact.effectTransitionDefinition.allowedLocation === 'cortex-abv-private-runtime-only', 'transition location must stay private-runtime only', artifact.effectTransitionDefinition),
    gate('transition_module_path', artifact.effectTransitionDefinition.requiredModulePath === 'src/vector-runtime-controlled-module-harness.mjs', 'required module path must match fixed harness', artifact.effectTransitionDefinition),
    gate('transition_steps', artifact.effectTransitionDefinition.allowedLocalDecisionSteps.every((step) => allowedSteps.has(step)), 'allowed local transition steps must stay allowlisted', artifact.effectTransitionDefinition),
    gate('transition_bindings', artifact.effectTransitionDefinition.allowedBindings.every((binding) => allowedBindings.has(binding)), 'required bindings must stay allowlisted', artifact.effectTransitionDefinition),
    gate('transition_not_applied_here', artifact.effectTransitionDefinition.effectTransitionAppliedHere === false, 'effect transition must not be applied here', artifact.effectTransitionDefinition),
    gate('state_transition_not_applied_here', artifact.effectTransitionDefinition.stateTransitionAppliedHere === false, 'state transition must not be applied here', artifact.effectTransitionDefinition),
    gate('activation_not_applied_here', artifact.effectTransitionDefinition.runtimeActivationAppliedHere === false, 'runtime activation must not be applied here', artifact.effectTransitionDefinition),
  );

  requireObject(artifact.effectTransitionSummary, 'effectTransitionSummary');
  for (const [key, expected] of Object.entries({
    candidateQueryPreviewReady: true,
    claimEvidenceVerificationReady: true,
    rollbackReadinessPlanned: true,
    proposalAlignmentConfirmed: true,
    effectExecutionPlanned: false,
  })) {
    gates.push(gate(`effect_summary_${key}`, artifact.effectTransitionSummary[key] === expected, `effectTransitionSummary.${key} must be ${expected}`, artifact.effectTransitionSummary));
  }

  requireObject(artifact.rollbackPlan, 'rollbackPlan');
  requireArray(artifact.rollbackPlan.steps, 'rollbackPlan.steps');
  gates.push(
    gate('rollback_required', artifact.rollbackPlan.required === true, 'rollback plan must be required', artifact.rollbackPlan),
    gate('rollback_strategy', artifact.rollbackPlan.strategy === 'retain_effect_transition_artifact_and_keep_all_effects_unapplied', 'rollback strategy must match bounded effect transition rollback', artifact.rollbackPlan),
    gate('rollback_receipt_only', artifact.rollbackPlan.receiptOnlyEvidence === true, 'rollback evidence must remain receipt-only', artifact.rollbackPlan),
    gate('rollback_owner_reversal', artifact.rollbackPlan.ownerReversalAllowed === true, 'owner reversal must remain allowed', artifact.rollbackPlan),
  );

  requireObject(artifact.nextGate, 'nextGate');
  gates.push(
    gate('next_gate_target', artifact.nextGate.targetEligibility === 'eligible_for_local_effect_transition_dry_run', 'next gate target must be local effect transition dry-run', artifact.nextGate),
    gate('next_gate_kind', artifact.nextGate.futureRunKind === 'CortexABVVectorRuntimeLocalEffectTransitionDryRun', 'future run kind must match', artifact.nextGate),
    gate('next_gate_mode', artifact.nextGate.futureRunMode === 'local_effect_transition_dry_run_only', 'future run mode must match', artifact.nextGate),
    gate('next_gate_not_applied', artifact.nextGate.effectTransitionAppliedHere === false, 'effect transition must not be applied at artifact gate', artifact.nextGate),
  );

  requireObject(artifact.forbiddenAuthority, 'forbiddenAuthority');
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
    gates.push(gate(`forbidden_${key}`, artifact.forbiddenAuthority[key] === expected, `forbiddenAuthority.${key} must be ${expected}`, artifact.forbiddenAuthority));
  }

  requireObject(artifact.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    localEffectTransitionArtifactOnly: true,
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
    gates.push(gate(`governance_${key}`, artifact.governance[key] === expected, `governance.${key} must be ${expected}`, artifact.governance));
  }

  return gates;
}

function validateDecisionReceipt(receipt, artifact) {
  return [
    gate('kind', receipt.kind === artifact.prerequisites.requiredLocalEffectApplicationDecisionReceiptKind, 'Stage 4ad decision receipt kind must match prerequisite', { kind: receipt.kind }),
    gate('status', receipt.status === artifact.prerequisites.requiredLocalEffectApplicationDecisionStatus, 'Stage 4ad receipt status must be passed', { status: receipt.status }),
    gate('eligibility', receipt.eligibility === artifact.prerequisites.requiredLocalEffectApplicationDecisionEligibility, 'Stage 4ad receipt eligibility must match prerequisite', { eligibility: receipt.eligibility }),
    gate('no_blockers', Array.isArray(receipt.blockers) && receipt.blockers.length === 0, 'Stage 4ad decision receipt must have no blockers', { blockers: receipt.blockers }),
    gate('decision_digest_present', typeof receipt.decisionDigest === 'string' && receipt.decisionDigest.length === 64, 'Stage 4ad decision digest must be present', { decisionDigest: receipt.decisionDigest }),
    gate('stage4ab_receipt_digest_present', typeof receipt.stage4acReceiptDigest === 'string' && receipt.stage4acReceiptDigest.length === 64, 'Stage 4ac decision-link digest must be present', { stage4acReceiptDigest: receipt.stage4acReceiptDigest }),
    gate('scope_match', receipt.decisionDefinition?.decisionScope === artifact.effectTransitionDefinition.transitionScope, 'effect transition scope must match Stage 4ad decision scope', {
      decisionDefinition: receipt.decisionDefinition,
      effectTransitionDefinition: artifact.effectTransitionDefinition,
    }),
    gate('source_state_match', receipt.decisionDefinition?.sourceState === artifact.effectTransitionDefinition.sourceState, 'effect transition source state must match Stage 4ad decision source state', {
      decisionDefinition: receipt.decisionDefinition,
      effectTransitionDefinition: artifact.effectTransitionDefinition,
    }),
    gate(
      'decision_steps_match',
      JSON.stringify(receipt.decisionDefinition?.allowedLocalDecisionSteps ?? []) === JSON.stringify(artifact.effectTransitionDefinition.allowedLocalDecisionSteps),
      'allowed local decision steps in Stage 4ad receipt must align with transition definition', {
        decisionDefinition: receipt.decisionDefinition,
        effectTransitionDefinition: artifact.effectTransitionDefinition,
      },
    ),
    gate(
      'required_module_match',
      receipt.decisionDefinition?.requiredModulePath === artifact.effectTransitionDefinition.requiredModulePath,
      'required module path in receipt must match artifact contract',
      {
        decisionDefinition: receipt.decisionDefinition,
        effectTransitionDefinition: artifact.effectTransitionDefinition,
      },
    ),
    gate(
      'bindings_match',
      JSON.stringify(receipt.decisionDefinition?.requiredBindings ?? []) === JSON.stringify(artifact.effectTransitionDefinition.allowedBindings),
      'required bindings in receipt must match artifact contract',
      {
        decisionDefinition: receipt.decisionDefinition,
        effectTransitionDefinition: artifact.effectTransitionDefinition,
      },
    ),
  ];
}

export function runVectorRuntimeLocalEffectTransitionArtifact({ artifactPath, stage4adReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(artifactPath)) throw new Error(`local effect transition artifact file not found: ${artifactPath}`);
  if (!existsSync(stage4adReceiptPath)) throw new Error(`local effect application decision receipt file not found: ${stage4adReceiptPath}`);

  const artifact = readJson(artifactPath);
  const stage4adReceipt = readJson(stage4adReceiptPath);
  const gates = {
    artifact: validateArtifact(artifact),
    stage4adReceipt: validateDecisionReceipt(stage4adReceipt, artifact),
  };

  const blockers = Object.entries(gates).flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const artifactDigest = sha256(artifact);
  const stage4adReceiptDigest = sha256(stage4adReceipt);

  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeLocalEffectTransitionReceipt',
    version: 'v1',
    authority: 'local_effect_transition_artifact_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_local_effect_transition_dry_run' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'local_effect_transition_artifact',
    engine: artifact.engine,
    artifactDigest,
    stage4adReceiptDigest,
    prerequisiteDigests: {
      stage4acReceiptDigest: stage4adReceipt.stage4acReceiptDigest,
      stage4abReceiptDigest: stage4adReceipt.stage4abReceiptDigest,
      stage4aaReceiptDigest: stage4adReceipt.prerequisiteDigests?.stage4aaReceiptDigest,
      stage4zReceiptDigest: stage4adReceipt.prerequisiteDigests?.stage4zReceiptDigest,
      stage4yReceiptDigest: stage4adReceipt.prerequisiteDigests?.stage4yReceiptDigest,
      stage4xReceiptDigest: stage4adReceipt.prerequisiteDigests?.stage4xReceiptDigest,
      stage4wReceiptDigest: stage4adReceipt.prerequisiteDigests?.stage4wReceiptDigest,
      stage4vReceiptDigest: stage4adReceipt.prerequisiteDigests?.stage4vReceiptDigest,
      stage4uReceiptDigest: stage4adReceipt.prerequisiteDigests?.stage4uReceiptDigest,
      stage4tReceiptDigest: stage4adReceipt.prerequisiteDigests?.stage4tReceiptDigest,
      stage4sReceiptDigest: stage4adReceipt.prerequisiteDigests?.stage4sReceiptDigest,
      stage4rReceiptDigest: stage4adReceipt.prerequisiteDigests?.stage4rReceiptDigest,
      stage4qReceiptDigest: stage4adReceipt.prerequisiteDigests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4adReceipt.prerequisiteDigests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4adReceipt.prerequisiteDigests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4adReceipt.prerequisiteDigests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4adReceipt.prerequisiteDigests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4adReceipt.prerequisiteDigests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4adReceipt.prerequisiteDigests?.receiptLinkageDigest,
    },
    ownerApproval: artifact.ownerApproval,
    effectTransitionDefinition: artifact.effectTransitionDefinition,
    effectTransitionSummary: artifact.effectTransitionSummary,
    rollbackPlan: artifact.rollbackPlan,
    nextGate: artifact.nextGate,
    governance: {
      readOnly: true,
      proposalOnly: true,
      localEffectTransitionArtifactOnly: true,
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
      artifact: { path: artifactPath, kind: artifact.kind, digest: artifactDigest },
      localEffectApplicationDecisionReceipt: {
        path: stage4adReceiptPath,
        kind: stage4adReceipt.kind,
        status: stage4adReceipt.status,
        eligibility: stage4adReceipt.eligibility,
        digest: stage4adReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'local_effect_transition_artifact_plus_local_effect_application_decision_receipt',
      reason: eligible
        ? 'Explicit owner-approved local effect transition artifact recorded under the Stage 4ad boundary, still without applying any transition or effects.'
        : 'Local effect transition artifact blocked because Stage 4ad decision proof, owner approval, transition definition or governance boundary is incomplete.',
      nextAllowedStep: eligible ? 'local_effect_transition_dry_run' : 'revise_local_effect_transition_artifact',
      effectTransitionApplied: false,
      stateTransitionApplied: false,
      runtimeActivationApplied: false,
    },
    summary: eligible
      ? 'Owner-approved local effect transition artifact recorded. It only allows preparation for a later local effect-transition dry-run and does not apply any transition, effects, or activation.'
      : 'Local effect transition artifact is not eligible.',
  };

  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = runVectorRuntimeLocalEffectTransitionArtifact({
      artifactPath: option('--artifact') || path.resolve(process.cwd(), 'config/vector-runtime-local-effect-transition.v1.json'),
      stage4adReceiptPath: option('--stage4ad-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-effect-application-decision-receipt.v1.json'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-effect-transition-receipt.v1.json'),
    });
    console.log(`Vector runtime local effect transition artifact complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
  } catch (error) {
    console.error(`Vector runtime local effect transition artifact failed: ${error.message}`);
    process.exitCode = 1;
  }
}
