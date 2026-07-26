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

function validateReview(review) {
  requireObject(review, 'review');
  const gates = [
    gate('kind', review.kind === 'CortexABVVectorRuntimeLocalActivationStateTransitionReview', 'review kind must match', { kind: review.kind }),
    gate('version', review.version === 'v1', 'review version must be v1', { version: review.version }),
    gate('authority', review.authority === 'local_activation_state_transition_review_only', 'review authority must be local_activation_state_transition_review_only', { authority: review.authority }),
    gate('engine', review.engine === 'turbovec', 'review engine must be turbovec', { engine: review.engine }),
  ];

  requireObject(review.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4w_prerequisite', review.prerequisites.requiredLocalActivationStateReviewEligibility === 'eligible_for_local_activation_state_transition_review', 'review must require eligible Stage 4w receipt', review.prerequisites),
    gate('stage4w_digest_required', review.prerequisites.requiresLocalActivationStateReviewReceiptDigest === true, 'Stage 4w receipt digest is required', review.prerequisites),
  );

  requireObject(review.transitionDefinition, 'transitionDefinition');
  requireArray(review.transitionDefinition.allowedBindings, 'transitionDefinition.allowedBindings');
  const allowedBindings = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  gates.push(
    gate('transition_source_state', review.transitionDefinition.sourceState === 'inactive_ready_local_private_runtime', 'source state must match inactive-ready local state', review.transitionDefinition),
    gate('transition_target_state', review.transitionDefinition.targetState === 'bounded_owner_invoked_local_active_runtime', 'target state must match bounded local active state', review.transitionDefinition),
    gate('transition_artifact_kind', review.transitionDefinition.transitionArtifactKind === 'CortexABVVectorRuntimeLocalActivationStateTransition', 'transition artifact kind must match', review.transitionDefinition),
    gate('transition_mode', review.transitionDefinition.transitionMode === 'owner_invoked_same_process_transition_only', 'transition mode must be owner-invoked same-process only', review.transitionDefinition),
    gate('transition_location', review.transitionDefinition.allowedLocation === 'cortex-abv-private-runtime-only', 'transition location must stay private-runtime only', review.transitionDefinition),
    gate('transition_module_path', review.transitionDefinition.allowedModulePath === 'src/vector-runtime-controlled-module-harness.mjs', 'transition module path must match fixed harness', review.transitionDefinition),
    gate('transition_bindings', review.transitionDefinition.allowedBindings.every((binding) => allowedBindings.has(binding)), 'transition bindings must stay allowlisted', review.transitionDefinition),
    gate('transition_not_applied_here', review.transitionDefinition.stateTransitionAppliedHere === false, 'state transition must not be applied here', review.transitionDefinition),
    gate('transition_no_persistent', review.transitionDefinition.persistentProcessAllowed === false, 'persistent process must remain forbidden', review.transitionDefinition),
    gate('transition_no_daemon', review.transitionDefinition.daemonProcessAllowed === false, 'daemon process must remain forbidden', review.transitionDefinition),
    gate('transition_no_scheduler', review.transitionDefinition.schedulerAllowed === false, 'scheduler must remain forbidden', review.transitionDefinition),
    gate('transition_no_endpoint', review.transitionDefinition.endpointAllowed === false, 'endpoint must remain forbidden', review.transitionDefinition),
    gate('transition_no_network', review.transitionDefinition.networkCallsAllowed === false, 'network calls must remain forbidden', review.transitionDefinition),
    gate('transition_no_llm', review.transitionDefinition.llmCallsAllowed === false, 'LLM calls must remain forbidden', review.transitionDefinition),
    gate('transition_no_public_action', review.transitionDefinition.publicActionAuthorityAllowed === false, 'public action authority must remain forbidden', review.transitionDefinition),
  );

  requireObject(review.requiredStateSignals, 'requiredStateSignals');
  for (const key of ['stateDefinition', 'module', 'artifact', 'queries', 'rollback']) requireArray(review.requiredStateSignals[key], `requiredStateSignals.${key}`);

  requireObject(review.rollbackTransitionPolicy, 'rollbackTransitionPolicy');
  for (const [key, expected] of Object.entries({
    required: true,
    strategy: 'revert_to_inactive_ready_state_without_external_side_effects',
    ownerReversalAllowed: true,
    receiptOnlyEvidence: true,
    externalMutationAllowed: false,
  })) {
    gates.push(gate(`rollback_transition_${key}`, review.rollbackTransitionPolicy[key] === expected, `rollbackTransitionPolicy.${key} must be ${expected}`, review.rollbackTransitionPolicy));
  }

  requireObject(review.nextGate, 'nextGate');
  for (const [key, expected] of Object.entries({
    targetEligibility: 'eligible_for_local_activation_state_transition_artifact',
    futureArtifactKind: 'CortexABVVectorRuntimeLocalActivationStateTransition',
    futureArtifactMode: 'local_activation_state_transition_artifact_only',
    stateTransitionAppliedHere: false,
  })) {
    gates.push(gate(`next_gate_${key}`, review.nextGate[key] === expected, `nextGate.${key} must be ${expected}`, review.nextGate));
  }

  requireObject(review.forbiddenAuthority, 'forbiddenAuthority');
  for (const [key, expected] of Object.entries({
    activationAppliedHere: false,
    stateTransitionAppliedHere: false,
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
    gates.push(gate(`forbidden_${key}`, review.forbiddenAuthority[key] === expected, `forbiddenAuthority.${key} must be ${expected}`, review.forbiddenAuthority));
  }

  requireObject(review.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    activationStateTransitionReviewOnly: true,
    runtimeActivationApplied: false,
    runtimeIntegration: false,
    endpoint: false,
    scheduler: false,
    networkCalls: false,
    llmCalls: false,
    writesOutsideReceipt: false,
    publicActionAuthority: false,
  })) {
    gates.push(gate(`governance_${key}`, review.governance[key] === expected, `governance.${key} must be ${expected}`, review.governance));
  }
  return gates;
}

