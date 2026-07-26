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
    gate('kind', review.kind === 'CortexABVVectorRuntimeLocalTransitionStateEffectReview', 'review kind must match', { kind: review.kind }),
    gate('version', review.version === 'v1', 'review version must be v1', { version: review.version }),
    gate('authority', review.authority === 'local_transition_state_effect_review_only', 'review authority must be local_transition_state_effect_review_only', { authority: review.authority }),
    gate('engine', review.engine === 'turbovec', 'review engine must be turbovec', { engine: review.engine }),
  ];

  requireObject(review.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4z_prerequisite', review.prerequisites.requiredLocalTransitionDryRunEligibility === 'eligible_for_local_transition_state_effect_review', 'review must require eligible Stage 4z receipt', review.prerequisites),
    gate('stage4z_digest_required', review.prerequisites.requiresLocalTransitionDryRunReceiptDigest === true, 'Stage 4z receipt digest is required', review.prerequisites),
  );

  requireObject(review.effectDefinition, 'effectDefinition');
  requireArray(review.effectDefinition.allowedEffects, 'effectDefinition.allowedEffects');
  requireArray(review.effectDefinition.requiredBindings, 'effectDefinition.requiredBindings');
  const allowedEffects = new Set([
    'callable_binding_ready',
    'read_only_artifact_access_confirmed',
    'tenant_scoped_candidate_queries_confirmed',
    'verified_evidence_chain_confirmed',
    'rollback_chain_preserved',
  ]);
  const allowedBindings = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  gates.push(
    gate('effect_scope', review.effectDefinition.effectScope === 'discussion_only_local_transition_state_effects', 'effect scope must remain discussion-only', review.effectDefinition),
    gate('effect_source_state', review.effectDefinition.sourceState === 'bounded_owner_invoked_local_active_runtime_candidate', 'source state must match the bounded local active candidate state', review.effectDefinition),
    gate('effect_artifact_kind', review.effectDefinition.effectArtifactKind === 'CortexABVVectorRuntimeLocalTransitionStateEffect', 'effect artifact kind must match', review.effectDefinition),
    gate('effect_allowed_effects', review.effectDefinition.allowedEffects.every((effect) => allowedEffects.has(effect)), 'allowed effects must remain allowlisted', review.effectDefinition),
    gate('effect_module_path', review.effectDefinition.requiredModulePath === 'src/vector-runtime-controlled-module-harness.mjs', 'required module path must match fixed harness', review.effectDefinition),
    gate('effect_bindings', review.effectDefinition.requiredBindings.every((binding) => allowedBindings.has(binding)), 'required bindings must stay allowlisted', review.effectDefinition),
    gate('effect_not_applied_here', review.effectDefinition.effectAppliedHere === false, 'effect must not be applied here', review.effectDefinition),
    gate('state_transition_not_applied_here', review.effectDefinition.stateTransitionAppliedHere === false, 'state transition must not be applied here', review.effectDefinition),
    gate('runtime_activation_not_applied_here', review.effectDefinition.runtimeActivationAppliedHere === false, 'runtime activation must not be applied here', review.effectDefinition),
    gate('effect_no_persistent', review.effectDefinition.persistentProcessAllowed === false, 'persistent process must remain forbidden', review.effectDefinition),
    gate('effect_no_daemon', review.effectDefinition.daemonProcessAllowed === false, 'daemon process must remain forbidden', review.effectDefinition),
    gate('effect_no_scheduler', review.effectDefinition.schedulerAllowed === false, 'scheduler must remain forbidden', review.effectDefinition),
    gate('effect_no_endpoint', review.effectDefinition.endpointAllowed === false, 'endpoint must remain forbidden', review.effectDefinition),
    gate('effect_no_network', review.effectDefinition.networkCallsAllowed === false, 'network calls must remain forbidden', review.effectDefinition),
    gate('effect_no_llm', review.effectDefinition.llmCallsAllowed === false, 'LLM calls must remain forbidden', review.effectDefinition),
    gate('effect_no_public_action', review.effectDefinition.publicActionAuthorityAllowed === false, 'public action authority must remain forbidden', review.effectDefinition),
  );

  requireObject(review.requiredDryRunSignals, 'requiredDryRunSignals');
  for (const key of ['ownerApproval', 'module', 'artifact', 'queries', 'execution', 'rollback']) requireArray(review.requiredDryRunSignals[key], `requiredDryRunSignals.${key}`);

  requireObject(review.rollbackEffectPolicy, 'rollbackEffectPolicy');
  for (const [key, expected] of Object.entries({
    required: true,
    strategy: 'discard_effect_discussion_and_keep_transition_unapplied',
    ownerReversalAllowed: true,
    receiptOnlyEvidence: true,
    externalMutationAllowed: false,
  })) {
    gates.push(gate(`rollback_effect_${key}`, review.rollbackEffectPolicy[key] === expected, `rollbackEffectPolicy.${key} must be ${expected}`, review.rollbackEffectPolicy));
  }

  requireObject(review.nextGate, 'nextGate');
  for (const [key, expected] of Object.entries({
    targetEligibility: 'eligible_for_local_transition_state_effect_artifact',
    futureArtifactKind: 'CortexABVVectorRuntimeLocalTransitionStateEffect',
    futureArtifactMode: 'local_transition_state_effect_artifact_only',
    effectAppliedHere: false,
  })) {
    gates.push(gate(`next_gate_${key}`, review.nextGate[key] === expected, `nextGate.${key} must be ${expected}`, review.nextGate));
  }

  requireObject(review.forbiddenAuthority, 'forbiddenAuthority');
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
    gates.push(gate(`forbidden_${key}`, review.forbiddenAuthority[key] === expected, `forbiddenAuthority.${key} must be ${expected}`, review.forbiddenAuthority));
  }

  requireObject(review.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    transitionStateEffectReviewOnly: true,
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
    gates.push(gate(`governance_${key}`, review.governance[key] === expected, `governance.${key} must be ${expected}`, review.governance));
  }

  return gates;
}

