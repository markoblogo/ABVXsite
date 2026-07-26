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

function validateReviewShape(review) {
  requireObject(review, 'review');
  const gates = [
    gate('kind', review.kind === 'CortexABVVectorRuntimeControlledWiringPocReview', 'review kind must match', { kind: review.kind }),
    gate('version', review.version === 'v1', 'review version must be v1', { version: review.version }),
    gate('authority', review.authority === 'plan_only', 'review authority must be plan_only', { authority: review.authority }),
    gate('engine', review.engine === 'turbovec', 'review engine must be turbovec', { engine: review.engine }),
  ];

  requireObject(review.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4l_prerequisite', review.prerequisites.requiredControlledWiringDesignEligibility === 'eligible_for_controlled_runtime_wiring_poc_review', 'review must require eligible Stage 4l controlled wiring design receipt', review.prerequisites),
    gate('stage4l_digest_required', review.prerequisites.requiresControlledWiringDesignReceiptDigest === true, 'Stage 4l receipt digest is required', review.prerequisites),
  );

  requireObject(review.pocScope, 'pocScope');
  requireArray(review.pocScope.allowedBindings, 'pocScope.allowedBindings');
  const allowedBindings = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  gates.push(
    gate('poc_review_only', review.pocScope.mode === 'controlled_wiring_poc_review_only', 'POC scope must be review-only', review.pocScope),
    gate('future_runner_path', review.pocScope.futureRunnerPath === 'src/vector-runtime-controlled-wiring-poc-dry-run.mjs', 'future runner path must be explicit and bounded', review.pocScope),
    gate('future_test_path', review.pocScope.futureTestPath === 'test/vector-runtime-controlled-wiring-poc-dry-run.test.mjs', 'future test path must be explicit and bounded', review.pocScope),
    gate('private_runtime_only', review.pocScope.allowedLocation === 'cortex-abv-private-runtime-only', 'POC must stay private-runtime only', review.pocScope),
    gate('local_binding_only', review.pocScope.bindingMode === 'in_process_local_library_binding_only', 'POC binding mode must be local in-process only', review.pocScope),
    gate('module_path', review.pocScope.allowedModulePath === 'src/vector-runtime-controlled-module-harness.mjs', 'POC module path must match controlled harness', review.pocScope),
    gate('allowed_bindings', review.pocScope.allowedBindings.every((binding) => allowedBindings.has(binding)), 'POC bindings must be allowlisted controlled harness functions', review.pocScope),
    gate('artifact_path', review.pocScope.allowedArtifactPath === 'data/vector-indexes/turbovec-poc/index-artifact.v1.json', 'POC artifact path must be the Stage 4h local artifact path', review.pocScope),
    gate('no_committed_index_artifacts', review.pocScope.committedIndexArtifactsAllowed === false, 'committed index artifacts must remain forbidden', review.pocScope),
    gate('no_endpoint', review.pocScope.endpointAllowed === false, 'endpoint must remain forbidden', review.pocScope),
    gate('no_scheduler', review.pocScope.schedulerAllowed === false, 'scheduler must remain forbidden', review.pocScope),
    gate('no_network', review.pocScope.networkAccessAllowed === false, 'network access must remain forbidden', review.pocScope),
    gate('no_llm', review.pocScope.llmCallsAllowed === false, 'LLM calls must remain forbidden', review.pocScope),
    gate('no_public_action', review.pocScope.publicActionAuthorityAllowed === false, 'public action authority must remain forbidden', review.pocScope),
    gate('no_source_mutation', review.pocScope.sourceMutationAllowed === false, 'source mutation must remain forbidden', review.pocScope),
    gate('no_artifact_mutation', review.pocScope.artifactMutationAllowed === false, 'artifact mutation must remain forbidden', review.pocScope),
    gate('no_external_writes', review.pocScope.writesOutsideReceiptAllowed === false, 'external writes must remain forbidden', review.pocScope),
    gate('no_cross_tenant', review.pocScope.crossTenantQueriesAllowed === false, 'cross-tenant queries must remain forbidden', review.pocScope),
    gate('no_answer_generation', review.pocScope.answerGenerationAllowed === false, 'answer generation must remain forbidden', review.pocScope),
  );

  requireObject(review.digestAndRollback, 'digestAndRollback');
  for (const [key, expected] of Object.entries({
    requiresStage4lReceiptDigest: true,
    requiresStage4kReceiptDigest: true,
    requiresStage4hArtifactDigest: true,
    requiresStage4hSourceDigest: true,
    requiresReceiptDigestLinkage: true,
    requiresRollbackNotes: true,
    baselineAdvancementAllowed: false,
  })) {
    gates.push(gate(`digest_${key}`, review.digestAndRollback[key] === expected, `digestAndRollback.${key} must be ${expected}`, review.digestAndRollback));
  }
  gates.push(gate('rollback_action', review.digestAndRollback.rollbackAction === 'abandon_wiring_poc_receipt_and_do_not_activate_binding', 'rollback must abandon POC receipt and not activate binding', review.digestAndRollback));

  requireObject(review.dryRunCommandPolicy, 'dryRunCommandPolicy');
  requireArray(review.dryRunCommandPolicy.allowedCommands, 'dryRunCommandPolicy.allowedCommands');
  const commandAllowlist = new Set([
    'verify_stage4l_digest_poc_dry_run',
    'bind_local_harness_poc_dry_run',
    'query_local_harness_poc_dry_run',
    'verify_no_activation_poc_dry_run',
  ]);
  gates.push(
    gate('bounded_dry_run_commands', review.dryRunCommandPolicy.allowedCommands.every((command) => commandAllowlist.has(command)), 'dry-run commands must be explicitly allowlisted', review.dryRunCommandPolicy),
    gate('dry_run_suffix', review.dryRunCommandPolicy.allowedCommands.every((command) => command.endsWith(review.dryRunCommandPolicy.commandsMustEndWith)), 'dry-run commands must use the required suffix', review.dryRunCommandPolicy),
    gate('no_shell_access', review.dryRunCommandPolicy.shellAccessAllowed === false, 'shell access is forbidden for future POC command surface', review.dryRunCommandPolicy),
    gate('no_dependency_install', review.dryRunCommandPolicy.installDependenciesAllowed === false, 'dependency install is forbidden for future POC command surface', review.dryRunCommandPolicy),
    gate('no_source_mutation_command', review.dryRunCommandPolicy.mutateSourcePacksAllowed === false, 'source pack mutation is forbidden', review.dryRunCommandPolicy),
    gate('no_artifact_mutation_command', review.dryRunCommandPolicy.mutateIndexArtifactAllowed === false, 'index artifact mutation is forbidden', review.dryRunCommandPolicy),
    gate('no_runtime_activation_command', review.dryRunCommandPolicy.activateRuntimeAllowed === false, 'runtime activation is forbidden', review.dryRunCommandPolicy),
  );

  requireObject(review.reviewGate, 'reviewGate');
  gates.push(
    gate('target_eligibility', review.reviewGate.targetEligibility === 'eligible_for_controlled_runtime_wiring_poc_dry_run_review', 'target eligibility must be controlled wiring POC dry-run review', review.reviewGate),
    gate('separate_poc_approval', review.reviewGate.wiringPocImplementationRequiresSeparateApproval === true, 'wiring POC implementation requires separate approval', review.reviewGate),
    gate('separate_activation_approval', review.reviewGate.runtimeActivationRequiresSeparateApproval === true, 'runtime activation requires separate approval', review.reviewGate),
    gate('owner_review_required', review.reviewGate.ownerReviewRequired === true, 'owner review is required', review.reviewGate),
  );

  requireArray(review.rejectionCases, 'rejectionCases');
  const requiredRejections = [
    'controlled_wiring_design_receipt_not_eligible',
    'missing_stage4l_receipt_digest',
    'missing_stage4k_receipt_digest',
    'missing_stage4h_artifact_digest',
    'missing_stage4h_source_digest',
    'endpoint_requested',
    'scheduler_requested',
    'network_access_requested',
    'llm_calls_requested',
    'public_action_authority_requested',
    'source_mutation_requested',
    'artifact_mutation_requested',
    'external_writes_requested',
    'cross_tenant_queries_requested',
    'answer_generation_requested',
    'runtime_activation_requested',
    'non_allowlisted_binding_requested',
    'non_dry_run_command',
    'missing_rollback_notes',
    'baseline_advancement_requested',
  ];
  gates.push(gate('rejection_cases_complete', requiredRejections.every((item) => review.rejectionCases.includes(item)), 'required rejection cases must be listed', { requiredRejections, rejectionCases: review.rejectionCases }));

  requireObject(review.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    controlledWiringPocReviewOnly: true,
    controlledWiringPocApproved: false,
    wiringImplementationApproved: false,
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

function validateStage4lReceipt(stage4lReceipt, review) {
  return [
    gate('kind', stage4lReceipt.kind === review.prerequisites.requiredControlledWiringDesignReceiptKind, 'Stage 4l receipt kind must match prerequisite', { kind: stage4lReceipt.kind }),
    gate('status', stage4lReceipt.status === review.prerequisites.requiredControlledWiringDesignStatus, 'Stage 4l receipt status must be passed', { status: stage4lReceipt.status }),
    gate('eligibility', stage4lReceipt.eligibility === review.prerequisites.requiredControlledWiringDesignEligibility, 'Stage 4l receipt eligibility must match prerequisite', { eligibility: stage4lReceipt.eligibility }),
    gate('no_blockers', Array.isArray(stage4lReceipt.blockers) && stage4lReceipt.blockers.length === 0, 'Stage 4l receipt must have no blockers', { blockers: stage4lReceipt.blockers }),
    gate('stage4l_harness_digest_present', typeof stage4lReceipt.digests?.harnessDryRunReceiptDigest === 'string' && stage4lReceipt.digests.harnessDryRunReceiptDigest.length === 64, 'Stage 4k harness receipt digest must be present in Stage 4l receipt', stage4lReceipt.digests),
    gate('stage4k_linkage_digest_present', typeof stage4lReceipt.digests?.stage4kReceiptLinkageDigest === 'string' && stage4lReceipt.digests.stage4kReceiptLinkageDigest.length === 64, 'Stage 4k linkage digest must be present', stage4lReceipt.digests),
    gate('stage4h_index_digest_present', typeof stage4lReceipt.digests?.stage4hIndexDigest === 'string' && stage4lReceipt.digests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', stage4lReceipt.digests),
    gate('binding_contract_local', stage4lReceipt.wiringContract?.wiringBoundary?.wiringMode === 'in_process_local_library_binding_only', 'Stage 4l binding mode must be local in-process only', stage4lReceipt.wiringContract?.wiringBoundary),
    gate('binding_contract_candidates_only', stage4lReceipt.wiringContract?.bindingContract?.returnsCandidatesOnly === true, 'Stage 4l binding must return candidates only', stage4lReceipt.wiringContract?.bindingContract),
    gate('no_wiring_implementation', stage4lReceipt.governance?.wiringImplementationApproved === false, 'Stage 4l receipt must not approve wiring implementation', stage4lReceipt.governance),
    gate('no_runtime_activation', stage4lReceipt.governance?.runtimeActivationApproved === false, 'Stage 4l receipt must not approve runtime activation', stage4lReceipt.governance),
    gate('no_runtime_integration', stage4lReceipt.governance?.runtimeIntegration === false, 'Stage 4l receipt must not approve runtime integration', stage4lReceipt.governance),
    gate('no_endpoint', stage4lReceipt.governance?.endpoint === false, 'Stage 4l receipt must not approve endpoints', stage4lReceipt.governance),
    gate('no_network', stage4lReceipt.governance?.networkCalls === false, 'Stage 4l receipt must not approve network calls', stage4lReceipt.governance),
    gate('no_llm', stage4lReceipt.governance?.llmCalls === false, 'Stage 4l receipt must not approve LLM calls', stage4lReceipt.governance),
    gate('no_public_action', stage4lReceipt.governance?.publicActionAuthority === false, 'Stage 4l receipt must not approve public action authority', stage4lReceipt.governance),
  ];
}

export function runVectorRuntimeControlledWiringPocReviewGate({ reviewPath, stage4lReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(reviewPath)) throw new Error(`controlled wiring POC review file not found: ${reviewPath}`);
  if (!existsSync(stage4lReceiptPath)) throw new Error(`controlled wiring design receipt file not found: ${stage4lReceiptPath}`);
  const review = readJson(reviewPath);
  const stage4lReceipt = readJson(stage4lReceiptPath);
  const gates = {
    review: validateReviewShape(review),
    stage4lReceipt: validateStage4lReceipt(stage4lReceipt, review),
  };
  const blockers = Object.entries(gates)
    .flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const reviewDigest = sha256(review);
  const stage4lReceiptDigest = sha256(stage4lReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeControlledWiringPocReviewReceipt',
    version: 'v1',
    authority: 'plan_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_controlled_runtime_wiring_poc_dry_run_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'controlled_runtime_wiring_poc_scope_review',
    engine: review.engine,
    reviewDigest,
    stage4lReceiptDigest,
    prerequisiteDigests: {
      stage4kHarnessDryRunReceiptDigest: stage4lReceipt.digests?.harnessDryRunReceiptDigest,
      stage4kReceiptLinkageDigest: stage4lReceipt.digests?.stage4kReceiptLinkageDigest,
      stage4hIndexDigest: stage4lReceipt.digests?.stage4hIndexDigest,
    },
    minimumPocScope: {
      futureRunnerPath: review.pocScope?.futureRunnerPath,
      futureTestPath: review.pocScope?.futureTestPath,
      bindingMode: review.pocScope?.bindingMode,
      allowedModulePath: review.pocScope?.allowedModulePath,
      allowedBindings: review.pocScope?.allowedBindings,
      allowedArtifactPath: review.pocScope?.allowedArtifactPath,
      allowedDryRunCommands: review.dryRunCommandPolicy?.allowedCommands,
      digestAndRollback: review.digestAndRollback,
    },
    governance: {
      readOnly: true,
      proposalOnly: true,
      controlledWiringPocReviewOnly: true,
      controlledWiringPocApproved: false,
      wiringImplementationApproved: false,
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
      controlledWiringDesignReceipt: {
        path: stage4lReceiptPath,
        kind: stage4lReceipt.kind,
        status: stage4lReceipt.status,
        eligibility: stage4lReceipt.eligibility,
        digest: stage4lReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'controlled_wiring_poc_review_contract_plus_stage4l_design_receipt',
      reason: eligible
        ? 'Minimum controlled wiring POC dry-run scope is bounded and linked to an eligible Stage 4l design receipt.'
        : 'Controlled wiring POC scope or Stage 4l design receipt failed review gates.',
      nextAllowedStep: eligible ? 'controlled_runtime_wiring_poc_dry_run_design' : 'repair_controlled_wiring_poc_review_or_stage4l_receipt',
    },
    review: {
      pendingReview: eligible,
      approvalMeaning: 'Approve only review of a future controlled local wiring POC dry-run. This does not approve POC implementation, runtime activation, endpoints, schedulers, model calls, network calls, external writes, source or artifact mutation, public actions or publication.',
      requiredFields: ['eligibility', 'minimumPocScope', 'prerequisiteDigests', 'governance', 'sources', 'gates', 'blockers', 'decisionTrace'],
    },
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimeControlledWiringPocReviewGate({
    reviewPath: option('--review') || path.resolve(process.cwd(), 'config/vector-runtime-controlled-wiring-poc-review.v1.json'),
    stage4lReceiptPath: option('--stage4l-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-controlled-wiring-design-receipt.v1.json'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-controlled-wiring-poc-review-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime controlled wiring POC review gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime controlled wiring POC review gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
