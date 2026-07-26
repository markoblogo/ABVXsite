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
    gate('kind', review.kind === 'CortexABVVectorRuntimeLocalEffectApplicationReview', 'review kind must match', { kind: review.kind }),
    gate('version', review.version === 'v1', 'review version must be v1', { version: review.version }),
    gate('authority', review.authority === 'local_effect_application_review_only', 'review authority must be local_effect_application_review_only', { authority: review.authority }),
    gate('engine', review.engine === 'turbovec', 'review engine must be turbovec', { engine: review.engine }),
  ];

  requireObject(review.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4ab_prerequisite', review.prerequisites.requiredLocalEffectArtifactKind === 'CortexABVVectorRuntimeLocalTransitionStateEffectReceipt', 'review must require the local effect artifact receipt kind', review.prerequisites),
    gate('stage4ab_eligibility', review.prerequisites.requiredLocalEffectArtifactEligibility === 'eligible_for_local_effect_application_review', 'review must require Stage 4ab-eligible local effect artifact', review.prerequisites),
    gate('stage4ab_status', review.prerequisites.requiredLocalEffectArtifactStatus === 'passed', 'review must require passed local effect artifact', review.prerequisites),
    gate('stage4ab_digest_required', review.prerequisites.requiresLocalEffectArtifactDigest === true, 'local effect artifact receipt digest is required', review.prerequisites),
  );

  requireObject(review.applicationDefinition, 'applicationDefinition');
  requireArray(review.applicationDefinition.allowedLocalApplications, 'applicationDefinition.allowedLocalApplications');
  requireArray(review.applicationDefinition.requiredBindings, 'applicationDefinition.requiredBindings');
  gates.push(
    gate('application_scope', review.applicationDefinition.applicationScope === 'strictly_local_receipt_only', 'application scope must remain strictly local and receipt-only', review.applicationDefinition),
    gate('application_state', review.applicationDefinition.sourceState === 'bounded_owner_initiated_local_active_runtime_candidate', 'application source state must remain bounded local candidate state', review.applicationDefinition),
    gate('required_module', review.applicationDefinition.requiredModulePath === 'src/vector-runtime-controlled-module-harness.mjs', 'required module path must be fixed', review.applicationDefinition),
    gate('required_bindings', review.applicationDefinition.requiredBindings.every((item) => ['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence'].includes(item)), 'required bindings must remain allowlisted', review.applicationDefinition),
    gate('no_application_local', review.applicationDefinition.appliesEffectHere === false, 'application must not be applied in this review', review.applicationDefinition),
    gate('no_transition_local', review.applicationDefinition.stateTransitionAppliedHere === false, 'state transition must not be applied in this review', review.applicationDefinition),
    gate('no_activation_local', review.applicationDefinition.runtimeActivationAppliedHere === false, 'runtime activation must not be applied in this review', review.applicationDefinition),
  );

  requireObject(review.applicationRules, 'applicationRules');
  gates.push(
    gate('proposal_only', review.applicationRules.proposalOnly === true, 'proposalOnly must remain true', review.applicationRules),
    gate('read_only_evidence', review.applicationRules.readOnlyEvidence === true, 'read-only evidence must remain true', review.applicationRules),
    gate('decision_trace_required', review.applicationRules.decisionTraceRequired === true, 'decisionTrace must remain required', review.applicationRules),
    gate('tenant_scoped_candidate_only', review.applicationRules.tenantScopedCandidateOnly === true, 'tenant-scoped candidate-only must remain true', review.applicationRules),
    gate('no_answer_generation', review.applicationRules.noAnswerGeneration === true, 'answer generation must remain disallowed in review', review.applicationRules),
    gate('no_candidate_mutation', review.applicationRules.noCandidateMutation === true, 'candidate mutation must remain disallowed', review.applicationRules),
  );

  requireObject(review.rollbackEffectPolicy, 'rollbackEffectPolicy');
  gates.push(
    gate('rollback_required', review.rollbackEffectPolicy.required === true, 'rollback policy must be required', review.rollbackEffectPolicy),
    gate('rollback_strategy', review.rollbackEffectPolicy.strategy === 'discard_effect_application_review_and_keep_all_effects_unapplied', 'rollback strategy must match', review.rollbackEffectPolicy),
    gate('rollback_owner_reversal', review.rollbackEffectPolicy.ownerReversalAllowed === true, 'owner reversal must remain allowed', review.rollbackEffectPolicy),
    gate('rollback_receipt_only', review.rollbackEffectPolicy.receiptOnlyEvidence === true, 'rollback evidence must remain receipt-only', review.rollbackEffectPolicy),
    gate('rollback_external_mutation', review.rollbackEffectPolicy.externalMutationAllowed === false, 'external mutation must remain disallowed in rollback', review.rollbackEffectPolicy),
  );

  requireObject(review.nextGate, 'nextGate');
  gates.push(
    gate('next_gate_target', review.nextGate.targetEligibility === 'eligible_for_local_effect_application', 'next gate target must be local effect application eligibility', review.nextGate),
    gate('next_gate_kind', review.nextGate.futureReviewKind === 'CortexABVVectorRuntimeLocalEffectApplicationReviewDecision', 'future review kind must be local effect application decision', review.nextGate),
    gate('next_gate_mode', review.nextGate.futureReviewMode === 'local_effect_application_decision_only', 'future review mode must be local effect application decision only', review.nextGate),
    gate('next_gate_not_applied', review.nextGate.effectAppliedHere === false, 'next gate must keep effect unapplied', review.nextGate),
  );

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
    transitionStateEffectApplicationReviewOnly: true,
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

