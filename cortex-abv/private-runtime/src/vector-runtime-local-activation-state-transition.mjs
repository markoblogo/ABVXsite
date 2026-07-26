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
    gate('kind', artifact.kind === 'CortexABVVectorRuntimeLocalActivationStateTransition', 'artifact kind must match', { kind: artifact.kind }),
    gate('version', artifact.version === 'v1', 'artifact version must be v1', { version: artifact.version }),
    gate('authority', artifact.authority === 'local_activation_state_transition_artifact_only', 'artifact authority must be local_activation_state_transition_artifact_only', { authority: artifact.authority }),
    gate('engine', artifact.engine === 'turbovec', 'artifact engine must be turbovec', { engine: artifact.engine }),
  ];

  requireObject(artifact.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4x_prerequisite', artifact.prerequisites.requiredTransitionReviewEligibility === 'eligible_for_local_activation_state_transition_artifact', 'artifact must require eligible Stage 4x receipt', artifact.prerequisites),
    gate('stage4x_digest_required', artifact.prerequisites.requiresTransitionReviewReceiptDigest === true, 'Stage 4x receipt digest is required', artifact.prerequisites),
  );

  requireObject(artifact.ownerApproval, 'ownerApproval');
  gates.push(
    gate('owner_required', artifact.ownerApproval.required === true, 'owner approval must be required', artifact.ownerApproval),
    gate('owner_mode', artifact.ownerApproval.approvalMode === 'explicit_owner_manual_decision', 'owner approval mode must be explicit manual decision', artifact.ownerApproval),
    gate('owner_role', artifact.ownerApproval.approvedByRole === 'owner', 'owner approval role must be owner', artifact.ownerApproval),
    gate('owner_status', artifact.ownerApproval.status === 'approved', 'owner approval status must be approved', artifact.ownerApproval),
    gate('owner_scope', artifact.ownerApproval.scope === 'bounded_local_activation_state_transition_artifact_only', 'owner approval scope must stay bounded to transition artifact only', artifact.ownerApproval),
  );

  requireObject(artifact.transitionIntent, 'transitionIntent');
  requireArray(artifact.transitionIntent.allowedBindings, 'transitionIntent.allowedBindings');
  requireArray(artifact.transitionIntent.allowedActivationSurface, 'transitionIntent.allowedActivationSurface');
  const allowedBindings = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  gates.push(
    gate('transition_source_state', artifact.transitionIntent.sourceState === 'inactive_ready_local_private_runtime', 'transition source state must match', artifact.transitionIntent),
    gate('transition_target_state', artifact.transitionIntent.targetState === 'bounded_owner_invoked_local_active_runtime', 'transition target state must match', artifact.transitionIntent),
    gate('transition_mode', artifact.transitionIntent.transitionMode === 'owner_invoked_same_process_transition_only', 'transition mode must match bounded local transition mode', artifact.transitionIntent),
    gate('transition_location', artifact.transitionIntent.allowedLocation === 'cortex-abv-private-runtime-only', 'transition location must stay private-runtime only', artifact.transitionIntent),
    gate('transition_module_path', artifact.transitionIntent.allowedModulePath === 'src/vector-runtime-controlled-module-harness.mjs', 'transition module path must match fixed harness', artifact.transitionIntent),
    gate('transition_bindings', artifact.transitionIntent.allowedBindings.every((binding) => allowedBindings.has(binding)), 'transition bindings must stay allowlisted', artifact.transitionIntent),
    gate('transition_surface', artifact.transitionIntent.allowedActivationSurface.length === 1 && artifact.transitionIntent.allowedActivationSurface[0] === 'owner_invoked_private_runtime_process_only', 'activation surface must stay owner-invoked local process only', artifact.transitionIntent),
    gate('transition_not_applied_here', artifact.transitionIntent.transitionAppliedHere === false, 'transition must not be applied here', artifact.transitionIntent),
  );

  requireObject(artifact.rollbackPlan, 'rollbackPlan');
  requireArray(artifact.rollbackPlan.steps, 'rollbackPlan.steps');
  gates.push(
    gate('rollback_required', artifact.rollbackPlan.required === true, 'rollback plan must be required', artifact.rollbackPlan),
    gate('rollback_strategy', artifact.rollbackPlan.strategy === 'revert_to_inactive_ready_state_without_external_side_effects', 'rollback strategy must match bounded transition rollback', artifact.rollbackPlan),
    gate('rollback_receipt_only', artifact.rollbackPlan.receiptOnlyEvidence === true, 'rollback evidence must remain receipt-only', artifact.rollbackPlan),
    gate('rollback_owner_reversal', artifact.rollbackPlan.ownerReversalAllowed === true, 'owner reversal must remain allowed', artifact.rollbackPlan),
  );

  requireObject(artifact.nextGate, 'nextGate');
  gates.push(
    gate('next_gate_target', artifact.nextGate.targetEligibility === 'eligible_for_local_activation_state_transition_dry_run', 'next gate target must be local activation state transition dry-run', artifact.nextGate),
    gate('next_gate_kind', artifact.nextGate.futureRunKind === 'CortexABVVectorRuntimeLocalActivationStateTransitionDryRun', 'future run kind must match', artifact.nextGate),
    gate('next_gate_mode', artifact.nextGate.futureRunMode === 'local_activation_state_transition_dry_run_only', 'future run mode must match', artifact.nextGate),
    gate('next_gate_not_applied', artifact.nextGate.transitionAppliedHere === false, 'transition must not be applied at artifact gate', artifact.nextGate),
  );

  requireObject(artifact.forbiddenAuthority, 'forbiddenAuthority');
  for (const [key, expected] of Object.entries({
    activationAppliedHere: false,
    transitionAppliedHere: false,
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
    activationStateTransitionArtifactOnly: true,
    runtimeActivationApplied: false,
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

function validateStage4xReceipt(receipt, artifact) {
  const td = receipt.transitionDefinition || {};
  return [
    gate('kind', receipt.kind === artifact.prerequisites.requiredTransitionReviewReceiptKind, 'Stage 4x receipt kind must match prerequisite', { kind: receipt.kind }),
    gate('status', receipt.status === artifact.prerequisites.requiredTransitionReviewStatus, 'Stage 4x receipt status must be passed', { status: receipt.status }),
    gate('eligibility', receipt.eligibility === artifact.prerequisites.requiredTransitionReviewEligibility, 'Stage 4x receipt eligibility must match prerequisite', { eligibility: receipt.eligibility }),
    gate('no_blockers', Array.isArray(receipt.blockers) && receipt.blockers.length === 0, 'Stage 4x receipt must have no blockers', { blockers: receipt.blockers }),
    gate('stage4w_receipt_digest_present', typeof receipt.stage4wReceiptDigest === 'string' && receipt.stage4wReceiptDigest.length === 64, 'Stage 4w receipt digest must be present', { stage4wReceiptDigest: receipt.stage4wReceiptDigest }),
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
    gate('transition_source_state_match', td.sourceState === artifact.transitionIntent.sourceState, 'transition source state must match Stage 4x boundary', { td, transitionIntent: artifact.transitionIntent }),
    gate('transition_target_state_match', td.targetState === artifact.transitionIntent.targetState, 'transition target state must match Stage 4x boundary', { td, transitionIntent: artifact.transitionIntent }),
    gate('transition_mode_match', td.transitionMode === artifact.transitionIntent.transitionMode, 'transition mode must match Stage 4x boundary', { td, transitionIntent: artifact.transitionIntent }),
    gate('transition_location_match', td.allowedLocation === artifact.transitionIntent.allowedLocation, 'transition location must match Stage 4x boundary', { td, transitionIntent: artifact.transitionIntent }),
    gate('transition_module_path_match', td.allowedModulePath === artifact.transitionIntent.allowedModulePath, 'transition module path must match Stage 4x boundary', { td, transitionIntent: artifact.transitionIntent }),
    gate('transition_bindings_match', JSON.stringify(td.allowedBindings) === JSON.stringify(artifact.transitionIntent.allowedBindings), 'transition bindings must match Stage 4x boundary', { td, transitionIntent: artifact.transitionIntent }),
    gate('no_runtime_activation_applied', receipt.governance?.runtimeActivationApplied === false, 'Stage 4x must not apply runtime activation', receipt.governance),
    gate('no_endpoint', receipt.governance?.endpoint === false, 'Stage 4x must not approve endpoint', receipt.governance),
    gate('no_scheduler', receipt.governance?.scheduler === false, 'Stage 4x must not approve scheduler', receipt.governance),
    gate('no_network', receipt.governance?.networkCalls === false, 'Stage 4x must not approve network calls', receipt.governance),
    gate('no_llm', receipt.governance?.llmCalls === false, 'Stage 4x must not approve LLM calls', receipt.governance),
    gate('no_public_action', receipt.governance?.publicActionAuthority === false, 'Stage 4x must not approve public action authority', receipt.governance),
  ];
}

export function runVectorRuntimeLocalActivationStateTransitionArtifact({ artifactPath, stage4xReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(artifactPath)) throw new Error(`local activation state transition artifact file not found: ${artifactPath}`);
  if (!existsSync(stage4xReceiptPath)) throw new Error(`local activation state transition review receipt file not found: ${stage4xReceiptPath}`);
  const artifact = readJson(artifactPath);
  const stage4xReceipt = readJson(stage4xReceiptPath);
  const gates = {
    artifact: validateArtifact(artifact),
    stage4xReceipt: validateStage4xReceipt(stage4xReceipt, artifact),
  };
  const blockers = Object.entries(gates).flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const artifactDigest = sha256(artifact);
  const stage4xReceiptDigest = sha256(stage4xReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeLocalActivationStateTransitionReceipt',
    version: 'v1',
    authority: 'local_activation_state_transition_artifact_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_local_activation_state_transition_dry_run' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'local_runtime_activation_state_transition_artifact',
    engine: artifact.engine,
    artifactDigest,
    stage4xReceiptDigest,
    prerequisiteDigests: {
      stage4wReceiptDigest: stage4xReceipt.stage4wReceiptDigest,
      stage4vReceiptDigest: stage4xReceipt.prerequisiteDigests?.stage4vReceiptDigest,
      stage4uReceiptDigest: stage4xReceipt.prerequisiteDigests?.stage4uReceiptDigest,
      stage4tReceiptDigest: stage4xReceipt.prerequisiteDigests?.stage4tReceiptDigest,
      stage4sReceiptDigest: stage4xReceipt.prerequisiteDigests?.stage4sReceiptDigest,
      stage4rReceiptDigest: stage4xReceipt.prerequisiteDigests?.stage4rReceiptDigest,
      stage4qReceiptDigest: stage4xReceipt.prerequisiteDigests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4xReceipt.prerequisiteDigests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4xReceipt.prerequisiteDigests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4xReceipt.prerequisiteDigests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4xReceipt.prerequisiteDigests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4xReceipt.prerequisiteDigests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4xReceipt.prerequisiteDigests?.receiptLinkageDigest,
    },
    ownerApproval: artifact.ownerApproval,
    transitionIntent: artifact.transitionIntent,
    rollbackPlan: artifact.rollbackPlan,
    nextGate: artifact.nextGate,
    governance: {
      readOnly: true,
      proposalOnly: true,
      activationStateTransitionArtifactOnly: true,
      runtimeActivationApplied: false,
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
      transitionReviewReceipt: {
        path: stage4xReceiptPath,
        kind: stage4xReceipt.kind,
        status: stage4xReceipt.status,
        eligibility: stage4xReceipt.eligibility,
        digest: stage4xReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'local_activation_state_transition_artifact_plus_stage4x_review_receipt',
      reason: eligible
        ? 'Explicit owner-approved local transition artifact recorded under the Stage 4x boundary, still without applying any transition.'
        : 'Local transition artifact blocked because Stage 4x proof, owner approval, transition intent or governance boundary is incomplete.',
      nextAllowedStep: eligible ? 'local_activation_state_transition_dry_run' : 'revise_local_activation_state_transition_artifact',
      activationApplied: false,
      stateTransitionApplied: false,
    },
    summary: eligible
      ? 'Owner-approved local activation-state transition artifact recorded. It only allows preparation for a later local transition dry-run and does not apply the transition.'
      : 'Local activation-state transition artifact is not eligible.',
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = runVectorRuntimeLocalActivationStateTransitionArtifact({
      artifactPath: option('--artifact') || path.resolve(process.cwd(), 'config/vector-runtime-local-activation-state-transition.v1.json'),
      stage4xReceiptPath: option('--stage4x-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-activation-state-transition-review-receipt.v1.json'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-activation-state-transition-receipt.v1.json'),
    });
    console.log(`Vector runtime local activation state transition artifact complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
  } catch (error) {
    console.error(`Vector runtime local activation state transition artifact failed: ${error.message}`);
    process.exitCode = 1;
  }
}
