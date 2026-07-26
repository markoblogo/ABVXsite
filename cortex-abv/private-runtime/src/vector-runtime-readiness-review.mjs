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
    gate('kind', review.kind === 'CortexABVVectorRuntimeReadinessReview', 'review kind must match', { kind: review.kind }),
    gate('version', review.version === 'v1', 'review version must be v1', { version: review.version }),
    gate('authority', review.authority === 'runtime_readiness_review_only', 'review authority must be runtime_readiness_review_only', { authority: review.authority }),
    gate('engine', review.engine === 'turbovec', 'review engine must be turbovec', { engine: review.engine }),
  ];

  requireObject(review.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4r_prerequisite', review.prerequisites.requiredActivationDryRunReceiptEligibility === 'eligible_for_runtime_readiness_review', 'review must require eligible Stage 4r activation dry-run receipt', review.prerequisites),
    gate('stage4r_digest_required', review.prerequisites.requiresActivationDryRunReceiptDigest === true, 'Stage 4r receipt digest is required', review.prerequisites),
  );

  requireObject(review.requiredSignals, 'requiredSignals');
  for (const key of ['module', 'artifact', 'digestChain', 'queries', 'execution']) {
    requireArray(review.requiredSignals[key], `requiredSignals.${key}`);
  }
  const requiredSignals = {
    module: ['module_importable', 'bindings_present', 'activation_not_exposed'],
    artifact: ['artifact_read_only', 'artifact_stage4h_index_digest_match', 'artifact_stage4h_source_digest_match'],
    digestChain: ['stage4q_receipt_digest_present', 'stage4p_receipt_digest_present', 'stage4o_receipt_digest_present', 'stage4n_receipt_digest_present', 'stage4h_index_digest_present', 'stage4h_source_digest_present', 'receipt_linkage_digest_present'],
    queries: ['query_results_passed', 'tenant_scope_enforced', 'candidates_only', 'answer_generation_disabled', 'evidence_refs_verified'],
    execution: ['commands_allowlisted', 'commands_use_activation_dry_run_suffix', 'receipt_only_writes'],
  };
  for (const [group, expected] of Object.entries(requiredSignals)) {
    gates.push(gate(`signals_${group}`, expected.every((item) => review.requiredSignals[group].includes(item)), `requiredSignals.${group} must be complete`, { expected, observed: review.requiredSignals[group] }));
  }

  requireObject(review.activationDecisionBoundary, 'activationDecisionBoundary');
  for (const [key, expected] of Object.entries({
    targetEligibility: 'eligible_for_runtime_activation_decision_review',
    futureReviewKind: 'CortexABVVectorRuntimeActivationDecisionReview',
    futureReviewMode: 'activation_decision_review_only',
    runtimeActivationApprovedHere: false,
    endpointAllowed: false,
    schedulerAllowed: false,
    networkCallsAllowed: false,
    llmCallsAllowed: false,
    publicActionAuthorityAllowed: false,
    writesOutsideReceiptAllowed: false,
  })) {
    gates.push(gate(`activation_boundary_${key}`, review.activationDecisionBoundary[key] === expected, `activationDecisionBoundary.${key} must be ${expected}`, review.activationDecisionBoundary));
  }

  requireObject(review.forbiddenAuthority, 'forbiddenAuthority');
  for (const [key, expected] of Object.entries({
    runtimeActivationAllowed: false,
    runtimeIntegrationAllowed: false,
    endpointAllowed: false,
    schedulerAllowed: false,
    networkCallsAllowed: false,
    llmCallsAllowed: false,
    publicActionAuthorityAllowed: false,
    answerGenerationAllowed: false,
    sourceMutationAllowed: false,
    artifactMutationAllowed: false,
    writesOutsideReceiptAllowed: false,
  })) {
    gates.push(gate(`forbidden_${key}`, review.forbiddenAuthority[key] === expected, `forbiddenAuthority.${key} must be ${expected}`, review.forbiddenAuthority));
  }

  requireArray(review.rejectionCases, 'rejectionCases');
  const requiredRejections = [
    'activation_dry_run_not_eligible',
    'missing_stage4q_receipt_digest',
    'missing_stage4p_receipt_digest',
    'missing_stage4o_receipt_digest',
    'missing_stage4n_receipt_digest',
    'missing_stage4h_index_digest',
    'missing_stage4h_source_digest',
    'missing_receipt_linkage_digest',
    'module_not_importable',
    'bindings_missing',
    'activation_exposed',
    'artifact_not_read_only',
    'artifact_digest_mismatch',
    'query_failed',
    'tenant_scope_not_enforced',
    'non_candidate_result_returned',
    'answer_generation_enabled',
    'evidence_refs_missing',
    'non_allowlisted_command',
    'command_suffix_invalid',
    'write_beyond_receipt_requested',
    'runtime_activation_requested',
    'runtime_integration_requested',
    'endpoint_requested',
    'scheduler_requested',
    'network_calls_requested',
    'llm_calls_requested',
    'public_action_authority_requested',
    'source_mutation_requested',
    'artifact_mutation_requested',
    'external_writes_requested',
  ];
  gates.push(gate('rejection_cases_complete', requiredRejections.every((item) => review.rejectionCases.includes(item)), 'required rejection cases must be listed', { requiredRejections, rejectionCases: review.rejectionCases }));

  requireObject(review.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    readinessReviewOnly: true,
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

function validateStage4rReceipt(stage4rReceipt, review) {
  const commands = [
    'verify_stage4p_digest_activation_dry_run',
    'load_local_runtime_binding_activation_dry_run',
    'query_local_runtime_binding_activation_dry_run',
    'verify_activation_not_exposed_activation_dry_run',
  ];
  const queryResults = Array.isArray(stage4rReceipt.queryResults) ? stage4rReceipt.queryResults : [];
  return [
    gate('kind', stage4rReceipt.kind === review.prerequisites.requiredActivationDryRunReceiptKind, 'Stage 4r receipt kind must match prerequisite', { kind: stage4rReceipt.kind }),
    gate('status', stage4rReceipt.status === review.prerequisites.requiredActivationDryRunReceiptStatus, 'Stage 4r receipt status must be passed', { status: stage4rReceipt.status }),
    gate('eligibility', stage4rReceipt.eligibility === review.prerequisites.requiredActivationDryRunReceiptEligibility, 'Stage 4r receipt eligibility must match prerequisite', { eligibility: stage4rReceipt.eligibility }),
    gate('no_blockers', Array.isArray(stage4rReceipt.blockers) && stage4rReceipt.blockers.length === 0, 'Stage 4r receipt must have no blockers', { blockers: stage4rReceipt.blockers }),
    gate('stage4q_receipt_digest_present', typeof stage4rReceipt.digests?.stage4qReceiptDigest === 'string' && stage4rReceipt.digests.stage4qReceiptDigest.length === 64, 'Stage 4q receipt digest must be present', stage4rReceipt.digests),
    gate('stage4p_receipt_digest_present', typeof stage4rReceipt.digests?.stage4pReceiptDigest === 'string' && stage4rReceipt.digests.stage4pReceiptDigest.length === 64, 'Stage 4p receipt digest must be present', stage4rReceipt.digests),
    gate('stage4o_receipt_digest_present', typeof stage4rReceipt.digests?.stage4oReceiptDigest === 'string' && stage4rReceipt.digests.stage4oReceiptDigest.length === 64, 'Stage 4o receipt digest must be present', stage4rReceipt.digests),
    gate('stage4n_receipt_digest_present', typeof stage4rReceipt.digests?.stage4nReceiptDigest === 'string' && stage4rReceipt.digests.stage4nReceiptDigest.length === 64, 'Stage 4n receipt digest must be present', stage4rReceipt.digests),
    gate('stage4h_index_digest_present', typeof stage4rReceipt.digests?.stage4hIndexDigest === 'string' && stage4rReceipt.digests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', stage4rReceipt.digests),
    gate('stage4h_source_digest_present', typeof stage4rReceipt.digests?.stage4hSourceDigest === 'string' && stage4rReceipt.digests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', stage4rReceipt.digests),
    gate('receipt_linkage_digest_present', typeof stage4rReceipt.digests?.receiptLinkageDigest === 'string' && stage4rReceipt.digests.receiptLinkageDigest.length === 64, 'receipt linkage digest must be present', stage4rReceipt.digests),
    gate('module_importable', stage4rReceipt.module?.importable === true, 'module must be importable', stage4rReceipt.module),
    gate('bindings_present', stage4rReceipt.module?.bindingsPresent === true, 'module bindings must be present', stage4rReceipt.module),
    gate('activation_not_exposed', stage4rReceipt.module?.activationExposed === false, 'activation must not be exposed', stage4rReceipt.module),
    gate('artifact_read_only', stage4rReceipt.artifact?.readOnly === true, 'artifact must load read-only', stage4rReceipt.artifact),
    gate('artifact_stage4h_index_digest_match', stage4rReceipt.artifact?.indexDigest === stage4rReceipt.digests?.stage4hIndexDigest, 'artifact index digest must match Stage 4h digest', { artifact: stage4rReceipt.artifact, digests: stage4rReceipt.digests }),
    gate('artifact_stage4h_source_digest_match', stage4rReceipt.artifact?.sourceDigest === stage4rReceipt.digests?.stage4hSourceDigest, 'artifact source digest must match Stage 4h digest', { artifact: stage4rReceipt.artifact, digests: stage4rReceipt.digests }),
    gate('commands_allowlisted', Array.isArray(stage4rReceipt.commandsExecuted) && stage4rReceipt.commandsExecuted.length === commands.length && stage4rReceipt.commandsExecuted.every((command) => commands.includes(command)), 'commands must be allowlisted', { commandsExecuted: stage4rReceipt.commandsExecuted, commands }),
    gate('commands_use_activation_dry_run_suffix', Array.isArray(stage4rReceipt.commandsExecuted) && stage4rReceipt.commandsExecuted.every((command) => command.endsWith('_activation_dry_run')), 'commands must use activation dry-run suffix', { commandsExecuted: stage4rReceipt.commandsExecuted }),
    gate('query_results_passed', queryResults.length > 0 && queryResults.every((result) => result.status === 'passed'), 'all query results must pass', { queryResults }),
    gate('tenant_scope_enforced', queryResults.length > 0 && queryResults.every((result) => typeof result.tenant === 'string' && result.decisionTrace?.tenantScope === result.tenant), 'tenant scope must be enforced for each query', { queryResults }),
    gate('candidates_only', queryResults.length > 0 && queryResults.every((result) => result.decisionTrace?.candidatesOnly === true), 'queries must return candidates only', { queryResults }),
    gate('answer_generation_disabled', queryResults.length > 0 && queryResults.every((result) => result.decisionTrace?.answerGeneration === false), 'answer generation must remain disabled', { queryResults }),
    gate('evidence_refs_verified', queryResults.length > 0 && queryResults.every((result) => result.evidenceVerification?.passed === true), 'evidence refs must verify for each query', { queryResults }),
    gate('receipt_only_writes', stage4rReceipt.governance?.writesOutsideReceipt === false, 'writes must remain receipt-only', stage4rReceipt.governance),
    gate('governance_read_only', stage4rReceipt.governance?.readOnly === true, 'governance must remain read-only', stage4rReceipt.governance),
    gate('governance_proposal_only', stage4rReceipt.governance?.proposalOnly === true, 'governance must remain proposal-only', stage4rReceipt.governance),
    gate('governance_dry_run_only', stage4rReceipt.governance?.dryRunOnly === true, 'governance must remain dry-run-only', stage4rReceipt.governance),
    gate('no_runtime_activation', stage4rReceipt.governance?.runtimeActivation === false, 'runtime activation must remain forbidden', stage4rReceipt.governance),
    gate('no_runtime_integration', stage4rReceipt.governance?.runtimeIntegration === false, 'runtime integration must remain forbidden', stage4rReceipt.governance),
    gate('no_endpoint', stage4rReceipt.governance?.endpoint === false, 'endpoint must remain forbidden', stage4rReceipt.governance),
    gate('no_scheduler', stage4rReceipt.governance?.scheduler === false, 'scheduler must remain forbidden', stage4rReceipt.governance),
    gate('no_network', stage4rReceipt.governance?.networkCalls === false, 'network calls must remain forbidden', stage4rReceipt.governance),
    gate('no_llm', stage4rReceipt.governance?.llmCalls === false, 'LLM calls must remain forbidden', stage4rReceipt.governance),
    gate('no_public_action', stage4rReceipt.governance?.publicActionAuthority === false, 'public action authority must remain forbidden', stage4rReceipt.governance),
    gate('no_source_mutation', stage4rReceipt.governance?.sourceMutation === false, 'source mutation must remain forbidden', stage4rReceipt.governance),
    gate('no_artifact_mutation', stage4rReceipt.governance?.artifactMutation === false, 'artifact mutation must remain forbidden', stage4rReceipt.governance),
  ];
}

export function runVectorRuntimeReadinessReviewGate({ reviewPath, stage4rReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(reviewPath)) throw new Error(`runtime readiness review file not found: ${reviewPath}`);
  if (!existsSync(stage4rReceiptPath)) throw new Error(`runtime activation dry-run receipt file not found: ${stage4rReceiptPath}`);
  const review = readJson(reviewPath);
  const stage4rReceipt = readJson(stage4rReceiptPath);
  const gates = {
    review: validateReview(review),
    stage4rReceipt: validateStage4rReceipt(stage4rReceipt, review),
  };
  const blockers = Object.entries(gates)
    .flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const reviewDigest = sha256(review);
  const stage4rReceiptDigest = sha256(stage4rReceipt);
  const readinessSignals = {
    module: {
      importable: stage4rReceipt.module?.importable === true,
      bindingsPresent: stage4rReceipt.module?.bindingsPresent === true,
      activationNotExposed: stage4rReceipt.module?.activationExposed === false,
    },
    artifact: {
      readOnly: stage4rReceipt.artifact?.readOnly === true,
      stage4hIndexDigestMatch: stage4rReceipt.artifact?.indexDigest === stage4rReceipt.digests?.stage4hIndexDigest,
      stage4hSourceDigestMatch: stage4rReceipt.artifact?.sourceDigest === stage4rReceipt.digests?.stage4hSourceDigest,
    },
    queries: {
      allPassed: Array.isArray(stage4rReceipt.queryResults) && stage4rReceipt.queryResults.every((result) => result.status === 'passed'),
      tenantScopeEnforced: Array.isArray(stage4rReceipt.queryResults) && stage4rReceipt.queryResults.every((result) => result.decisionTrace?.tenantScope === result.tenant),
      candidatesOnly: Array.isArray(stage4rReceipt.queryResults) && stage4rReceipt.queryResults.every((result) => result.decisionTrace?.candidatesOnly === true),
      answerGenerationDisabled: Array.isArray(stage4rReceipt.queryResults) && stage4rReceipt.queryResults.every((result) => result.decisionTrace?.answerGeneration === false),
      evidenceRefsVerified: Array.isArray(stage4rReceipt.queryResults) && stage4rReceipt.queryResults.every((result) => result.evidenceVerification?.passed === true),
    },
    execution: {
      commandsExecuted: stage4rReceipt.commandsExecuted,
      commandsAllowlisted: Array.isArray(stage4rReceipt.commandsExecuted) && stage4rReceipt.commandsExecuted.every((command) => command.endsWith('_activation_dry_run')),
      receiptOnlyWrites: stage4rReceipt.governance?.writesOutsideReceipt === false,
    },
  };
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeReadinessReviewReceipt',
    version: 'v1',
    authority: 'runtime_readiness_review_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_runtime_activation_decision_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'runtime_readiness_review',
    engine: review.engine,
    reviewDigest,
    stage4rReceiptDigest,
    prerequisiteDigests: {
      stage4qReceiptDigest: stage4rReceipt.digests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4rReceipt.digests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4rReceipt.digests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4rReceipt.digests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4rReceipt.digests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4rReceipt.digests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4rReceipt.digests?.receiptLinkageDigest,
    },
    readinessSignals,
    activationDecisionBoundary: {
      ...review.activationDecisionBoundary,
      runtimeActivationApprovedHere: false,
    },
    governance: {
      readOnly: true,
      proposalOnly: true,
      readinessReviewOnly: true,
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
      activationDryRunReceipt: {
        path: stage4rReceiptPath,
        kind: stage4rReceipt.kind,
        status: stage4rReceipt.status,
        eligibility: stage4rReceipt.eligibility,
        digest: stage4rReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'runtime_readiness_review_contract_plus_stage4r_activation_dry_run_receipt',
      reason: eligible
        ? 'Stage 4r proved local module, artifact, digest-chain, query and evidence signals sufficient for a separate activation decision review.'
        : 'Runtime readiness review blocked because Stage 4r signals or governance boundaries were incomplete.',
      nextAllowedStep: eligible ? 'runtime_activation_decision_review_gate' : 'revise_runtime_readiness_signals',
      activationApproved: false,
      endpointApproved: false,
      networkApproved: false,
      publicActionApproved: false,
    },
    summary: eligible
      ? 'Local runtime is ready for a separate activation decision review only. This receipt does not activate runtime wiring or expand authority.'
      : 'Local runtime is not yet ready for a separate activation decision review.',
  };

  if (receiptPath) {
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  }
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = runVectorRuntimeReadinessReviewGate({
      reviewPath: option('--review') || path.resolve(process.cwd(), 'config/vector-runtime-readiness-review.v1.json'),
      stage4rReceiptPath: option('--stage4r-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-activation-dry-run-receipt.v1.json'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-readiness-review-receipt.v1.json'),
    });
    console.log(`Vector runtime readiness review gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
  } catch (error) {
    console.error(`Vector runtime readiness review gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