function validateStage4zReceipt(receipt, review) {
  const queries = Array.isArray(receipt.queryResults) ? receipt.queryResults : [];
  return [
    gate('kind', receipt.kind === review.prerequisites.requiredLocalTransitionDryRunReceiptKind, 'Stage 4z receipt kind must match prerequisite', { kind: receipt.kind }),
    gate('status', receipt.status === review.prerequisites.requiredLocalTransitionDryRunStatus, 'Stage 4z receipt status must be passed', { status: receipt.status }),
    gate('eligibility', receipt.eligibility === review.prerequisites.requiredLocalTransitionDryRunEligibility, 'Stage 4z receipt eligibility must match prerequisite', { eligibility: receipt.eligibility }),
    gate('no_blockers', Array.isArray(receipt.blockers) && receipt.blockers.length === 0, 'Stage 4z receipt must have no blockers', { blockers: receipt.blockers }),
    gate('stage4y_receipt_digest_present', typeof receipt.digests?.stage4yReceiptDigest === 'string' && receipt.digests.stage4yReceiptDigest.length === 64, 'Stage 4y receipt digest must be present', receipt.digests),
    gate('stage4x_receipt_digest_present', typeof receipt.digests?.stage4xReceiptDigest === 'string' && receipt.digests.stage4xReceiptDigest.length === 64, 'Stage 4x receipt digest must be present', receipt.digests),
    gate('stage4w_receipt_digest_present', typeof receipt.digests?.stage4wReceiptDigest === 'string' && receipt.digests.stage4wReceiptDigest.length === 64, 'Stage 4w receipt digest must be present', receipt.digests),
    gate('stage4v_receipt_digest_present', typeof receipt.digests?.stage4vReceiptDigest === 'string' && receipt.digests.stage4vReceiptDigest.length === 64, 'Stage 4v receipt digest must be present', receipt.digests),
    gate('stage4u_receipt_digest_present', typeof receipt.digests?.stage4uReceiptDigest === 'string' && receipt.digests.stage4uReceiptDigest.length === 64, 'Stage 4u receipt digest must be present', receipt.digests),
    gate('stage4t_receipt_digest_present', typeof receipt.digests?.stage4tReceiptDigest === 'string' && receipt.digests.stage4tReceiptDigest.length === 64, 'Stage 4t receipt digest must be present', receipt.digests),
    gate('stage4s_receipt_digest_present', typeof receipt.digests?.stage4sReceiptDigest === 'string' && receipt.digests.stage4sReceiptDigest.length === 64, 'Stage 4s receipt digest must be present', receipt.digests),
    gate('stage4r_receipt_digest_present', typeof receipt.digests?.stage4rReceiptDigest === 'string' && receipt.digests.stage4rReceiptDigest.length === 64, 'Stage 4r receipt digest must be present', receipt.digests),
    gate('stage4q_receipt_digest_present', typeof receipt.digests?.stage4qReceiptDigest === 'string' && receipt.digests.stage4qReceiptDigest.length === 64, 'Stage 4q receipt digest must be present', receipt.digests),
    gate('stage4p_receipt_digest_present', typeof receipt.digests?.stage4pReceiptDigest === 'string' && receipt.digests.stage4pReceiptDigest.length === 64, 'Stage 4p receipt digest must be present', receipt.digests),
    gate('stage4o_receipt_digest_present', typeof receipt.digests?.stage4oReceiptDigest === 'string' && receipt.digests.stage4oReceiptDigest.length === 64, 'Stage 4o receipt digest must be present', receipt.digests),
    gate('stage4n_receipt_digest_present', typeof receipt.digests?.stage4nReceiptDigest === 'string' && receipt.digests.stage4nReceiptDigest.length === 64, 'Stage 4n receipt digest must be present', receipt.digests),
    gate('stage4h_index_digest_present', typeof receipt.digests?.stage4hIndexDigest === 'string' && receipt.digests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', receipt.digests),
    gate('stage4h_source_digest_present', typeof receipt.digests?.stage4hSourceDigest === 'string' && receipt.digests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', receipt.digests),
    gate('receipt_linkage_digest_present', typeof receipt.digests?.receiptLinkageDigest === 'string' && receipt.digests.receiptLinkageDigest.length === 64, 'receipt linkage digest must be present', receipt.digests),
    gate('owner_approval_approved', receipt.ownerApproval?.status === 'approved', 'owner approval must remain approved', receipt.ownerApproval),
    gate('owner_approval_bounded', receipt.ownerApproval?.scope === 'bounded_local_activation_state_transition_artifact_only', 'owner approval scope must remain bounded', receipt.ownerApproval),
    gate('transition_applied_false', receipt.module?.transitionApplied === false, 'transition must remain unapplied', receipt.module),
    gate('module_importable', receipt.module?.importable === true, 'module must remain importable', receipt.module),
    gate('bindings_present', receipt.module?.bindingsPresent === true, 'bindings must remain present', receipt.module),
    gate('artifact_read_only', receipt.artifact?.readOnly === true, 'artifact must remain read-only', receipt.artifact),
    gate('artifact_stage4h_index_digest_match', receipt.artifact?.indexDigest === receipt.digests?.stage4hIndexDigest, 'artifact index digest must match Stage 4h digest', { artifact: receipt.artifact, digests: receipt.digests }),
    gate('artifact_stage4h_source_digest_match', receipt.artifact?.sourceDigest === receipt.digests?.stage4hSourceDigest, 'artifact source digest must match Stage 4h digest', { artifact: receipt.artifact, digests: receipt.digests }),
    gate('queries_all_passed', queries.length > 0 && queries.every((result) => result.status === 'passed'), 'queries must all pass', { queries }),
    gate('queries_tenant_scope_enforced', queries.length > 0 && queries.every((result) => result.decisionTrace?.tenantScope === result.tenant), 'tenant scope must remain enforced', { queries }),
    gate('queries_candidates_only', queries.length > 0 && queries.every((result) => result.decisionTrace?.candidatesOnly === true), 'queries must remain candidates-only', { queries }),
    gate('queries_answer_generation_disabled', queries.length > 0 && queries.every((result) => result.decisionTrace?.answerGeneration === false), 'answer generation must remain disabled', { queries }),
    gate('queries_evidence_refs_verified', queries.length > 0 && queries.every((result) => result.evidenceVerification?.passed === true), 'evidence refs must remain verified', { queries }),
    gate('execution_commands_executed', Array.isArray(receipt.commandsExecuted) && receipt.commandsExecuted.length === 4, 'dry-run commands must be executed', { commandsExecuted: receipt.commandsExecuted }),
    gate('execution_receipt_only_writes', receipt.governance?.writesOutsideReceipt === false, 'writes must remain receipt-only', receipt.governance),
    gate('rollback_notes_present', Array.isArray(receipt.rollbackNotes) && receipt.rollbackNotes.length > 0, 'rollback notes must remain present', { rollbackNotes: receipt.rollbackNotes }),
    gate('no_runtime_activation_applied', receipt.governance?.runtimeActivationApplied === false, 'runtime activation must remain unapplied', receipt.governance),
    gate('no_state_transition_applied', receipt.governance?.stateTransitionApplied === false, 'state transition must remain unapplied', receipt.governance),
    gate('no_endpoint', receipt.governance?.endpoint === false, 'endpoint must remain forbidden', receipt.governance),
    gate('no_scheduler', receipt.governance?.scheduler === false, 'scheduler must remain forbidden', receipt.governance),
    gate('no_network', receipt.governance?.networkCalls === false, 'network calls must remain forbidden', receipt.governance),
    gate('no_llm', receipt.governance?.llmCalls === false, 'LLM calls must remain forbidden', receipt.governance),
    gate('no_public_action', receipt.governance?.publicActionAuthority === false, 'public action authority must remain forbidden', receipt.governance),
  ];
}

export function runVectorRuntimeLocalTransitionStateEffectReviewGate({ reviewPath, stage4zReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(reviewPath)) throw new Error(`local transition state effect review file not found: ${reviewPath}`);
  if (!existsSync(stage4zReceiptPath)) throw new Error(`local activation state transition dry-run receipt file not found: ${stage4zReceiptPath}`);
  const review = readJson(reviewPath);
  const stage4zReceipt = readJson(stage4zReceiptPath);
  const gates = {
    review: validateReview(review),
    stage4zReceipt: validateStage4zReceipt(stage4zReceipt, review),
  };
  const blockers = Object.entries(gates).flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const reviewDigest = sha256(review);
  const stage4zReceiptDigest = sha256(stage4zReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeLocalTransitionStateEffectReviewReceipt',
    version: 'v1',
    authority: 'local_transition_state_effect_review_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_local_transition_state_effect_artifact' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'local_transition_state_effect_review',
    engine: review.engine,
    reviewDigest,
    stage4zReceiptDigest,
    prerequisiteDigests: {
      stage4yReceiptDigest: stage4zReceipt.digests?.stage4yReceiptDigest,
      stage4xReceiptDigest: stage4zReceipt.digests?.stage4xReceiptDigest,
      stage4wReceiptDigest: stage4zReceipt.digests?.stage4wReceiptDigest,
      stage4vReceiptDigest: stage4zReceipt.digests?.stage4vReceiptDigest,
      stage4uReceiptDigest: stage4zReceipt.digests?.stage4uReceiptDigest,
      stage4tReceiptDigest: stage4zReceipt.digests?.stage4tReceiptDigest,
      stage4sReceiptDigest: stage4zReceipt.digests?.stage4sReceiptDigest,
      stage4rReceiptDigest: stage4zReceipt.digests?.stage4rReceiptDigest,
      stage4qReceiptDigest: stage4zReceipt.digests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4zReceipt.digests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4zReceipt.digests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4zReceipt.digests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4zReceipt.digests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4zReceipt.digests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4zReceipt.digests?.receiptLinkageDigest,
    },
    effectDefinition: review.effectDefinition,
    rollbackEffectPolicy: review.rollbackEffectPolicy,
    nextGate: review.nextGate,
    governance: {
      readOnly: true,
      proposalOnly: true,
      transitionStateEffectReviewOnly: true,
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
      review: { path: reviewPath, kind: review.kind, digest: reviewDigest },
      localTransitionDryRunReceipt: {
        path: stage4zReceiptPath,
        kind: stage4zReceipt.kind,
        status: stage4zReceipt.status,
        eligibility: stage4zReceipt.eligibility,
        digest: stage4zReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'local_transition_state_effect_review_contract_plus_stage4z_dry_run_receipt',
      reason: eligible
        ? 'Stage 4z proved the bounded transition dry-run is stable, so only narrow local state effects can now be discussed as a later artifact without applying them.'
        : 'Local transition state effect review blocked because Stage 4z proof or effect boundary is incomplete.',
      nextAllowedStep: eligible ? 'local_transition_state_effect_artifact' : 'revise_local_transition_state_effect_review',
      activationApplied: false,
      stateTransitionApplied: false,
      effectApplied: false,
    },
    summary: eligible
      ? 'Only narrow local transition-state effects are now reviewable. This receipt does not apply any effect, activation or state transition.'
      : 'Local transition-state effects are not yet eligible for artifact discussion.',
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = runVectorRuntimeLocalTransitionStateEffectReviewGate({
      reviewPath: option('--review') || path.resolve(process.cwd(), 'config/vector-runtime-local-transition-state-effect-review.v1.json'),
      stage4zReceiptPath: option('--stage4z-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-activation-state-transition-dry-run-receipt.v1.json'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-transition-state-effect-review-receipt.v1.json'),
    });
    console.log(`Vector runtime local transition state effect review gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
  } catch (error) {
    console.error(`Vector runtime local transition state effect review gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
