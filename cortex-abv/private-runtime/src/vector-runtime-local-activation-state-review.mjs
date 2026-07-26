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
    gate('kind', review.kind === 'CortexABVVectorRuntimeLocalActivationStateReview', 'review kind must match', { kind: review.kind }),
    gate('version', review.version === 'v1', 'review version must be v1', { version: review.version }),
    gate('authority', review.authority === 'local_activation_state_review_only', 'review authority must be local_activation_state_review_only', { authority: review.authority }),
    gate('engine', review.engine === 'turbovec', 'review engine must be turbovec', { engine: review.engine }),
  ];

  requireObject(review.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4v_prerequisite', review.prerequisites.requiredLocalActivationDryRunEligibility === 'eligible_for_local_runtime_activation_state_review', 'review must require eligible Stage 4v dry-run receipt', review.prerequisites),
    gate('stage4v_digest_required', review.prerequisites.requiresLocalActivationDryRunReceiptDigest === true, 'Stage 4v receipt digest is required', review.prerequisites),
  );

  requireObject(review.stateDefinition, 'stateDefinition');
  for (const [key, expected] of Object.entries({
    stateExists: true,
    stateMeaning: 'owner-approved local callable availability remains inactive until a later explicit state transition artifact',
    stateRepresentation: 'receipt-defined inactive-ready state only',
    stateStorage: 'receipt_and_digest_chain_only',
    stateLocation: 'cortex-abv-private-runtime-only',
    stateTransitionAllowedHere: false,
    persistentProcessRequired: false,
    backgroundSchedulerRequired: false,
    endpointRequired: false,
    networkRequired: false,
    llmRequired: false,
  })) {
    gates.push(gate(`state_definition_${key}`, review.stateDefinition[key] === expected, `stateDefinition.${key} must be ${expected}`, review.stateDefinition));
  }

  requireObject(review.requiredDryRunSignals, 'requiredDryRunSignals');
  for (const key of ['ownerApproval', 'module', 'artifact', 'queries', 'execution', 'rollback']) requireArray(review.requiredDryRunSignals[key], `requiredDryRunSignals.${key}`);

  requireObject(review.rollbackStatePolicy, 'rollbackStatePolicy');
  for (const [key, expected] of Object.entries({
    required: true,
    strategy: 'discard_future_transition_and_return_to_inactive_ready_state',
    ownerReversalAllowed: true,
    receiptOnlyEvidence: true,
    externalMutationAllowed: false,
  })) {
    gates.push(gate(`rollback_policy_${key}`, review.rollbackStatePolicy[key] === expected, `rollbackStatePolicy.${key} must be ${expected}`, review.rollbackStatePolicy));
  }

  requireObject(review.nextGate, 'nextGate');
  for (const [key, expected] of Object.entries({
    targetEligibility: 'eligible_for_local_activation_state_transition_review',
    futureReviewKind: 'CortexABVVectorRuntimeLocalActivationStateTransitionReview',
    futureReviewMode: 'local_activation_state_transition_review_only',
    stateTransitionAllowedHere: false,
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
    activationStateReviewOnly: true,
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

function validateStage4vReceipt(receipt, review) {
  const queries = Array.isArray(receipt.queryResults) ? receipt.queryResults : [];
  return [
    gate('kind', receipt.kind === review.prerequisites.requiredLocalActivationDryRunReceiptKind, 'Stage 4v receipt kind must match prerequisite', { kind: receipt.kind }),
    gate('status', receipt.status === review.prerequisites.requiredLocalActivationDryRunStatus, 'Stage 4v receipt status must be passed', { status: receipt.status }),
    gate('eligibility', receipt.eligibility === review.prerequisites.requiredLocalActivationDryRunEligibility, 'Stage 4v receipt eligibility must match prerequisite', { eligibility: receipt.eligibility }),
    gate('no_blockers', Array.isArray(receipt.blockers) && receipt.blockers.length === 0, 'Stage 4v receipt must have no blockers', { blockers: receipt.blockers }),
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
    gate('module_importable', receipt.module?.importable === true, 'module must remain importable', receipt.module),
    gate('bindings_present', receipt.module?.bindingsPresent === true, 'bindings must remain present', receipt.module),
    gate('activation_applied_false', receipt.module?.activationApplied === false, 'activation must remain unapplied', receipt.module),
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
    gate('no_endpoint', receipt.governance?.endpoint === false, 'endpoint must remain forbidden', receipt.governance),
    gate('no_scheduler', receipt.governance?.scheduler === false, 'scheduler must remain forbidden', receipt.governance),
    gate('no_network', receipt.governance?.networkCalls === false, 'network calls must remain forbidden', receipt.governance),
    gate('no_llm', receipt.governance?.llmCalls === false, 'LLM calls must remain forbidden', receipt.governance),
    gate('no_public_action', receipt.governance?.publicActionAuthority === false, 'public action authority must remain forbidden', receipt.governance),
  ];
}

export function runVectorRuntimeLocalActivationStateReviewGate({ reviewPath, stage4vReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(reviewPath)) throw new Error(`local activation state review file not found: ${reviewPath}`);
  if (!existsSync(stage4vReceiptPath)) throw new Error(`local activation dry-run receipt file not found: ${stage4vReceiptPath}`);
  const review = readJson(reviewPath);
  const stage4vReceipt = readJson(stage4vReceiptPath);
  const gates = {
    review: validateReview(review),
    stage4vReceipt: validateStage4vReceipt(stage4vReceipt, review),
  };
  const blockers = Object.entries(gates).flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const reviewDigest = sha256(review);
  const stage4vReceiptDigest = sha256(stage4vReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeLocalActivationStateReviewReceipt',
    version: 'v1',
    authority: 'local_activation_state_review_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_local_activation_state_transition_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'local_runtime_activation_state_review',
    engine: review.engine,
    reviewDigest,
    stage4vReceiptDigest,
    prerequisiteDigests: {
      stage4uReceiptDigest: stage4vReceipt.digests?.stage4uReceiptDigest,
      stage4tReceiptDigest: stage4vReceipt.digests?.stage4tReceiptDigest,
      stage4sReceiptDigest: stage4vReceipt.digests?.stage4sReceiptDigest,
      stage4rReceiptDigest: stage4vReceipt.digests?.stage4rReceiptDigest,
      stage4qReceiptDigest: stage4vReceipt.digests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4vReceipt.digests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4vReceipt.digests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4vReceipt.digests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4vReceipt.digests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4vReceipt.digests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4vReceipt.digests?.receiptLinkageDigest,
    },
    stateDefinition: review.stateDefinition,
    rollbackStatePolicy: review.rollbackStatePolicy,
    nextGate: review.nextGate,
    governance: {
      readOnly: true,
      proposalOnly: true,
      activationStateReviewOnly: true,
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
      localActivationDryRunReceipt: {
        path: stage4vReceiptPath,
        kind: stage4vReceipt.kind,
        status: stage4vReceipt.status,
        eligibility: stage4vReceipt.eligibility,
        digest: stage4vReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'local_activation_state_review_contract_plus_stage4v_dry_run_receipt',
      reason: eligible
        ? 'Stage 4v proved an inactive-ready local state can be described purely by receipt-defined boundaries and digest lineage, without applying activation.'
        : 'Local activation state review blocked because Stage 4v proof or state boundary is incomplete.',
      nextAllowedStep: eligible ? 'local_activation_state_transition_review_gate' : 'revise_local_activation_state_review',
      activationApplied: false,
      stateTransitionApplied: false,
    },
    summary: eligible
      ? 'A distinct local inactive-ready activation state is formally reviewable. This receipt does not apply activation or perform any state transition.'
      : 'Local activation state is not yet eligible for transition review.',
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = runVectorRuntimeLocalActivationStateReviewGate({
      reviewPath: option('--review') || path.resolve(process.cwd(), 'config/vector-runtime-local-activation-state-review.v1.json'),
      stage4vReceiptPath: option('--stage4v-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-activation-dry-run-receipt.v1.json'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-activation-state-review-receipt.v1.json'),
    });
    console.log(`Vector runtime local activation state review gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
  } catch (error) {
    console.error(`Vector runtime local activation state review gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
