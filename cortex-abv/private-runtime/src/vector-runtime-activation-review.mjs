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
    gate('kind', review.kind === 'CortexABVVectorRuntimeActivationReview', 'review kind must match', { kind: review.kind }),
    gate('version', review.version === 'v1', 'review version must be v1', { version: review.version }),
    gate('authority', review.authority === 'activation_review_only', 'review authority must be activation_review_only', { authority: review.authority }),
    gate('engine', review.engine === 'turbovec', 'review engine must be turbovec', { engine: review.engine }),
  ];

  requireObject(review.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4o_prerequisite', review.prerequisites.requiredControlledWiringReviewEligibility === 'eligible_for_runtime_activation_review', 'review must require eligible Stage 4o controlled wiring review receipt', review.prerequisites),
    gate('stage4o_digest_required', review.prerequisites.requiresControlledWiringReviewReceiptDigest === true, 'Stage 4o receipt digest is required', review.prerequisites),
  );

  requireObject(review.activationDefinition, 'activationDefinition');
  requireArray(review.activationDefinition.allowedBindings, 'activationDefinition.allowedBindings');
  const allowedBindings = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  gates.push(
    gate('definition_meaning', review.activationDefinition.meaning === 'local_private_runtime_availability_for_internal_callable_interface_only', 'activation meaning must be local private-runtime availability only', review.activationDefinition),
    gate('private_runtime_only', review.activationDefinition.allowedLocation === 'cortex-abv-private-runtime-only', 'activation must stay private-runtime only', review.activationDefinition),
    gate('local_process_only', review.activationDefinition.activationMode === 'local_process_bound_callable_only', 'activation mode must be local process bound callable only', review.activationDefinition),
    gate('module_path', review.activationDefinition.allowedModulePath === 'src/vector-runtime-controlled-module-harness.mjs', 'activation module path must match controlled harness', review.activationDefinition),
    gate('allowed_bindings', review.activationDefinition.allowedBindings.every((binding) => allowedBindings.has(binding)), 'activation bindings must be allowlisted harness functions', review.activationDefinition),
    gate('activation_dry_run_required', review.activationDefinition.activationDryRunRequired === true, 'activation dry-run is required before activation', review.activationDefinition),
    gate('no_activation_here', review.activationDefinition.runtimeActivationApprovedHere === false, 'activation review must not approve activation here', review.activationDefinition),
    gate('no_endpoint', review.activationDefinition.endpointAllowed === false, 'endpoint must remain forbidden', review.activationDefinition),
    gate('no_scheduler', review.activationDefinition.schedulerAllowed === false, 'scheduler must remain forbidden', review.activationDefinition),
    gate('no_network', review.activationDefinition.networkCallsAllowed === false, 'network calls must remain forbidden', review.activationDefinition),
    gate('no_llm', review.activationDefinition.llmCallsAllowed === false, 'LLM calls must remain forbidden', review.activationDefinition),
    gate('no_public_action', review.activationDefinition.publicActionAuthorityAllowed === false, 'public action authority must remain forbidden', review.activationDefinition),
    gate('no_answer_generation', review.activationDefinition.answerGenerationAllowed === false, 'answer generation must remain forbidden', review.activationDefinition),
    gate('no_source_mutation', review.activationDefinition.sourceMutationAllowed === false, 'source mutation must remain forbidden', review.activationDefinition),
    gate('no_artifact_mutation', review.activationDefinition.artifactMutationAllowed === false, 'artifact mutation must remain forbidden', review.activationDefinition),
    gate('no_external_writes', review.activationDefinition.writesOutsideReceiptAllowed === false, 'external writes must remain forbidden', review.activationDefinition),
    gate('no_cross_tenant', review.activationDefinition.crossTenantQueriesAllowed === false, 'cross-tenant queries must remain forbidden', review.activationDefinition),
    gate('no_baseline_advancement', review.activationDefinition.baselineAdvancementAllowed === false, 'baseline advancement must remain forbidden', review.activationDefinition),
  );

  requireObject(review.activationDryRunScope, 'activationDryRunScope');
  requireArray(review.activationDryRunScope.allowedCommands, 'activationDryRunScope.allowedCommands');
  const commandAllowlist = new Set([
    'verify_stage4o_digest_activation_dry_run',
    'load_local_runtime_binding_activation_dry_run',
    'query_local_runtime_binding_activation_dry_run',
    'verify_activation_not_exposed_activation_dry_run',
  ]);
  gates.push(
    gate('future_runner_path', review.activationDryRunScope.futureRunnerPath === 'src/vector-runtime-activation-dry-run.mjs', 'future activation dry-run runner path must be bounded', review.activationDryRunScope),
    gate('future_test_path', review.activationDryRunScope.futureTestPath === 'test/vector-runtime-activation-dry-run.test.mjs', 'future activation dry-run test path must be bounded', review.activationDryRunScope),
    gate('target_eligibility', review.activationDryRunScope.targetEligibility === 'eligible_for_runtime_activation_dry_run_review', 'target eligibility must be activation dry-run review', review.activationDryRunScope),
    gate('stage4o_digest_required_for_dry_run', review.activationDryRunScope.requiresStage4oReceiptDigest === true, 'future dry-run must require Stage 4o receipt digest', review.activationDryRunScope),
    gate('rollback_notes_required', review.activationDryRunScope.requiresRollbackNotes === true, 'rollback notes must be required', review.activationDryRunScope),
    gate('owner_review_required', review.activationDryRunScope.requiresOwnerReview === true, 'owner review must be required', review.activationDryRunScope),
    gate('bounded_commands', review.activationDryRunScope.allowedCommands.every((command) => commandAllowlist.has(command)), 'activation dry-run commands must be allowlisted', review.activationDryRunScope),
    gate('command_suffix', review.activationDryRunScope.allowedCommands.every((command) => command.endsWith(review.activationDryRunScope.commandsMustEndWith)), 'activation dry-run commands must use required suffix', review.activationDryRunScope),
  );

  requireObject(review.requiredEvidence, 'requiredEvidence');
  for (const [key, expected] of Object.entries({
    requiresStage4oReceiptDigest: true,
    requiresStage4nReceiptDigest: true,
    requiresStage4hArtifactDigest: true,
    requiresStage4hSourceDigest: true,
    requiresPassedWiringReview: true,
    requiresEvidenceVerification: true,
    requiresNoActivationInPrerequisite: true,
  })) {
    gates.push(gate(`evidence_${key}`, review.requiredEvidence[key] === expected, `requiredEvidence.${key} must be ${expected}`, review.requiredEvidence));
  }

  requireArray(review.rejectionCases, 'rejectionCases');
  const requiredRejections = [
    'controlled_wiring_review_not_eligible',
    'missing_stage4o_receipt_digest',
    'missing_stage4n_receipt_digest',
    'missing_stage4h_artifact_digest',
    'missing_stage4h_source_digest',
    'runtime_activation_requested_here',
    'endpoint_requested',
    'scheduler_requested',
    'network_calls_requested',
    'llm_calls_requested',
    'public_action_authority_requested',
    'answer_generation_requested',
    'source_mutation_requested',
    'artifact_mutation_requested',
    'external_writes_requested',
    'cross_tenant_queries_requested',
    'baseline_advancement_requested',
    'missing_rollback_notes',
    'missing_owner_review',
  ];
  gates.push(gate('rejection_cases_complete', requiredRejections.every((item) => review.rejectionCases.includes(item)), 'required rejection cases must be listed', { requiredRejections, rejectionCases: review.rejectionCases }));

  requireObject(review.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    activationReviewOnly: true,
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

function validateStage4oReceipt(stage4oReceipt, review) {
  return [
    gate('kind', stage4oReceipt.kind === review.prerequisites.requiredControlledWiringReviewReceiptKind, 'Stage 4o receipt kind must match prerequisite', { kind: stage4oReceipt.kind }),
    gate('status', stage4oReceipt.status === review.prerequisites.requiredControlledWiringReviewStatus, 'Stage 4o receipt status must be passed', { status: stage4oReceipt.status }),
    gate('eligibility', stage4oReceipt.eligibility === review.prerequisites.requiredControlledWiringReviewEligibility, 'Stage 4o receipt eligibility must match prerequisite', { eligibility: stage4oReceipt.eligibility }),
    gate('no_blockers', Array.isArray(stage4oReceipt.blockers) && stage4oReceipt.blockers.length === 0, 'Stage 4o receipt must have no blockers', { blockers: stage4oReceipt.blockers }),
    gate('stage4n_digest_present', typeof stage4oReceipt.stage4nReceiptDigest === 'string' && stage4oReceipt.stage4nReceiptDigest.length === 64, 'Stage 4n receipt digest must be present', { stage4nReceiptDigest: stage4oReceipt.stage4nReceiptDigest }),
    gate('stage4h_index_digest_present', typeof stage4oReceipt.prerequisiteDigests?.stage4hIndexDigest === 'string' && stage4oReceipt.prerequisiteDigests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', stage4oReceipt.prerequisiteDigests),
    gate('stage4h_source_digest_present', typeof stage4oReceipt.prerequisiteDigests?.stage4hSourceDigest === 'string' && stage4oReceipt.prerequisiteDigests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', stage4oReceipt.prerequisiteDigests),
    gate('wiring_reviewed', stage4oReceipt.governance?.wiringReviewed === true && stage4oReceipt.governance?.wiringReviewOnly === true, 'Stage 4o must be reviewed wiring only', stage4oReceipt.governance),
    gate('no_runtime_activation', stage4oReceipt.governance?.runtimeActivationApproved === false, 'Stage 4o receipt must not approve runtime activation', stage4oReceipt.governance),
    gate('no_runtime_integration', stage4oReceipt.governance?.runtimeIntegration === false, 'Stage 4o receipt must not approve runtime integration', stage4oReceipt.governance),
    gate('no_endpoint', stage4oReceipt.governance?.endpoint === false, 'Stage 4o receipt must not approve endpoint', stage4oReceipt.governance),
    gate('no_network', stage4oReceipt.governance?.networkCalls === false, 'Stage 4o receipt must not approve network calls', stage4oReceipt.governance),
    gate('no_llm', stage4oReceipt.governance?.llmCalls === false, 'Stage 4o receipt must not approve LLM calls', stage4oReceipt.governance),
    gate('no_public_action', stage4oReceipt.governance?.publicActionAuthority === false, 'Stage 4o receipt must not approve public action authority', stage4oReceipt.governance),
    gate('activation_boundary_separate', stage4oReceipt.activationBoundary?.activationReviewRequired === true && stage4oReceipt.activationBoundary?.runtimeActivationAllowedHere === false, 'Stage 4o activation boundary must require separate review and forbid activation here', stage4oReceipt.activationBoundary),
  ];
}

export function runVectorRuntimeActivationReviewGate({ reviewPath, stage4oReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(reviewPath)) throw new Error(`runtime activation review file not found: ${reviewPath}`);
  if (!existsSync(stage4oReceiptPath)) throw new Error(`controlled wiring review receipt file not found: ${stage4oReceiptPath}`);
  const review = readJson(reviewPath);
  const stage4oReceipt = readJson(stage4oReceiptPath);
  const gates = {
    review: validateReview(review),
    stage4oReceipt: validateStage4oReceipt(stage4oReceipt, review),
  };
  const blockers = Object.entries(gates)
    .flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const reviewDigest = sha256(review);
  const stage4oReceiptDigest = sha256(stage4oReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeActivationReviewReceipt',
    version: 'v1',
    authority: 'activation_review_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_runtime_activation_dry_run_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'runtime_activation_review',
    engine: review.engine,
    reviewDigest,
    stage4oReceiptDigest,
    prerequisiteDigests: {
      stage4nReceiptDigest: stage4oReceipt.stage4nReceiptDigest,
      stage4mReceiptDigest: stage4oReceipt.prerequisiteDigests?.stage4mReceiptDigest,
      stage4lReceiptDigest: stage4oReceipt.prerequisiteDigests?.stage4lReceiptDigest,
      stage4kReceiptDigest: stage4oReceipt.prerequisiteDigests?.stage4kReceiptDigest,
      stage4hIndexDigest: stage4oReceipt.prerequisiteDigests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4oReceipt.prerequisiteDigests?.stage4hSourceDigest,
    },
    activationDefinition: {
      ...review.activationDefinition,
      runtimeActivationApprovedHere: false,
    },
    activationDryRunScope: review.activationDryRunScope,
    governance: {
      readOnly: true,
      proposalOnly: true,
      activationReviewOnly: true,
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
      controlledWiringReviewReceipt: {
        path: stage4oReceiptPath,
        kind: stage4oReceipt.kind,
        status: stage4oReceipt.status,
        eligibility: stage4oReceipt.eligibility,
        digest: stage4oReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'runtime_activation_review_contract_plus_stage4o_wiring_review_receipt',
      reason: eligible
        ? 'Runtime activation can advance to a dry-run review because Stage 4o reviewed local wiring and activation remains unapproved and unexposed.'
        : 'Runtime activation review or Stage 4o wiring receipt failed review gates.',
      nextAllowedStep: eligible ? 'runtime_activation_dry_run_review_gate' : 'repair_runtime_activation_review_or_stage4o_receipt',
    },
    review: {
      pendingReview: eligible,
      approvalMeaning: 'Approve only review of a future local activation dry-run. This does not activate runtime wiring, expose endpoints, start schedulers, call models, use network, mutate source/index artifacts, write externally, create public actions or publish.',
      requiredFields: ['eligibility', 'activationDefinition', 'activationDryRunScope', 'prerequisiteDigests', 'governance', 'sources', 'gates', 'blockers', 'decisionTrace'],
    },
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimeActivationReviewGate({
    reviewPath: option('--review') || path.resolve(process.cwd(), 'config/vector-runtime-activation-review.v1.json'),
    stage4oReceiptPath: option('--stage4o-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-controlled-wiring-review-receipt.v1.json'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-activation-review-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime activation review gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime activation review gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
