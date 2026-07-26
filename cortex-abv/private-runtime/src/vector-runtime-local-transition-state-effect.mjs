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
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
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
    gate('kind', artifact.kind === 'CortexABVVectorRuntimeLocalTransitionStateEffect', 'artifact kind must match', { kind: artifact.kind }),
    gate('version', artifact.version === 'v1', 'artifact version must be v1', { version: artifact.version }),
    gate('authority', artifact.authority === 'local_transition_state_effect_artifact_only', 'artifact authority must be local_transition_state_effect_artifact_only', { authority: artifact.authority }),
    gate('engine', artifact.engine === 'turbovec', 'artifact engine must be turbovec', { engine: artifact.engine }),
  ];

  requireObject(artifact.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4aa_prerequisite', artifact.prerequisites.requiredEffectReviewEligibility === 'eligible_for_local_transition_state_effect_artifact', 'artifact must require eligible Stage 4aa receipt', artifact.prerequisites),
    gate('stage4aa_digest_required', artifact.prerequisites.requiresEffectReviewReceiptDigest === true, 'Stage 4aa receipt digest is required', artifact.prerequisites),
  );

  requireObject(artifact.ownerApproval, 'ownerApproval');
  gates.push(
    gate('owner_required', artifact.ownerApproval.required === true, 'owner approval must be required', artifact.ownerApproval),
    gate('owner_mode', artifact.ownerApproval.approvalMode === 'explicit_owner_manual_decision', 'owner approval mode must be explicit manual decision', artifact.ownerApproval),
    gate('owner_role', artifact.ownerApproval.approvedByRole === 'owner', 'owner approval role must be owner', artifact.ownerApproval),
    gate('owner_status', artifact.ownerApproval.status === 'approved', 'owner approval status must be approved', artifact.ownerApproval),
    gate('owner_scope', artifact.ownerApproval.scope === 'bounded_local_transition_state_effect_artifact_only', 'owner approval scope must stay bounded to effect artifact only', artifact.ownerApproval),
  );

  requireObject(artifact.effectIntent, 'effectIntent');
  requireArray(artifact.effectIntent.allowedEffects, 'effectIntent.allowedEffects');
  requireArray(artifact.effectIntent.requiredBindings, 'effectIntent.requiredBindings');
  const allowedEffects = new Set(['callable_binding_ready', 'read_only_artifact_access_confirmed', 'tenant_scoped_candidate_queries_confirmed', 'verified_evidence_chain_confirmed', 'rollback_chain_preserved']);
  const allowedBindings = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  gates.push(
    gate('effect_scope', artifact.effectIntent.effectScope === 'discussion_only_local_transition_state_effects', 'effect scope must remain discussion-only', artifact.effectIntent),
    gate('effect_source_state', artifact.effectIntent.sourceState === 'bounded_owner_invoked_local_active_runtime_candidate', 'effect source state must match', artifact.effectIntent),
    gate('effect_kind', artifact.effectIntent.effectArtifactKind === 'CortexABVVectorRuntimeLocalTransitionStateEffect', 'effect artifact kind must match', artifact.effectIntent),
    gate('effect_list', artifact.effectIntent.allowedEffects.every((effect) => allowedEffects.has(effect)), 'effects must stay allowlisted', artifact.effectIntent),
    gate('effect_module_path', artifact.effectIntent.requiredModulePath === 'src/vector-runtime-controlled-module-harness.mjs', 'required module path must match fixed harness', artifact.effectIntent),
    gate('effect_bindings', artifact.effectIntent.requiredBindings.every((binding) => allowedBindings.has(binding)), 'required bindings must stay allowlisted', artifact.effectIntent),
    gate('effect_not_applied_here', artifact.effectIntent.effectAppliedHere === false, 'effect must not be applied here', artifact.effectIntent),
    gate('transition_not_applied_here', artifact.effectIntent.stateTransitionAppliedHere === false, 'state transition must not be applied here', artifact.effectIntent),
    gate('activation_not_applied_here', artifact.effectIntent.runtimeActivationAppliedHere === false, 'runtime activation must not be applied here', artifact.effectIntent),
  );

  requireObject(artifact.effectSummary, 'effectSummary');
  for (const [key, expected] of Object.entries({
    callableBindingReady: true,
    readOnlyArtifactAccessConfirmed: true,
    tenantScopedCandidateQueriesConfirmed: true,
    verifiedEvidenceChainConfirmed: true,
    rollbackChainPreserved: true,
  })) {
    gates.push(gate(`effect_summary_${key}`, artifact.effectSummary[key] === expected, `effectSummary.${key} must be ${expected}`, artifact.effectSummary));
  }

  requireObject(artifact.rollbackPlan, 'rollbackPlan');
  requireArray(artifact.rollbackPlan.steps, 'rollbackPlan.steps');
  gates.push(
    gate('rollback_required', artifact.rollbackPlan.required === true, 'rollback plan must be required', artifact.rollbackPlan),
    gate('rollback_strategy', artifact.rollbackPlan.strategy === 'discard_local_effect_artifact_and_keep_transition_unapplied', 'rollback strategy must match bounded effect rollback', artifact.rollbackPlan),
    gate('rollback_receipt_only', artifact.rollbackPlan.receiptOnlyEvidence === true, 'rollback evidence must remain receipt-only', artifact.rollbackPlan),
    gate('rollback_owner_reversal', artifact.rollbackPlan.ownerReversalAllowed === true, 'owner reversal must remain allowed', artifact.rollbackPlan),
  );

  requireObject(artifact.nextGate, 'nextGate');
  gates.push(
    gate('next_gate_target', artifact.nextGate.targetEligibility === 'eligible_for_local_effect_application_review', 'next gate target must be local effect application review', artifact.nextGate),
    gate('next_gate_kind', artifact.nextGate.futureReviewKind === 'CortexABVVectorRuntimeLocalEffectApplicationReview', 'future review kind must match', artifact.nextGate),
    gate('next_gate_mode', artifact.nextGate.futureReviewMode === 'local_effect_application_review_only', 'future review mode must match', artifact.nextGate),
    gate('next_gate_not_applied', artifact.nextGate.effectAppliedHere === false, 'effect must not be applied at artifact gate', artifact.nextGate),
  );

  requireObject(artifact.forbiddenAuthority, 'forbiddenAuthority');
  for (const [key, expected] of Object.entries({
    activationAppliedHere: false,
    stateTransitionAppliedHere: false,
    effectAppliedHere: false,
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
    transitionStateEffectArtifactOnly: true,
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

function validateStage4aaReceipt(receipt, artifact) {
  const ed = receipt.effectDefinition || {};
  return [
    gate('kind', receipt.kind === artifact.prerequisites.requiredEffectReviewReceiptKind, 'Stage 4aa receipt kind must match prerequisite', { kind: receipt.kind }),
    gate('status', receipt.status === artifact.prerequisites.requiredEffectReviewStatus, 'Stage 4aa receipt status must be passed', { status: receipt.status }),
    gate('eligibility', receipt.eligibility === artifact.prerequisites.requiredEffectReviewEligibility, 'Stage 4aa receipt eligibility must match prerequisite', { eligibility: receipt.eligibility }),
    gate('no_blockers', Array.isArray(receipt.blockers) && receipt.blockers.length === 0, 'Stage 4aa receipt must have no blockers', { blockers: receipt.blockers }),
    gate('stage4z_receipt_digest_present', typeof receipt.stage4zReceiptDigest === 'string' && receipt.stage4zReceiptDigest.length === 64, 'Stage 4z receipt digest must be present', { stage4zReceiptDigest: receipt.stage4zReceiptDigest }),
    gate('stage4y_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4yReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4yReceiptDigest.length === 64, 'Stage 4y receipt digest must be present', receipt.prerequisiteDigests),
    gate('stage4x_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4xReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4xReceiptDigest.length === 64, 'Stage 4x receipt digest must be present', receipt.prerequisiteDigests),
    gate('stage4w_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4wReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4wReceiptDigest.length === 64, 'Stage 4w receipt digest must be present', receipt.prerequisiteDigests),
    gate('stage4v_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4vReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4vReceiptDigest.length === 64, 'Stage 4v receipt digest must be present', receipt.prerequisiteDigests),
    gate('stage4u_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4uReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4uReceiptDigest.length === 64, 'Stage 4u receipt digest must be present', receipt.prerequisiteDigests),
    gate('stage4t_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4tReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4tReceiptDigest.length === 64, 'Stage 4t receipt digest must be present', receipt.prerequisiteDigests),
    gate('stage4s_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4sReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4sReceiptDigest.length === 64, 'Stage 4s receipt digest must be present', receipt.prerequisiteDigests),
    gate('stage4r_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4rReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4rReceiptDigest.length === 64, 'Stage 4r receipt digest must be present', receipt.prerequisiteDigests),
    gate('stage4q_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4qReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4qReceiptDigest.length === 64, 'Stage 4q receipt digest must be present', receipt.prerequisiteDigests),
    gate('stage4p_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4pReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4pReceiptDigest.length === 64, 'Stage 4p receipt digest must be present', receipt.prerequisiteDigests),
    gate('stage4o_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4oReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4oReceiptDigest.length === 64, 'Stage 4o receipt digest must be present', receipt.prerequisiteDigests),
    gate('stage4n_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4nReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4nReceiptDigest.length === 64, 'Stage 4n receipt digest must be present', receipt.prerequisiteDigests),
    gate('stage4h_index_digest_present', typeof receipt.prerequisiteDigests?.stage4hIndexDigest === 'string' && receipt.prerequisiteDigests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', receipt.prerequisiteDigests),
    gate('stage4h_source_digest_present', typeof receipt.prerequisiteDigests?.stage4hSourceDigest === 'string' && receipt.prerequisiteDigests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', receipt.prerequisiteDigests),
    gate('receipt_linkage_digest_present', typeof receipt.prerequisiteDigests?.receiptLinkageDigest === 'string' && receipt.prerequisiteDigests.receiptLinkageDigest.length === 64, 'receipt linkage digest must be present', receipt.prerequisiteDigests),
    gate('effect_scope_match', ed.effectScope === artifact.effectIntent.effectScope, 'effect scope must match Stage 4aa boundary', { ed, effectIntent: artifact.effectIntent }),
    gate('effect_source_state_match', ed.sourceState === artifact.effectIntent.sourceState, 'effect source state must match Stage 4aa boundary', { ed, effectIntent: artifact.effectIntent }),
    gate('effect_allowed_effects_match', JSON.stringify(ed.allowedEffects) === JSON.stringify(artifact.effectIntent.allowedEffects), 'allowed effects must match Stage 4aa boundary', { ed, effectIntent: artifact.effectIntent }),
    gate('effect_module_path_match', ed.requiredModulePath === artifact.effectIntent.requiredModulePath, 'required module path must match Stage 4aa boundary', { ed, effectIntent: artifact.effectIntent }),
    gate('effect_bindings_match', JSON.stringify(ed.requiredBindings) === JSON.stringify(artifact.effectIntent.requiredBindings), 'required bindings must match Stage 4aa boundary', { ed, effectIntent: artifact.effectIntent }),
    gate('no_runtime_activation_applied', receipt.governance?.runtimeActivationApplied === false, 'Stage 4aa must not apply runtime activation', receipt.governance),
    gate('no_state_transition_applied', receipt.governance?.stateTransitionApplied === false, 'Stage 4aa must not apply state transition', receipt.governance),
    gate('no_endpoint', receipt.governance?.endpoint === false, 'Stage 4aa must not approve endpoint', receipt.governance),
    gate('no_scheduler', receipt.governance?.scheduler === false, 'Stage 4aa must not approve scheduler', receipt.governance),
    gate('no_network', receipt.governance?.networkCalls === false, 'Stage 4aa must not approve network calls', receipt.governance),
    gate('no_llm', receipt.governance?.llmCalls === false, 'Stage 4aa must not approve LLM calls', receipt.governance),
    gate('no_public_action', receipt.governance?.publicActionAuthority === false, 'Stage 4aa must not approve public action authority', receipt.governance),
  ];
}

export function runVectorRuntimeLocalTransitionStateEffectArtifact({ artifactPath, stage4aaReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(artifactPath)) throw new Error(`local transition state effect artifact file not found: ${artifactPath}`);
  if (!existsSync(stage4aaReceiptPath)) throw new Error(`local transition state effect review receipt file not found: ${stage4aaReceiptPath}`);
  const artifact = readJson(artifactPath);
  const stage4aaReceipt = readJson(stage4aaReceiptPath);
  const gates = {
    artifact: validateArtifact(artifact),
    stage4aaReceipt: validateStage4aaReceipt(stage4aaReceipt, artifact),
  };
  const blockers = Object.entries(gates).flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const artifactDigest = sha256(artifact);
  const stage4aaReceiptDigest = sha256(stage4aaReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeLocalTransitionStateEffectReceipt',
    version: 'v1',
    authority: 'local_transition_state_effect_artifact_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_local_effect_application_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'local_transition_state_effect_artifact',
    engine: artifact.engine,
    artifactDigest,
    stage4aaReceiptDigest,
    prerequisiteDigests: {
      stage4zReceiptDigest: stage4aaReceipt.stage4zReceiptDigest,
      stage4yReceiptDigest: stage4aaReceipt.prerequisiteDigests?.stage4yReceiptDigest,
      stage4xReceiptDigest: stage4aaReceipt.prerequisiteDigests?.stage4xReceiptDigest,
      stage4wReceiptDigest: stage4aaReceipt.prerequisiteDigests?.stage4wReceiptDigest,
      stage4vReceiptDigest: stage4aaReceipt.prerequisiteDigests?.stage4vReceiptDigest,
      stage4uReceiptDigest: stage4aaReceipt.prerequisiteDigests?.stage4uReceiptDigest,
      stage4tReceiptDigest: stage4aaReceipt.prerequisiteDigests?.stage4tReceiptDigest,
      stage4sReceiptDigest: stage4aaReceipt.prerequisiteDigests?.stage4sReceiptDigest,
      stage4rReceiptDigest: stage4aaReceipt.prerequisiteDigests?.stage4rReceiptDigest,
      stage4qReceiptDigest: stage4aaReceipt.prerequisiteDigests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4aaReceipt.prerequisiteDigests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4aaReceipt.prerequisiteDigests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4aaReceipt.prerequisiteDigests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4aaReceipt.prerequisiteDigests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4aaReceipt.prerequisiteDigests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4aaReceipt.prerequisiteDigests?.receiptLinkageDigest,
    },
    ownerApproval: artifact.ownerApproval,
    effectIntent: artifact.effectIntent,
    effectSummary: artifact.effectSummary,
    rollbackPlan: artifact.rollbackPlan,
    nextGate: artifact.nextGate,
    governance: {
      readOnly: true,
      proposalOnly: true,
      transitionStateEffectArtifactOnly: true,
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
      effectReviewReceipt: {
        path: stage4aaReceiptPath,
        kind: stage4aaReceipt.kind,
        status: stage4aaReceipt.status,
        eligibility: stage4aaReceipt.eligibility,
        digest: stage4aaReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'local_transition_state_effect_artifact_plus_stage4aa_review_receipt',
      reason: eligible
        ? 'Explicit owner-approved local transition-state effect artifact recorded under the Stage 4aa boundary, still without applying any effect, transition or activation.'
        : 'Local transition-state effect artifact blocked because Stage 4aa proof, owner approval, effect intent or governance boundary is incomplete.',
      nextAllowedStep: eligible ? 'local_effect_application_review' : 'revise_local_transition_state_effect_artifact',
      activationApplied: false,
      stateTransitionApplied: false,
      effectApplied: false,
    },
    summary: eligible
      ? 'Owner-approved local transition-state effect artifact recorded. It only allows a later local effect-application review and does not apply any effect, transition or activation.'
      : 'Local transition-state effect artifact is not eligible.',
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = runVectorRuntimeLocalTransitionStateEffectArtifact({
      artifactPath: option('--artifact') || path.resolve(process.cwd(), 'config/vector-runtime-local-transition-state-effect.v1.json'),
      stage4aaReceiptPath: option('--stage4aa-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-transition-state-effect-review-receipt.v1.json'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-transition-state-effect-receipt.v1.json'),
    });
    console.log(`Vector runtime local transition state effect artifact complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
  } catch (error) {
    console.error(`Vector runtime local transition state effect artifact failed: ${error.message}`);
    process.exitCode = 1;
  }
}
