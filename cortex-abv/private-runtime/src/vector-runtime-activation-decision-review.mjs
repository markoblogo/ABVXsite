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

function validateReview(review) {
  requireObject(review, 'review');
  const gates = [
    gate('kind', review.kind === 'CortexABVVectorRuntimeActivationDecisionReview', 'review kind must match', { kind: review.kind }),
    gate('version', review.version === 'v1', 'review version must be v1', { version: review.version }),
    gate('authority', review.authority === 'runtime_activation_decision_review_only', 'review authority must be runtime_activation_decision_review_only', { authority: review.authority }),
    gate('engine', review.engine === 'turbovec', 'review engine must be turbovec', { engine: review.engine }),
  ];

  requireObject(review.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4s_prerequisite', review.prerequisites.requiredReadinessReviewReceiptEligibility === 'eligible_for_runtime_activation_decision_review', 'review must require eligible Stage 4s readiness review receipt', review.prerequisites),
    gate('stage4s_digest_required', review.prerequisites.requiresReadinessReviewReceiptDigest === true, 'Stage 4s receipt digest is required', review.prerequisites),
  );

  requireObject(review.localActivationScope, 'localActivationScope');
  requireArray(review.localActivationScope.allowedBindings, 'localActivationScope.allowedBindings');
  requireArray(review.localActivationScope.allowedOperations, 'localActivationScope.allowedOperations');
  requireArray(review.localActivationScope.allowedConsumers, 'localActivationScope.allowedConsumers');
  const allowedBindings = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  const allowedOperations = new Set(['load_read_only_index_artifact', 'query_tenant_scoped_candidates_only', 'verify_claim_evidence_refs']);
  gates.push(
    gate('scope_meaning', review.localActivationScope.meaning === 'owner_invoked_local_private_runtime_callable_availability_only', 'local activation scope meaning must match', review.localActivationScope),
    gate('scope_location', review.localActivationScope.allowedLocation === 'cortex-abv-private-runtime-only', 'local activation must stay private-runtime only', review.localActivationScope),
    gate('scope_mode', review.localActivationScope.activationMode === 'same_process_owner_invoked_callable_only', 'activation mode must be same-process owner-invoked callable only', review.localActivationScope),
    gate('scope_module_path', review.localActivationScope.allowedModulePath === 'src/vector-runtime-controlled-module-harness.mjs', 'module path must match controlled harness', review.localActivationScope),
    gate('scope_bindings', review.localActivationScope.allowedBindings.every((binding) => allowedBindings.has(binding)), 'allowed bindings must be allowlisted', review.localActivationScope),
    gate('scope_artifact_path', review.localActivationScope.allowedArtifactPath === 'data/vector-indexes/turbovec-poc/index-artifact.v1.json', 'artifact path must match Stage 4h local artifact', review.localActivationScope),
    gate('scope_operations', review.localActivationScope.allowedOperations.every((operation) => allowedOperations.has(operation)), 'allowed operations must stay bounded', review.localActivationScope),
    gate('scope_owner_consumer_only', review.localActivationScope.allowedConsumers.length === 1 && review.localActivationScope.allowedConsumers[0] === 'owner_invoked_private_runtime_process_only', 'allowed consumers must remain owner-invoked local process only', review.localActivationScope),
    gate('scope_no_persistent_service', review.localActivationScope.persistentServiceAllowed === false, 'persistent service must remain forbidden', review.localActivationScope),
    gate('scope_no_scheduler', review.localActivationScope.backgroundSchedulerAllowed === false, 'background scheduler must remain forbidden', review.localActivationScope),
    gate('scope_no_network', review.localActivationScope.networkCallsAllowed === false, 'network calls must remain forbidden', review.localActivationScope),
    gate('scope_no_llm', review.localActivationScope.llmCallsAllowed === false, 'LLM calls must remain forbidden', review.localActivationScope),
    gate('scope_no_endpoint', review.localActivationScope.endpointAllowed === false, 'endpoint must remain forbidden', review.localActivationScope),
    gate('scope_no_public_action', review.localActivationScope.publicActionAuthorityAllowed === false, 'public action authority must remain forbidden', review.localActivationScope),
    gate('scope_no_source_mutation', review.localActivationScope.sourceMutationAllowed === false, 'source mutation must remain forbidden', review.localActivationScope),
    gate('scope_no_artifact_mutation', review.localActivationScope.artifactMutationAllowed === false, 'artifact mutation must remain forbidden', review.localActivationScope),
    gate('scope_no_external_writes', review.localActivationScope.writesOutsideReceiptAllowed === false, 'external writes must remain forbidden', review.localActivationScope),
    gate('scope_no_answer_generation', review.localActivationScope.answerGenerationAllowed === false, 'answer generation must remain forbidden', review.localActivationScope),
    gate('scope_no_cross_tenant', review.localActivationScope.crossTenantQueriesAllowed === false, 'cross-tenant queries must remain forbidden', review.localActivationScope),
  );

  requireObject(review.requiredReadinessSignals, 'requiredReadinessSignals');
  for (const key of ['module', 'artifact', 'queries', 'execution']) requireArray(review.requiredReadinessSignals[key], `requiredReadinessSignals.${key}`);

  requireObject(review.decisionBoundary, 'decisionBoundary');
  for (const [key, expected] of Object.entries({
    targetEligibility: 'eligible_for_local_runtime_activation_decision',
    futureDecisionKind: 'CortexABVVectorRuntimeActivationDecision',
    futureDecisionMode: 'local_runtime_activation_decision_only',
    runtimeActivationApprovedHere: false,
    ownerApprovalRequired: true,
    rollbackPlanRequired: true,
    endpointAllowed: false,
    schedulerAllowed: false,
    networkCallsAllowed: false,
    llmCallsAllowed: false,
    publicActionAuthorityAllowed: false,
    writesOutsideReceiptAllowed: false,
  })) {
    gates.push(gate(`decision_boundary_${key}`, review.decisionBoundary[key] === expected, `decisionBoundary.${key} must be ${expected}`, review.decisionBoundary));
  }

  requireObject(review.forbiddenAfterDecision, 'forbiddenAfterDecision');
  for (const [key, expected] of Object.entries({
    endpointAllowed: false,
    schedulerAllowed: false,
    networkCallsAllowed: false,
    llmCallsAllowed: false,
    publicActionAuthorityAllowed: false,
    answerGenerationAllowed: false,
    sourceMutationAllowed: false,
    artifactMutationAllowed: false,
    writesOutsideReceiptAllowed: false,
    crossTenantQueriesAllowed: false,
    daemonProcessAllowed: false,
    autonomousExecutionAllowed: false,
  })) {
    gates.push(gate(`forbidden_after_${key}`, review.forbiddenAfterDecision[key] === expected, `forbiddenAfterDecision.${key} must be ${expected}`, review.forbiddenAfterDecision));
  }

  requireArray(review.rejectionCases, 'rejectionCases');
  requireObject(review.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    activationDecisionReviewOnly: true,
    runtimeActivationApproved: false,
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

function validateStage4sReceipt(stage4sReceipt, review) {
  return [
    gate('kind', stage4sReceipt.kind === review.prerequisites.requiredReadinessReviewReceiptKind, 'Stage 4s receipt kind must match prerequisite', { kind: stage4sReceipt.kind }),
    gate('status', stage4sReceipt.status === review.prerequisites.requiredReadinessReviewReceiptStatus, 'Stage 4s receipt status must be passed', { status: stage4sReceipt.status }),
    gate('eligibility', stage4sReceipt.eligibility === review.prerequisites.requiredReadinessReviewReceiptEligibility, 'Stage 4s receipt eligibility must match prerequisite', { eligibility: stage4sReceipt.eligibility }),
    gate('no_blockers', Array.isArray(stage4sReceipt.blockers) && stage4sReceipt.blockers.length === 0, 'Stage 4s receipt must have no blockers', { blockers: stage4sReceipt.blockers }),
    gate('stage4r_receipt_digest_present', typeof stage4sReceipt.stage4rReceiptDigest === 'string' && stage4sReceipt.stage4rReceiptDigest.length === 64, 'Stage 4r receipt digest must be present', { stage4rReceiptDigest: stage4sReceipt.stage4rReceiptDigest }),
    gate('stage4q_receipt_digest_present', typeof stage4sReceipt.prerequisiteDigests?.stage4qReceiptDigest === 'string' && stage4sReceipt.prerequisiteDigests.stage4qReceiptDigest.length === 64, 'Stage 4q receipt digest must be present', stage4sReceipt.prerequisiteDigests),
    gate('stage4p_receipt_digest_present', typeof stage4sReceipt.prerequisiteDigests?.stage4pReceiptDigest === 'string' && stage4sReceipt.prerequisiteDigests.stage4pReceiptDigest.length === 64, 'Stage 4p receipt digest must be present', stage4sReceipt.prerequisiteDigests),
    gate('stage4o_receipt_digest_present', typeof stage4sReceipt.prerequisiteDigests?.stage4oReceiptDigest === 'string' && stage4sReceipt.prerequisiteDigests.stage4oReceiptDigest.length === 64, 'Stage 4o receipt digest must be present', stage4sReceipt.prerequisiteDigests),
    gate('stage4n_receipt_digest_present', typeof stage4sReceipt.prerequisiteDigests?.stage4nReceiptDigest === 'string' && stage4sReceipt.prerequisiteDigests.stage4nReceiptDigest.length === 64, 'Stage 4n receipt digest must be present', stage4sReceipt.prerequisiteDigests),
    gate('stage4h_index_digest_present', typeof stage4sReceipt.prerequisiteDigests?.stage4hIndexDigest === 'string' && stage4sReceipt.prerequisiteDigests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', stage4sReceipt.prerequisiteDigests),
    gate('stage4h_source_digest_present', typeof stage4sReceipt.prerequisiteDigests?.stage4hSourceDigest === 'string' && stage4sReceipt.prerequisiteDigests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', stage4sReceipt.prerequisiteDigests),
    gate('receipt_linkage_digest_present', typeof stage4sReceipt.prerequisiteDigests?.receiptLinkageDigest === 'string' && stage4sReceipt.prerequisiteDigests.receiptLinkageDigest.length === 64, 'receipt linkage digest must be present', stage4sReceipt.prerequisiteDigests),
    gate('module_importable', stage4sReceipt.readinessSignals?.module?.importable === true, 'module must remain importable', stage4sReceipt.readinessSignals?.module),
    gate('bindings_present', stage4sReceipt.readinessSignals?.module?.bindingsPresent === true, 'bindings must remain present', stage4sReceipt.readinessSignals?.module),
    gate('activation_not_exposed', stage4sReceipt.readinessSignals?.module?.activationNotExposed === true, 'activation must remain unexposed', stage4sReceipt.readinessSignals?.module),
    gate('artifact_read_only', stage4sReceipt.readinessSignals?.artifact?.readOnly === true, 'artifact must remain read-only', stage4sReceipt.readinessSignals?.artifact),
    gate('artifact_stage4h_index_digest_match', stage4sReceipt.readinessSignals?.artifact?.stage4hIndexDigestMatch === true, 'artifact index digest must match Stage 4h', stage4sReceipt.readinessSignals?.artifact),
    gate('artifact_stage4h_source_digest_match', stage4sReceipt.readinessSignals?.artifact?.stage4hSourceDigestMatch === true, 'artifact source digest must match Stage 4h', stage4sReceipt.readinessSignals?.artifact),
    gate('queries_all_passed', stage4sReceipt.readinessSignals?.queries?.allPassed === true, 'queries must all pass', stage4sReceipt.readinessSignals?.queries),
    gate('queries_tenant_scope_enforced', stage4sReceipt.readinessSignals?.queries?.tenantScopeEnforced === true, 'tenant scope must remain enforced', stage4sReceipt.readinessSignals?.queries),
    gate('queries_candidates_only', stage4sReceipt.readinessSignals?.queries?.candidatesOnly === true, 'queries must remain candidates-only', stage4sReceipt.readinessSignals?.queries),
    gate('queries_answer_generation_disabled', stage4sReceipt.readinessSignals?.queries?.answerGenerationDisabled === true, 'answer generation must remain disabled', stage4sReceipt.readinessSignals?.queries),
    gate('queries_evidence_refs_verified', stage4sReceipt.readinessSignals?.queries?.evidenceRefsVerified === true, 'evidence refs must remain verified', stage4sReceipt.readinessSignals?.queries),
    gate('execution_commands_allowlisted', stage4sReceipt.readinessSignals?.execution?.commandsAllowlisted === true, 'commands must remain allowlisted', stage4sReceipt.readinessSignals?.execution),
    gate('execution_receipt_only_writes', stage4sReceipt.readinessSignals?.execution?.receiptOnlyWrites === true, 'writes must remain receipt-only', stage4sReceipt.readinessSignals?.execution),
    gate('no_runtime_activation', stage4sReceipt.governance?.runtimeActivationApproved === false, 'runtime activation must remain unapproved here', stage4sReceipt.governance),
    gate('no_runtime_integration', stage4sReceipt.governance?.runtimeIntegration === false, 'runtime integration must remain forbidden', stage4sReceipt.governance),
    gate('no_endpoint', stage4sReceipt.governance?.endpoint === false, 'endpoint must remain forbidden', stage4sReceipt.governance),
    gate('no_scheduler', stage4sReceipt.governance?.scheduler === false, 'scheduler must remain forbidden', stage4sReceipt.governance),
    gate('no_network', stage4sReceipt.governance?.networkCalls === false, 'network calls must remain forbidden', stage4sReceipt.governance),
    gate('no_llm', stage4sReceipt.governance?.llmCalls === false, 'LLM calls must remain forbidden', stage4sReceipt.governance),
    gate('no_public_action', stage4sReceipt.governance?.publicActionAuthority === false, 'public action authority must remain forbidden', stage4sReceipt.governance),
  ];
}

export function runVectorRuntimeActivationDecisionReviewGate({ reviewPath, stage4sReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(reviewPath)) throw new Error(`runtime activation decision review file not found: ${reviewPath}`);
  if (!existsSync(stage4sReceiptPath)) throw new Error(`runtime readiness review receipt file not found: ${stage4sReceiptPath}`);
  const review = readJson(reviewPath);
  const stage4sReceipt = readJson(stage4sReceiptPath);
  const gates = {
    review: validateReview(review),
    stage4sReceipt: validateStage4sReceipt(stage4sReceipt, review),
  };
  const blockers = Object.entries(gates).flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const reviewDigest = sha256(review);
  const stage4sReceiptDigest = sha256(stage4sReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeActivationDecisionReviewReceipt',
    version: 'v1',
    authority: 'runtime_activation_decision_review_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_local_runtime_activation_decision' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'runtime_activation_decision_review',
    engine: review.engine,
    reviewDigest,
    stage4sReceiptDigest,
    prerequisiteDigests: {
      stage4rReceiptDigest: stage4sReceipt.stage4rReceiptDigest,
      stage4qReceiptDigest: stage4sReceipt.prerequisiteDigests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4sReceipt.prerequisiteDigests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4sReceipt.prerequisiteDigests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4sReceipt.prerequisiteDigests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4sReceipt.prerequisiteDigests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4sReceipt.prerequisiteDigests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4sReceipt.prerequisiteDigests?.receiptLinkageDigest,
    },
    localActivationScope: review.localActivationScope,
    decisionBoundary: {
      ...review.decisionBoundary,
      runtimeActivationApprovedHere: false,
    },
    forbiddenAfterDecision: review.forbiddenAfterDecision,
    governance: {
      readOnly: true,
      proposalOnly: true,
      activationDecisionReviewOnly: true,
      runtimeActivationApproved: false,
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
      readinessReviewReceipt: {
        path: stage4sReceiptPath,
        kind: stage4sReceipt.kind,
        status: stage4sReceipt.status,
        eligibility: stage4sReceipt.eligibility,
        digest: stage4sReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'runtime_activation_decision_review_contract_plus_stage4s_readiness_review_receipt',
      reason: eligible
        ? 'Stage 4s proved local readiness, so a separate activation decision may be discussed only for bounded owner-invoked callable availability inside private runtime.'
        : 'Activation decision review blocked because readiness proof or governance boundaries are incomplete.',
      nextAllowedStep: eligible ? 'local_runtime_activation_decision_record' : 'revise_runtime_activation_decision_review',
      activationApproved: false,
      endpointApproved: false,
      networkApproved: false,
      publicActionApproved: false,
    },
    summary: eligible
      ? 'A later separate local runtime activation decision may be prepared, but only for bounded owner-invoked callable availability inside CortexABV private runtime. This receipt does not activate runtime wiring.'
      : 'Local runtime is not yet eligible for a separate activation decision.',
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = runVectorRuntimeActivationDecisionReviewGate({
      reviewPath: option('--review') || path.resolve(process.cwd(), 'config/vector-runtime-activation-decision-review.v1.json'),
      stage4sReceiptPath: option('--stage4s-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-readiness-review-receipt.v1.json'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-activation-decision-review-receipt.v1.json'),
    });
    console.log(`Vector runtime activation decision review gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
  } catch (error) {
    console.error(`Vector runtime activation decision review gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