function validateStage4wReceipt(receipt, review) {
  return [
    gate('kind', receipt.kind === review.prerequisites.requiredLocalActivationStateReviewReceiptKind, 'Stage 4w receipt kind must match prerequisite', { kind: receipt.kind }),
    gate('status', receipt.status === review.prerequisites.requiredLocalActivationStateReviewStatus, 'Stage 4w receipt status must be passed', { status: receipt.status }),
    gate('eligibility', receipt.eligibility === review.prerequisites.requiredLocalActivationStateReviewEligibility, 'Stage 4w receipt eligibility must match prerequisite', { eligibility: receipt.eligibility }),
    gate('no_blockers', Array.isArray(receipt.blockers) && receipt.blockers.length === 0, 'Stage 4w receipt must have no blockers', { blockers: receipt.blockers }),
    gate('stage4v_receipt_digest_present', typeof receipt.stage4vReceiptDigest === 'string' && receipt.stage4vReceiptDigest.length === 64, 'Stage 4v receipt digest must be present', { stage4vReceiptDigest: receipt.stage4vReceiptDigest }),
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
    gate('state_exists', receipt.stateDefinition?.stateExists === true, 'state must remain defined', receipt.stateDefinition),
    gate('state_inactive_ready', receipt.stateDefinition?.stateRepresentation === 'receipt-defined inactive-ready state only', 'state representation must remain inactive-ready', receipt.stateDefinition),
    gate('state_receipt_storage_only', receipt.stateDefinition?.stateStorage === 'receipt_and_digest_chain_only', 'state storage must remain receipt/digest-only', receipt.stateDefinition),
    gate('module_state_transition_unapplied', receipt.governance?.runtimeActivationApplied === false, 'runtime activation must remain unapplied', receipt.governance),
    gate('rollback_policy_present', receipt.rollbackStatePolicy?.required === true, 'rollback state policy must remain present', receipt.rollbackStatePolicy),
    gate('rollback_owner_reversal_allowed', receipt.rollbackStatePolicy?.ownerReversalAllowed === true, 'owner reversal must remain allowed', receipt.rollbackStatePolicy),
    gate('no_endpoint', receipt.governance?.endpoint === false, 'endpoint must remain forbidden', receipt.governance),
    gate('no_scheduler', receipt.governance?.scheduler === false, 'scheduler must remain forbidden', receipt.governance),
    gate('no_network', receipt.governance?.networkCalls === false, 'network calls must remain forbidden', receipt.governance),
    gate('no_llm', receipt.governance?.llmCalls === false, 'LLM calls must remain forbidden', receipt.governance),
    gate('no_public_action', receipt.governance?.publicActionAuthority === false, 'public action authority must remain forbidden', receipt.governance),
  ];
}

