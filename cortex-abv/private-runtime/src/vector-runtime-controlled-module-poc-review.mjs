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
  return {
    id,
    status: passed ? 'accepted' : 'blocked',
    reason,
    evidence,
  };
}

function validateReviewShape(review) {
  requireObject(review, 'review');
  const gates = [
    gate('kind', review.kind === 'CortexABVVectorRuntimeControlledModulePocReview', 'review kind must match', { kind: review.kind }),
    gate('version', review.version === 'v1', 'review version must be v1', { version: review.version }),
    gate('authority', review.authority === 'plan_only', 'review authority must be plan_only', { authority: review.authority }),
    gate('engine', review.engine === 'turbovec', 'review engine must be turbovec', { engine: review.engine }),
  ];

  requireObject(review.prerequisites, 'prerequisites');
  gates.push(
    gate('design_receipt_prerequisite', review.prerequisites.requiredControlledModuleDesignEligibility === 'eligible_for_controlled_runtime_module_poc_review', 'review must require eligible Stage 4i design receipt', review.prerequisites),
    gate('design_receipt_digest_required', review.prerequisites.requiresControlledModuleDesignReceiptDigest === true, 'Stage 4i receipt digest is required', review.prerequisites),
  );

  requireObject(review.harnessScope, 'harnessScope');
  gates.push(
    gate('local_harness_review_only', review.harnessScope.mode === 'local_harness_review_only', 'harness scope must be review-only', review.harnessScope),
    gate('private_runtime_only', review.harnessScope.allowedLocation === 'cortex-abv-private-runtime-only', 'harness must stay in private runtime', review.harnessScope),
    gate('local_library_only', review.harnessScope.localLibraryOnly === true, 'harness must be local library only', review.harnessScope),
    gate('no_implementation_approval', review.harnessScope.implementationApproved === false, 'harness implementation must not be approved here', review.harnessScope),
    gate('no_wiring_approval', review.harnessScope.wiringApproved === false, 'runtime wiring must not be approved here', review.harnessScope),
    gate('no_endpoint', review.harnessScope.endpointAllowed === false, 'endpoint must remain forbidden', review.harnessScope),
    gate('no_scheduler', review.harnessScope.schedulerAllowed === false, 'scheduler must remain forbidden', review.harnessScope),
    gate('no_network_calls', review.harnessScope.networkCallsAllowed === false, 'network calls must remain forbidden', review.harnessScope),
    gate('no_llm_calls', review.harnessScope.llmCallsAllowed === false, 'LLM calls must remain forbidden', review.harnessScope),
    gate('no_public_action', review.harnessScope.publicActionAuthorityAllowed === false, 'public action authority must remain forbidden', review.harnessScope),
    gate('no_source_mutation', review.harnessScope.sourceMutationAllowed === false, 'source mutation must remain forbidden', review.harnessScope),
    gate('no_artifact_mutation', review.harnessScope.artifactMutationAllowed === false, 'artifact mutation must remain forbidden', review.harnessScope),
    gate('no_external_writes', review.harnessScope.writesOutsideReceiptAllowed === false, 'external writes must remain forbidden', review.harnessScope),
  );

  requireObject(review.requiredInterface, 'requiredInterface');
  requireArray(review.requiredInterface.functions, 'requiredInterface.functions');
  const allowedFunctions = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  gates.push(
    gate('required_functions', review.requiredInterface.functions.every((fn) => allowedFunctions.has(fn)), 'required functions must match Stage 4i module interface', review.requiredInterface),
    gate('stage4h_artifact_only', review.requiredInterface.mustReadStage4hArtifactOnly === true, 'harness must read Stage 4h artifact only', review.requiredInterface),
    gate('artifact_digest_required', review.requiredInterface.mustVerifyArtifactDigest === true, 'artifact digest verification is required', review.requiredInterface),
    gate('source_digest_required', review.requiredInterface.mustVerifySourceDigest === true, 'source digest verification is required', review.requiredInterface),
    gate('stage4i_digest_required', review.requiredInterface.mustVerifyStage4iReceiptDigest === true, 'Stage 4i receipt digest verification is required', review.requiredInterface),
    gate('tenant_scope_required', review.requiredInterface.mustEnforceTenantScope === true, 'tenant scope is required', review.requiredInterface),
    gate('hard_threshold_required', review.requiredInterface.mustEnforceHardThreshold === true, 'hard threshold is required', review.requiredInterface),
    gate('candidates_only', review.requiredInterface.mustReturnCandidatesOnly === true, 'harness must return candidates only', review.requiredInterface),
    gate('evidence_refs_required', review.requiredInterface.mustCarryEvidenceRefs === true, 'evidence refs are required', review.requiredInterface),
  );

  requireObject(review.dryRunCommandPolicy, 'dryRunCommandPolicy');
  requireArray(review.dryRunCommandPolicy.allowedCommands, 'dryRunCommandPolicy.allowedCommands');
  const commandAllowlist = new Set(['load_index_artifact_poc_dry_run', 'query_candidates_poc_dry_run', 'verify_claim_evidence_poc_dry_run']);
  gates.push(
    gate('bounded_dry_run_commands', review.dryRunCommandPolicy.allowedCommands.every((command) => commandAllowlist.has(command)), 'dry-run commands must be explicitly allowlisted', review.dryRunCommandPolicy),
    gate('dry_run_suffix', review.dryRunCommandPolicy.allowedCommands.every((command) => command.endsWith(review.dryRunCommandPolicy.commandsMustEndWith)), 'dry-run commands must use required suffix', review.dryRunCommandPolicy),
    gate('no_shell_access', review.dryRunCommandPolicy.shellAccessAllowed === false, 'shell access is forbidden for future harness command surface', review.dryRunCommandPolicy),
    gate('no_dependency_install', review.dryRunCommandPolicy.installDependenciesAllowed === false, 'dependency install is forbidden for future harness command surface', review.dryRunCommandPolicy),
    gate('no_source_pack_mutation', review.dryRunCommandPolicy.mutateSourcePacksAllowed === false, 'source-pack mutation is forbidden', review.dryRunCommandPolicy),
    gate('no_index_artifact_mutation', review.dryRunCommandPolicy.mutateIndexArtifactAllowed === false, 'index artifact mutation is forbidden', review.dryRunCommandPolicy),
  );

  requireObject(review.reviewGate, 'reviewGate');
  gates.push(
    gate('target_eligibility', review.reviewGate.targetEligibility === 'eligible_for_controlled_runtime_module_harness_dry_run_review', 'target eligibility must be harness dry-run review', review.reviewGate),
    gate('separate_harness_approval', review.reviewGate.harnessImplementationRequiresSeparateApproval === true, 'harness implementation requires separate approval', review.reviewGate),
    gate('separate_wiring_approval', review.reviewGate.runtimeWiringRequiresSeparateApproval === true, 'runtime wiring requires separate approval', review.reviewGate),
    gate('owner_review_required', review.reviewGate.ownerReviewRequired === true, 'owner review is required', review.reviewGate),
  );

  requireArray(review.rejectionCases, 'rejectionCases');
  const requiredRejections = [
    'controlled_module_design_receipt_not_eligible',
    'missing_controlled_module_design_receipt_digest',
    'harness_implementation_requested',
    'runtime_wiring_requested',
    'endpoint_requested',
    'scheduler_requested',
    'network_calls_requested',
    'llm_calls_requested',
    'public_action_authority_requested',
    'source_mutation_requested',
    'artifact_mutation_requested',
    'external_writes_requested',
    'non_dry_run_command',
    'missing_digest_verification',
    'missing_tenant_scope',
    'missing_claim_evidence',
  ];
  gates.push(gate('rejection_cases_complete', requiredRejections.every((item) => review.rejectionCases.includes(item)), 'required rejection cases must be listed', { requiredRejections, rejectionCases: review.rejectionCases }));

  requireObject(review.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    pocReviewOnly: true,
    harnessImplementationApproved: false,
    runtimeWiringApproved: false,
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

function validateDesignReceipt(designReceipt, review) {
  const gates = [
    gate('kind', designReceipt.kind === review.prerequisites.requiredControlledModuleDesignReceiptKind, 'Stage 4i design receipt kind must match prerequisite', { kind: designReceipt.kind }),
    gate('status', designReceipt.status === review.prerequisites.requiredControlledModuleDesignStatus, 'Stage 4i design receipt status must match prerequisite', { status: designReceipt.status }),
    gate('eligibility', designReceipt.eligibility === review.prerequisites.requiredControlledModuleDesignEligibility, 'Stage 4i design receipt eligibility must match prerequisite', { eligibility: designReceipt.eligibility }),
    gate('no_blockers', Array.isArray(designReceipt.blockers) && designReceipt.blockers.length === 0, 'Stage 4i design receipt must have no blockers', { blockers: designReceipt.blockers }),
    gate('design_digest_present', typeof designReceipt.digests?.designDigest === 'string' && designReceipt.digests.designDigest.length === 64, 'Stage 4i design digest must be present', designReceipt.digests),
    gate('dry_run_receipt_digest_present', typeof designReceipt.digests?.dryRunReceiptDigest === 'string' && designReceipt.digests.dryRunReceiptDigest.length === 64, 'Stage 4h receipt digest must be present inside Stage 4i receipt', designReceipt.digests),
    gate('module_contract_present', designReceipt.moduleContract?.moduleType === 'local_library_only' && designReceipt.moduleContract?.allowedLocation === 'cortex-abv-private-runtime-only', 'Stage 4i module contract must be local private runtime library', designReceipt.moduleContract),
    gate('design_no_implementation', designReceipt.governance?.implementationApproved === false, 'Stage 4i receipt must not approve implementation', designReceipt.governance),
    gate('design_no_wiring', designReceipt.governance?.wiringApproved === false, 'Stage 4i receipt must not approve wiring', designReceipt.governance),
    gate('design_no_runtime', designReceipt.governance?.runtimeIntegration === false, 'Stage 4i receipt must not approve runtime integration', designReceipt.governance),
    gate('design_no_public_action', designReceipt.governance?.publicActionAuthority === false, 'Stage 4i receipt must not approve public actions', designReceipt.governance),
  ];
  return gates;
}

export function runVectorRuntimeControlledModulePocReviewGate({ reviewPath, designReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(reviewPath)) throw new Error(`controlled module POC review file not found: ${reviewPath}`);
  if (!existsSync(designReceiptPath)) throw new Error(`controlled module design receipt file not found: ${designReceiptPath}`);
  const review = readJson(reviewPath);
  const designReceipt = readJson(designReceiptPath);
  const gates = {
    review: validateReviewShape(review),
    designReceipt: validateDesignReceipt(designReceipt, review),
  };
  const blockers = Object.entries(gates)
    .flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const reviewDigest = sha256(review);
  const designReceiptDigest = sha256(designReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeControlledModulePocReviewReceipt',
    version: 'v1',
    authority: 'plan_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_controlled_runtime_module_harness_dry_run_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'controlled_runtime_module_poc_review',
    engine: review.engine,
    digests: {
      reviewDigest,
      controlledModuleDesignReceiptDigest: designReceiptDigest,
      stage4iDesignDigest: designReceipt.digests?.designDigest,
      stage4hDryRunReceiptDigest: designReceipt.digests?.dryRunReceiptDigest,
    },
    minimumHarnessScope: {
      futureHarnessPath: review.harnessScope?.futureHarnessPath,
      futureHarnessTestPath: review.harnessScope?.futureHarnessTestPath,
      requiredInterface: review.requiredInterface,
      allowedDryRunCommands: review.dryRunCommandPolicy?.allowedCommands,
    },
    governance: {
      readOnly: true,
      proposalOnly: true,
      pocReviewOnly: true,
      harnessImplementationApproved: false,
      runtimeWiringApproved: false,
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
      controlledModuleDesignReceipt: {
        path: designReceiptPath,
        kind: designReceipt.kind,
        status: designReceipt.status,
        eligibility: designReceipt.eligibility,
        digest: designReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'controlled_module_poc_review_contract_plus_stage4i_design_receipt',
      reason: eligible
        ? 'Minimum local harness POC scope can be reviewed because it references the Stage 4i design receipt and preserves local review-only governance.'
        : 'Controlled module POC review scope or Stage 4i design receipt failed review gates.',
      nextAllowedStep: eligible ? 'controlled_runtime_module_harness_dry_run_review' : 'repair_controlled_module_poc_review_or_stage4i_design',
    },
    review: {
      pendingReview: eligible,
      approvalMeaning: 'Approve only review of a future local harness dry-run. This does not approve harness implementation, runtime wiring, endpoints, schedulers, network calls, model calls, source or artifact mutation, external writes, public actions or publication.',
      requiredFields: ['eligibility', 'digests', 'minimumHarnessScope', 'governance', 'sources', 'gates', 'blockers', 'decisionTrace'],
    },
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimeControlledModulePocReviewGate({
    reviewPath: option('--review') || path.resolve(process.cwd(), 'config/vector-runtime-controlled-module-poc-review.v1.json'),
    designReceiptPath: option('--design-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-controlled-module-design-receipt.v1.json'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-controlled-module-poc-review-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime controlled module POC review gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime controlled module POC review gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
