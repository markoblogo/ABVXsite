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
    gate('kind', review.kind === 'CortexABVVectorRuntimeActivationDryRunReview', 'review kind must match', { kind: review.kind }),
    gate('version', review.version === 'v1', 'review version must be v1', { version: review.version }),
    gate('authority', review.authority === 'activation_dry_run_review_only', 'review authority must be activation_dry_run_review_only', { authority: review.authority }),
    gate('engine', review.engine === 'turbovec', 'review engine must be turbovec', { engine: review.engine }),
  ];

  requireObject(review.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4p_prerequisite', review.prerequisites.requiredActivationReviewEligibility === 'eligible_for_runtime_activation_dry_run_review', 'review must require eligible Stage 4p activation review receipt', review.prerequisites),
    gate('stage4p_digest_required', review.prerequisites.requiresActivationReviewReceiptDigest === true, 'Stage 4p receipt digest is required', review.prerequisites),
  );

  requireObject(review.dryRunScope, 'dryRunScope');
  requireArray(review.dryRunScope.allowedBindings, 'dryRunScope.allowedBindings');
  requireArray(review.dryRunScope.localCallableInterfaceChecks, 'dryRunScope.localCallableInterfaceChecks');
  requireArray(review.dryRunScope.commands, 'dryRunScope.commands');
  requireArray(review.dryRunScope.writesAllowed, 'dryRunScope.writesAllowed');
  const allowedBindings = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  const requiredChecks = [
    'module_importable',
    'bindings_present',
    'artifact_loads_read_only',
    'tenant_scoped_query_returns_candidates_only',
    'evidence_refs_verified',
    'activation_not_exposed',
  ];
  const allowedCommands = new Set([
    'verify_stage4p_digest_activation_dry_run',
    'load_local_runtime_binding_activation_dry_run',
    'query_local_runtime_binding_activation_dry_run',
    'verify_activation_not_exposed_activation_dry_run',
  ]);
  gates.push(
    gate('future_runner_path', review.dryRunScope.futureRunnerPath === 'src/vector-runtime-activation-dry-run.mjs', 'future runner path must be bounded', review.dryRunScope),
    gate('future_test_path', review.dryRunScope.futureTestPath === 'test/vector-runtime-activation-dry-run.test.mjs', 'future test path must be bounded', review.dryRunScope),
    gate('scope_review_only', review.dryRunScope.mode === 'local_activation_dry_run_scope_review_only', 'dry-run scope must be review-only', review.dryRunScope),
    gate('target_eligibility', review.dryRunScope.targetEligibility === 'eligible_for_runtime_activation_dry_run', 'target eligibility must be activation dry-run', review.dryRunScope),
    gate('private_runtime_only', review.dryRunScope.allowedLocation === 'cortex-abv-private-runtime-only', 'dry-run must stay private-runtime only', review.dryRunScope),
    gate('local_callable_only', review.dryRunScope.activationMode === 'local_process_bound_callable_only', 'activation dry-run must be local process callable only', review.dryRunScope),
    gate('module_path', review.dryRunScope.allowedModulePath === 'src/vector-runtime-controlled-module-harness.mjs', 'module path must match controlled harness', review.dryRunScope),
    gate('allowed_bindings', review.dryRunScope.allowedBindings.every((binding) => allowedBindings.has(binding)), 'bindings must be allowlisted controlled harness functions', review.dryRunScope),
    gate('artifact_path', review.dryRunScope.allowedArtifactPath === 'data/vector-indexes/turbovec-poc/index-artifact.v1.json', 'artifact path must be local Stage 4h artifact', review.dryRunScope),
    gate('callable_checks_complete', requiredChecks.every((check) => review.dryRunScope.localCallableInterfaceChecks.includes(check)), 'local callable interface checks must be complete', { requiredChecks, observed: review.dryRunScope.localCallableInterfaceChecks }),
    gate('allowed_commands', review.dryRunScope.commands.every((command) => allowedCommands.has(command)), 'activation dry-run commands must be allowlisted', review.dryRunScope),
    gate('command_suffix', review.dryRunScope.commands.every((command) => command.endsWith(review.dryRunScope.commandsMustEndWith)), 'activation dry-run commands must use required suffix', review.dryRunScope),
    gate('receipt_only_writes', review.dryRunScope.writesAllowed.length === 1 && review.dryRunScope.writesAllowed[0] === 'receipt_only', 'writes must be receipt-only', review.dryRunScope),
    gate('rollback_action', review.dryRunScope.rollbackAction === 'abandon_activation_dry_run_receipt_and_do_not_activate_runtime', 'rollback action must abandon receipt and not activate runtime', review.dryRunScope),
    gate('rollback_notes_required', review.dryRunScope.rollbackNotesRequired === true, 'rollback notes must be required', review.dryRunScope),
    gate('owner_review_required', review.dryRunScope.ownerReviewRequired === true, 'owner review must be required', review.dryRunScope),
  );

  requireObject(review.digestChain, 'digestChain');
  for (const [key, expected] of Object.entries({
    requiresStage4pReceiptDigest: true,
    requiresStage4oReceiptDigest: true,
    requiresStage4nReceiptDigest: true,
    requiresStage4hArtifactDigest: true,
    requiresStage4hSourceDigest: true,
    requiresReceiptLinkageDigest: true,
  })) {
    gates.push(gate(`digest_${key}`, review.digestChain[key] === expected, `digestChain.${key} must be ${expected}`, review.digestChain));
  }

  requireObject(review.forbiddenAuthority, 'forbiddenAuthority');
  for (const [key, expected] of Object.entries({
    runtimeActivationAllowed: false,
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
    baselineAdvancementAllowed: false,
    dependencyInstallAllowed: false,
    shellAccessAllowed: false,
  })) {
    const id = key
      .replace('runtimeActivationAllowed', 'no_runtime_activation')
      .replace('endpointAllowed', 'no_endpoint')
      .replace('schedulerAllowed', 'no_scheduler')
      .replace('networkCallsAllowed', 'no_network')
      .replace('llmCallsAllowed', 'no_llm')
      .replace('publicActionAuthorityAllowed', 'no_public_action')
      .replace('answerGenerationAllowed', 'no_answer_generation')
      .replace('sourceMutationAllowed', 'no_source_mutation')
      .replace('artifactMutationAllowed', 'no_artifact_mutation')
      .replace('writesOutsideReceiptAllowed', 'no_external_writes')
      .replace('crossTenantQueriesAllowed', 'no_cross_tenant')
      .replace('baselineAdvancementAllowed', 'no_baseline_advancement')
      .replace('dependencyInstallAllowed', 'no_dependency_install')
      .replace('shellAccessAllowed', 'no_shell_access');
    gates.push(gate(id, review.forbiddenAuthority[key] === expected, `forbiddenAuthority.${key} must be ${expected}`, review.forbiddenAuthority));
  }

  requireArray(review.rejectionCases, 'rejectionCases');
  const requiredRejections = [
    'activation_review_not_eligible',
    'missing_stage4p_receipt_digest',
    'missing_stage4o_receipt_digest',
    'missing_stage4n_receipt_digest',
    'missing_stage4h_artifact_digest',
    'missing_stage4h_source_digest',
    'missing_receipt_linkage_digest',
    'missing_local_callable_interface_check',
    'non_allowlisted_command',
    'non_receipt_write_requested',
    'runtime_activation_requested',
    'endpoint_requested',
    'scheduler_requested',
    'network_calls_requested',
    'llm_calls_requested',
    'public_action_authority_requested',
    'answer_generation_requested',
    'source_mutation_requested',
    'artifact_mutation_requested',
    'cross_tenant_queries_requested',
    'baseline_advancement_requested',
    'dependency_install_requested',
    'shell_access_requested',
    'missing_rollback_notes',
    'missing_owner_review',
  ];
  gates.push(gate('rejection_cases_complete', requiredRejections.every((item) => review.rejectionCases.includes(item)), 'required rejection cases must be listed', { requiredRejections, rejectionCases: review.rejectionCases }));

  requireObject(review.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    activationDryRunReviewOnly: true,
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

function validateStage4pReceipt(stage4pReceipt, review) {
  return [
    gate('kind', stage4pReceipt.kind === review.prerequisites.requiredActivationReviewReceiptKind, 'Stage 4p receipt kind must match prerequisite', { kind: stage4pReceipt.kind }),
    gate('status', stage4pReceipt.status === review.prerequisites.requiredActivationReviewStatus, 'Stage 4p receipt status must be passed', { status: stage4pReceipt.status }),
    gate('eligibility', stage4pReceipt.eligibility === review.prerequisites.requiredActivationReviewEligibility, 'Stage 4p receipt eligibility must match prerequisite', { eligibility: stage4pReceipt.eligibility }),
    gate('no_blockers', Array.isArray(stage4pReceipt.blockers) && stage4pReceipt.blockers.length === 0, 'Stage 4p receipt must have no blockers', { blockers: stage4pReceipt.blockers }),
    gate('stage4o_digest_present', typeof stage4pReceipt.stage4oReceiptDigest === 'string' && stage4pReceipt.stage4oReceiptDigest.length === 64, 'Stage 4o digest must be present', { stage4oReceiptDigest: stage4pReceipt.stage4oReceiptDigest }),
    gate('stage4n_digest_present', typeof stage4pReceipt.prerequisiteDigests?.stage4nReceiptDigest === 'string' && stage4pReceipt.prerequisiteDigests.stage4nReceiptDigest.length === 64, 'Stage 4n digest must be present', stage4pReceipt.prerequisiteDigests),
    gate('stage4h_index_digest_present', typeof stage4pReceipt.prerequisiteDigests?.stage4hIndexDigest === 'string' && stage4pReceipt.prerequisiteDigests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', stage4pReceipt.prerequisiteDigests),
    gate('stage4h_source_digest_present', typeof stage4pReceipt.prerequisiteDigests?.stage4hSourceDigest === 'string' && stage4pReceipt.prerequisiteDigests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', stage4pReceipt.prerequisiteDigests),
    gate('activation_scope_local', stage4pReceipt.activationDefinition?.activationMode === review.dryRunScope.activationMode, 'Stage 4p activation mode must match dry-run scope', stage4pReceipt.activationDefinition),
    gate('no_activation_in_stage4p', stage4pReceipt.governance?.runtimeActivationApproved === false && stage4pReceipt.activationDefinition?.runtimeActivationApprovedHere === false, 'Stage 4p must not approve activation', { governance: stage4pReceipt.governance, activationDefinition: stage4pReceipt.activationDefinition }),
    gate('no_runtime_integration', stage4pReceipt.governance?.runtimeIntegration === false, 'Stage 4p must not approve runtime integration', stage4pReceipt.governance),
    gate('no_endpoint', stage4pReceipt.governance?.endpoint === false, 'Stage 4p must not approve endpoint', stage4pReceipt.governance),
    gate('no_network', stage4pReceipt.governance?.networkCalls === false, 'Stage 4p must not approve network calls', stage4pReceipt.governance),
    gate('no_llm', stage4pReceipt.governance?.llmCalls === false, 'Stage 4p must not approve LLM calls', stage4pReceipt.governance),
    gate('no_public_action', stage4pReceipt.governance?.publicActionAuthority === false, 'Stage 4p must not approve public action authority', stage4pReceipt.governance),
  ];
}

export function runVectorRuntimeActivationDryRunReviewGate({ reviewPath, stage4pReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(reviewPath)) throw new Error(`activation dry-run review file not found: ${reviewPath}`);
  if (!existsSync(stage4pReceiptPath)) throw new Error(`runtime activation review receipt file not found: ${stage4pReceiptPath}`);
  const review = readJson(reviewPath);
  const stage4pReceipt = readJson(stage4pReceiptPath);
  const gates = {
    review: validateReview(review),
    stage4pReceipt: validateStage4pReceipt(stage4pReceipt, review),
  };
  const blockers = Object.entries(gates)
    .flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const reviewDigest = sha256(review);
  const stage4pReceiptDigest = sha256(stage4pReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeActivationDryRunReviewReceipt',
    version: 'v1',
    authority: 'activation_dry_run_review_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_runtime_activation_dry_run' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'runtime_activation_dry_run_review',
    engine: review.engine,
    reviewDigest,
    stage4pReceiptDigest,
    prerequisiteDigests: {
      stage4oReceiptDigest: stage4pReceipt.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4pReceipt.prerequisiteDigests?.stage4nReceiptDigest,
      stage4mReceiptDigest: stage4pReceipt.prerequisiteDigests?.stage4mReceiptDigest,
      stage4lReceiptDigest: stage4pReceipt.prerequisiteDigests?.stage4lReceiptDigest,
      stage4kReceiptDigest: stage4pReceipt.prerequisiteDigests?.stage4kReceiptDigest,
      stage4hIndexDigest: stage4pReceipt.prerequisiteDigests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4pReceipt.prerequisiteDigests?.stage4hSourceDigest,
    },
    dryRunScope: review.dryRunScope,
    forbiddenAuthority: review.forbiddenAuthority,
    governance: {
      readOnly: true,
      proposalOnly: true,
      activationDryRunReviewOnly: true,
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
      activationReviewReceipt: {
        path: stage4pReceiptPath,
        kind: stage4pReceipt.kind,
        status: stage4pReceipt.status,
        eligibility: stage4pReceipt.eligibility,
        digest: stage4pReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'runtime_activation_dry_run_review_contract_plus_stage4p_activation_review_receipt',
      reason: eligible
        ? 'Activation dry-run scope is bounded to local callable interface checks with receipt-only writes and no activation authority.'
        : 'Activation dry-run review or Stage 4p activation review receipt failed gates.',
      nextAllowedStep: eligible ? 'runtime_activation_dry_run' : 'repair_runtime_activation_dry_run_review_or_stage4p_receipt',
    },
    review: {
      pendingReview: eligible,
      approvalMeaning: 'Approve only a future local activation dry-run. This still does not activate runtime wiring, expose endpoints, start schedulers, call models, use network, mutate source/index artifacts, write externally, create public actions or publish.',
      requiredFields: ['eligibility', 'dryRunScope', 'forbiddenAuthority', 'prerequisiteDigests', 'governance', 'sources', 'gates', 'blockers', 'decisionTrace'],
    },
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimeActivationDryRunReviewGate({
    reviewPath: option('--review') || path.resolve(process.cwd(), 'config/vector-runtime-activation-dry-run-review.v1.json'),
    stage4pReceiptPath: option('--stage4p-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-activation-review-receipt.v1.json'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-activation-dry-run-review-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime activation dry-run review gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime activation dry-run review gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