export function runVectorRuntimeLocalActivationStateTransitionReviewGate({ reviewPath, stage4wReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(reviewPath)) throw new Error(`local activation state transition review file not found: ${reviewPath}`);
  if (!existsSync(stage4wReceiptPath)) throw new Error(`local activation state review receipt file not found: ${stage4wReceiptPath}`);
  const review = readJson(reviewPath);
  const stage4wReceipt = readJson(stage4wReceiptPath);
  const gates = {
    review: validateReview(review),
    stage4wReceipt: validateStage4wReceipt(stage4wReceipt, review),
  };
  const blockers = Object.entries(gates).flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const reviewDigest = sha256(review);
  const stage4wReceiptDigest = sha256(stage4wReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeLocalActivationStateTransitionReviewReceipt',
    version: 'v1',
    authority: 'local_activation_state_transition_review_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_local_activation_state_transition_artifact' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'local_runtime_activation_state_transition_review',
    engine: review.engine,
    reviewDigest,
    stage4wReceiptDigest,
    prerequisiteDigests: {
      stage4vReceiptDigest: stage4wReceipt.stage4vReceiptDigest,
      stage4uReceiptDigest: stage4wReceipt.prerequisiteDigests?.stage4uReceiptDigest,
      stage4tReceiptDigest: stage4wReceipt.prerequisiteDigests?.stage4tReceiptDigest,
      stage4sReceiptDigest: stage4wReceipt.prerequisiteDigests?.stage4sReceiptDigest,
      stage4rReceiptDigest: stage4wReceipt.prerequisiteDigests?.stage4rReceiptDigest,
      stage4qReceiptDigest: stage4wReceipt.prerequisiteDigests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4wReceipt.prerequisiteDigests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4wReceipt.prerequisiteDigests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4wReceipt.prerequisiteDigests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4wReceipt.prerequisiteDigests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4wReceipt.prerequisiteDigests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4wReceipt.prerequisiteDigests?.receiptLinkageDigest,
    },
    transitionDefinition: review.transitionDefinition,
    rollbackTransitionPolicy: review.rollbackTransitionPolicy,
    nextGate: review.nextGate,
    governance: {
      readOnly: true,
      proposalOnly: true,
      activationStateTransitionReviewOnly: true,
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
      review: { path: reviewPath, kind: review.kind, digest: reviewDigest },
      localActivationStateReviewReceipt: {
        path: stage4wReceiptPath,
        kind: stage4wReceipt.kind,
        status: stage4wReceipt.status,
        eligibility: stage4wReceipt.eligibility,
        digest: stage4wReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'local_activation_state_transition_review_contract_plus_stage4w_state_review_receipt',
      reason: eligible
        ? 'Stage 4w proved an inactive-ready local state exists, so the minimal bounded transition artifact can now be reviewed without applying any transition.'
        : 'Local activation state transition review blocked because state proof or transition boundary is incomplete.',
      nextAllowedStep: eligible ? 'local_activation_state_transition_artifact' : 'revise_local_activation_state_transition_review',
      activationApplied: false,
      stateTransitionApplied: false,
    },
    summary: eligible
      ? 'A minimal local activation-state transition artifact is now reviewable. This receipt does not apply activation or perform any state transition.'
      : 'Local activation-state transition artifact is not yet eligible for review.',
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = runVectorRuntimeLocalActivationStateTransitionReviewGate({
      reviewPath: option('--review') || path.resolve(process.cwd(), 'config/vector-runtime-local-activation-state-transition-review.v1.json'),
      stage4wReceiptPath: option('--stage4w-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-activation-state-review-receipt.v1.json'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-activation-state-transition-review-receipt.v1.json'),
    });
    console.log(`Vector runtime local activation state transition review gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
  } catch (error) {
    console.error(`Vector runtime local activation state transition review gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