function validateLocalEffectReceipt(receipt, review) {
  return [
    gate('kind', receipt.kind === review.prerequisites.requiredLocalEffectArtifactKind, 'local effect receipt kind must match prerequisite', { kind: receipt.kind }),
    gate('status', receipt.status === review.prerequisites.requiredLocalEffectArtifactStatus, 'local effect receipt status must be passed', { status: receipt.status }),
    gate('eligibility', receipt.eligibility === review.prerequisites.requiredLocalEffectArtifactEligibility, 'local effect receipt eligibility must match prerequisite', { eligibility: receipt.eligibility }),
    gate('no_blockers', Array.isArray(receipt.blockers) && receipt.blockers.length === 0, 'local effect receipt must have no blockers', { blockers: receipt.blockers }),
    gate('stage4aa_receipt_digest_present', typeof receipt.stage4aaReceiptDigest === 'string' && receipt.stage4aaReceiptDigest.length === 64, 'Stage 4aa digest must be present', { stage4aaReceiptDigest: receipt.stage4aaReceiptDigest }),
    gate('stage4z_receipt_digest_present', typeof receipt.prerequisiteDigests?.stage4zReceiptDigest === 'string' && receipt.prerequisiteDigests.stage4zReceiptDigest.length === 64, 'Stage 4z receipt digest must be present', receipt.prerequisiteDigests),
    gate('stage4h_index_digest_present', typeof receipt.prerequisiteDigests?.stage4hIndexDigest === 'string' && receipt.prerequisiteDigests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', receipt.prerequisiteDigests),
    gate('stage4h_source_digest_present', typeof receipt.prerequisiteDigests?.stage4hSourceDigest === 'string' && receipt.prerequisiteDigests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', receipt.prerequisiteDigests),
    gate('receipt_linkage_digest_present', typeof receipt.prerequisiteDigests?.receiptLinkageDigest === 'string' && receipt.prerequisiteDigests.receiptLinkageDigest.length === 64, 'receipt linkage digest must be present', receipt.prerequisiteDigests),
    gate('owner_required', receipt.ownerApproval?.required === true, 'owner approval must be required', receipt.ownerApproval),
    gate('owner_status', receipt.ownerApproval?.status === 'approved', 'owner approval must be approved', receipt.ownerApproval),
    gate('owner_scope', receipt.ownerApproval?.scope === 'bounded_local_transition_state_effect_artifact_only', 'owner approval scope must remain bounded', receipt.ownerApproval),
    gate('read_only_mode', receipt.effectIntent?.effectAppliedHere === false, 'local effect must be not applied here', receipt.effectIntent),
    gate('local_transition_scope', receipt.effectIntent?.effectScope === 'discussion_only_local_transition_state_effects', 'local transition-state effect scope must remain discussion-only', receipt.effectIntent),
    gate('no_activation', receipt.effectIntent?.runtimeActivationAppliedHere === false, 'runtime activation must not be applied in receipt', receipt.effectIntent),
    gate('no_transition', receipt.effectIntent?.stateTransitionAppliedHere === false, 'state transition must not be applied in receipt', receipt.effectIntent),
    gate('bindings_match', JSON.stringify(receipt.effectIntent?.requiredBindings || []) === JSON.stringify(review.applicationDefinition.requiredBindings), 'required bindings in receipt must match review contract', { effectIntent: receipt.effectIntent, requiredBindings: review.applicationDefinition.requiredBindings }),
    gate('module_match', receipt.effectIntent?.requiredModulePath === review.applicationDefinition.requiredModulePath, 'required module path in receipt must match review contract', { effectIntent: receipt.effectIntent, requiredModulePath: review.applicationDefinition.requiredModulePath }),
  ];
}

export function runVectorRuntimeLocalEffectApplicationReview({ reviewPath, stage4abReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(reviewPath)) throw new Error(`local effect application review file not found: ${reviewPath}`);
  if (!existsSync(stage4abReceiptPath)) throw new Error(`local transition-state effect receipt file not found: ${stage4abReceiptPath}`);

  const review = readJson(reviewPath);
  const stage4abReceipt = readJson(stage4abReceiptPath);
  const gates = {
    review: validateReview(review),
    stage4abReceipt: validateLocalEffectReceipt(stage4abReceipt, review),
  };

  const blockers = Object.entries(gates).flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;

  const reviewDigest = sha256(review);
  const stage4abReceiptDigest = sha256(stage4abReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeLocalEffectApplicationReviewReceipt',
    version: 'v1',
    authority: 'local_effect_application_review_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_local_effect_application' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'local_effect_application_review',
    engine: review.engine,
    reviewDigest,
    stage4abReceiptDigest,
    prerequisiteDigests: {
      stage4aaReceiptDigest: stage4abReceipt.stage4aaReceiptDigest,
      stage4zReceiptDigest: stage4abReceipt.prerequisiteDigests?.stage4zReceiptDigest,
      stage4yReceiptDigest: stage4abReceipt.prerequisiteDigests?.stage4yReceiptDigest,
      stage4xReceiptDigest: stage4abReceipt.prerequisiteDigests?.stage4xReceiptDigest,
      stage4wReceiptDigest: stage4abReceipt.prerequisiteDigests?.stage4wReceiptDigest,
      stage4vReceiptDigest: stage4abReceipt.prerequisiteDigests?.stage4vReceiptDigest,
      stage4uReceiptDigest: stage4abReceipt.prerequisiteDigests?.stage4uReceiptDigest,
      stage4tReceiptDigest: stage4abReceipt.prerequisiteDigests?.stage4tReceiptDigest,
      stage4sReceiptDigest: stage4abReceipt.prerequisiteDigests?.stage4sReceiptDigest,
      stage4rReceiptDigest: stage4abReceipt.prerequisiteDigests?.stage4rReceiptDigest,
      stage4qReceiptDigest: stage4abReceipt.prerequisiteDigests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4abReceipt.prerequisiteDigests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4abReceipt.prerequisiteDigests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4abReceipt.prerequisiteDigests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4abReceipt.prerequisiteDigests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4abReceipt.prerequisiteDigests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4abReceipt.prerequisiteDigests?.receiptLinkageDigest,
    },
    applicationDefinition: {
      applicationScope: review.applicationDefinition.applicationScope,
      sourceState: review.applicationDefinition.sourceState,
      allowedLocalApplications: review.applicationDefinition.allowedLocalApplications,
      requiredModulePath: review.applicationDefinition.requiredModulePath,
      requiredBindings: review.applicationDefinition.requiredBindings,
      appliesEffectHere: review.applicationDefinition.appliesEffectHere,
      stateTransitionAppliedHere: review.applicationDefinition.stateTransitionAppliedHere,
      runtimeActivationAppliedHere: review.applicationDefinition.runtimeActivationAppliedHere,
    },
    applicationRules: {
      proposalOnly: review.applicationRules.proposalOnly,
      readOnlyEvidence: review.applicationRules.readOnlyEvidence,
      decisionTraceRequired: review.applicationRules.decisionTraceRequired,
      tenantScopedCandidateOnly: review.applicationRules.tenantScopedCandidateOnly,
      noAnswerGeneration: review.applicationRules.noAnswerGeneration,
    },
    rollbackEffectPolicy: review.rollbackEffectPolicy,
    nextGate: review.nextGate,
    governance: {
      readOnly: true,
      proposalOnly: true,
      transitionStateEffectApplicationReviewOnly: true,
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
      localTransitionStateEffectReceipt: {
        path: stage4abReceiptPath,
        kind: stage4abReceipt.kind,
        status: stage4abReceipt.status,
        eligibility: stage4abReceipt.eligibility,
        digest: stage4abReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'local_effect_application_review_contract_plus_local_effect_artifact_receipt',
      reason: eligible
        ? 'Local transition-state effects can only be discussed as strictly local, receipt-only operations in this stage. No activation, transition or mutation is applied.'
        : 'Local effect application review blocked because Stage 4ab artifact or review boundary is incomplete.',
      nextAllowedStep: eligible ? 'local_effect_application_discussion_only' : 'revise_local_effect_application_review',
      runtimeActivationAllowed: false,
      stateTransitionAllowed: false,
      effectApplicationAllowed: false,
    },
    summary: eligible
      ? 'Strictly local effect application scope is now defined for discussion-only purposes and still does not apply anything outside receipt evidence.'
      : 'Local effect application is not yet eligible for discussion under current controls.',
  };

  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = runVectorRuntimeLocalEffectApplicationReview({
      reviewPath: option('--review') || path.resolve(process.cwd(), 'config/vector-runtime-local-effect-application-review.v1.json'),
      stage4abReceiptPath: option('--stage4ab-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-transition-state-effect-receipt.v1.json'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-effect-application-review-receipt.v1.json'),
    });
    console.log(`Vector runtime local effect application review gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
  } catch (error) {
    console.error(`Vector runtime local effect application review gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
