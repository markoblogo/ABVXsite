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

function validateDesign(design) {
  requireObject(design, 'design');
  const gates = [
    gate('kind', design.kind === 'CortexABVVectorRuntimeControlledWiringDesign', 'design kind must match', { kind: design.kind }),
    gate('version', design.version === 'v1', 'design version must be v1', { version: design.version }),
    gate('authority', design.authority === 'design_review_only', 'design authority must be design_review_only', { authority: design.authority }),
    gate('engine', design.engine === 'turbovec', 'design engine must be turbovec', { engine: design.engine }),
  ];

  requireObject(design.prerequisites, 'prerequisites');
  gates.push(
    gate('harness_prerequisite', design.prerequisites.requiredHarnessDryRunEligibility === 'eligible_for_controlled_runtime_wiring_design_review', 'design must require eligible Stage 4k harness dry-run receipt', design.prerequisites),
    gate('harness_digest_required', design.prerequisites.requiresHarnessDryRunReceiptDigest === true, 'Stage 4k receipt digest is required', design.prerequisites),
  );

  requireObject(design.wiringBoundary, 'wiringBoundary');
  gates.push(
    gate('private_runtime_only', design.wiringBoundary.allowedLocation === 'cortex-abv-private-runtime-only', 'wiring must stay private-runtime only', design.wiringBoundary),
    gate('local_binding_only', design.wiringBoundary.wiringMode === 'in_process_local_library_binding_only', 'wiring mode must be in-process local library binding only', design.wiringBoundary),
    gate('no_activation', design.wiringBoundary.activationApproved === false, 'runtime activation must not be approved here', design.wiringBoundary),
    gate('no_endpoint', design.wiringBoundary.endpointAllowed === false, 'endpoint must remain forbidden', design.wiringBoundary),
    gate('no_scheduler', design.wiringBoundary.schedulerAllowed === false, 'scheduler must remain forbidden', design.wiringBoundary),
    gate('no_network_calls', design.wiringBoundary.networkCallsAllowed === false, 'network calls must remain forbidden', design.wiringBoundary),
    gate('no_llm_calls', design.wiringBoundary.llmCallsAllowed === false, 'LLM calls must remain forbidden', design.wiringBoundary),
    gate('no_public_action', design.wiringBoundary.publicActionAuthorityAllowed === false, 'public action authority must remain forbidden', design.wiringBoundary),
    gate('no_external_writes', design.wiringBoundary.writesOutsideReceiptsAllowed === false, 'external writes must remain forbidden', design.wiringBoundary),
    gate('no_artifact_mutation', design.wiringBoundary.artifactMutationAllowed === false, 'artifact mutation must remain forbidden', design.wiringBoundary),
    gate('no_source_mutation', design.wiringBoundary.sourceMutationAllowed === false, 'source mutation must remain forbidden', design.wiringBoundary),
    gate('no_cross_tenant', design.wiringBoundary.crossTenantQueriesAllowed === false, 'cross-tenant queries must remain forbidden', design.wiringBoundary),
  );

  requireObject(design.bindingContract, 'bindingContract');
  requireArray(design.bindingContract.allowedBindings, 'bindingContract.allowedBindings');
  const allowedBindings = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  gates.push(
    gate('module_path', design.bindingContract.modulePath === 'src/vector-runtime-controlled-module-harness.mjs', 'binding module path must match controlled harness', design.bindingContract),
    gate('allowed_bindings', design.bindingContract.allowedBindings.every((binding) => allowedBindings.has(binding)), 'bindings must be explicit controlled harness functions', design.bindingContract),
    gate('stage4k_digest_required', design.bindingContract.requiresStage4kReceiptDigest === true, 'Stage 4k receipt digest is required', design.bindingContract),
    gate('stage4h_artifact_digest_required', design.bindingContract.requiresStage4hArtifactDigest === true, 'Stage 4h artifact digest is required', design.bindingContract),
    gate('tenant_scope_required', design.bindingContract.requiresTenantScope === true, 'tenant scope is required', design.bindingContract),
    gate('hard_threshold_required', design.bindingContract.requiresHardThreshold === true, 'hard threshold is required', design.bindingContract),
    gate('evidence_refs_required', design.bindingContract.requiresEvidenceRefs === true, 'evidence refs are required', design.bindingContract),
    gate('candidates_only', design.bindingContract.returnsCandidatesOnly === true, 'binding must return candidates only', design.bindingContract),
    gate('no_answer_generation', design.bindingContract.answerGeneration === false, 'answer generation must remain forbidden', design.bindingContract),
  );

  requireObject(design.reviewGate, 'reviewGate');
  gates.push(
    gate('target_eligibility', design.reviewGate.targetEligibility === 'eligible_for_controlled_runtime_wiring_poc_review', 'target eligibility must be controlled runtime wiring POC review', design.reviewGate),
    gate('separate_wiring_approval', design.reviewGate.wiringImplementationRequiresSeparateApproval === true, 'wiring implementation requires separate approval', design.reviewGate),
    gate('separate_activation_approval', design.reviewGate.runtimeActivationRequiresSeparateApproval === true, 'runtime activation requires separate approval', design.reviewGate),
    gate('owner_review_required', design.reviewGate.ownerReviewRequired === true, 'owner review is required', design.reviewGate),
  );

  requireArray(design.rejectionCases, 'rejectionCases');
  const requiredRejections = [
    'harness_dry_run_receipt_not_eligible',
    'missing_harness_dry_run_receipt_digest',
    'wiring_activation_requested',
    'endpoint_requested',
    'scheduler_requested',
    'network_calls_requested',
    'llm_calls_requested',
    'public_action_authority_requested',
    'external_writes_requested',
    'artifact_mutation_requested',
    'source_mutation_requested',
    'cross_tenant_queries_requested',
    'missing_tenant_scope',
    'missing_hard_threshold',
    'missing_claim_evidence',
    'answer_generation_requested',
  ];
  gates.push(gate('rejection_cases_complete', requiredRejections.every((item) => design.rejectionCases.includes(item)), 'required rejection cases must be listed', { requiredRejections, rejectionCases: design.rejectionCases }));

  requireObject(design.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    designReviewOnly: true,
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
    gates.push(gate(`governance_${key}`, design.governance[key] === expected, `governance.${key} must be ${expected}`, design.governance));
  }

  return gates;
}

function validateHarnessReceipt(harnessReceipt, design) {
  return [
    gate('kind', harnessReceipt.kind === design.prerequisites.requiredHarnessDryRunReceiptKind, 'Stage 4k receipt kind must match prerequisite', { kind: harnessReceipt.kind }),
    gate('status', harnessReceipt.status === design.prerequisites.requiredHarnessDryRunStatus, 'Stage 4k receipt status must be passed', { status: harnessReceipt.status }),
    gate('eligibility', harnessReceipt.eligibility === design.prerequisites.requiredHarnessDryRunEligibility, 'Stage 4k receipt eligibility must match prerequisite', { eligibility: harnessReceipt.eligibility }),
    gate('no_blockers', Array.isArray(harnessReceipt.blockers) && harnessReceipt.blockers.length === 0, 'Stage 4k receipt must have no blockers', { blockers: harnessReceipt.blockers }),
    gate('stage4k_digest_inputs', typeof harnessReceipt.digests?.receiptLinkageDigest === 'string' && harnessReceipt.digests.receiptLinkageDigest.length === 64, 'Stage 4k linkage digest must be present', harnessReceipt.digests),
    gate('artifact_digest_present', typeof harnessReceipt.digests?.stage4hIndexDigest === 'string' && harnessReceipt.digests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', harnessReceipt.digests),
    gate('source_digest_present', typeof harnessReceipt.digests?.stage4hSourceDigest === 'string' && harnessReceipt.digests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', harnessReceipt.digests),
    gate('tenant_scoped_results', Array.isArray(harnessReceipt.queryResults) && harnessReceipt.queryResults.every((result) => result.status === 'passed' && result.decisionTrace?.tenantScope === result.tenant), 'Stage 4k query results must be tenant-scoped and passed', { queryResults: harnessReceipt.queryResults?.map((result) => ({ id: result.id, status: result.status, tenant: result.tenant, tenantScope: result.decisionTrace?.tenantScope })) }),
    gate('evidence_verified', Array.isArray(harnessReceipt.queryResults) && harnessReceipt.queryResults.every((result) => result.evidenceVerification?.passed === true), 'Stage 4k evidence verification must pass', { queryResults: harnessReceipt.queryResults?.map((result) => ({ id: result.id, evidencePassed: result.evidenceVerification?.passed })) }),
    gate('no_runtime_integration', harnessReceipt.governance?.runtimeIntegration === false, 'Stage 4k receipt must not approve runtime integration', harnessReceipt.governance),
    gate('no_endpoint', harnessReceipt.governance?.endpoint === false, 'Stage 4k receipt must not approve endpoints', harnessReceipt.governance),
    gate('no_network', harnessReceipt.governance?.networkCalls === false, 'Stage 4k receipt must not approve network calls', harnessReceipt.governance),
    gate('no_llm', harnessReceipt.governance?.llmCalls === false, 'Stage 4k receipt must not approve LLM calls', harnessReceipt.governance),
    gate('no_public_action', harnessReceipt.governance?.publicActionAuthority === false, 'Stage 4k receipt must not approve public actions', harnessReceipt.governance),
  ];
}

export function runVectorRuntimeControlledWiringDesignGate({ designPath, harnessReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(designPath)) throw new Error(`controlled wiring design file not found: ${designPath}`);
  if (!existsSync(harnessReceiptPath)) throw new Error(`controlled harness dry-run receipt file not found: ${harnessReceiptPath}`);
  const design = readJson(designPath);
  const harnessReceipt = readJson(harnessReceiptPath);
  const gates = {
    design: validateDesign(design),
    harnessReceipt: validateHarnessReceipt(harnessReceipt, design),
  };
  const blockers = Object.entries(gates)
    .flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const designDigest = sha256(design);
  const harnessReceiptDigest = sha256(harnessReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeControlledWiringDesignReceipt',
    version: 'v1',
    authority: 'design_review_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_controlled_runtime_wiring_poc_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'controlled_runtime_wiring_design_review',
    engine: design.engine,
    digests: {
      designDigest,
      harnessDryRunReceiptDigest: harnessReceiptDigest,
      stage4kReceiptLinkageDigest: harnessReceipt.digests?.receiptLinkageDigest,
      stage4hIndexDigest: harnessReceipt.digests?.stage4hIndexDigest,
    },
    wiringContract: {
      wiringBoundary: design.wiringBoundary,
      bindingContract: design.bindingContract,
    },
    governance: {
      readOnly: true,
      proposalOnly: true,
      designReviewOnly: true,
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
      design: { path: designPath, kind: design.kind, digest: designDigest },
      harnessDryRunReceipt: {
        path: harnessReceiptPath,
        kind: harnessReceipt.kind,
        status: harnessReceipt.status,
        eligibility: harnessReceipt.eligibility,
        digest: harnessReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'controlled_wiring_design_contract_plus_stage4k_harness_receipt',
      reason: eligible
        ? 'Controlled wiring design can be reviewed because Stage 4k harness dry-run passed and wiring remains local in-process design-only.'
        : 'Controlled wiring design or Stage 4k harness receipt failed review gates.',
      nextAllowedStep: eligible ? 'controlled_runtime_wiring_poc_review' : 'repair_controlled_wiring_design_or_stage4k_receipt',
    },
    review: {
      pendingReview: eligible,
      approvalMeaning: 'Approve only review of a future local wiring POC. This does not approve wiring implementation, runtime activation, endpoints, schedulers, network calls, model calls, external writes, public actions or publication.',
      requiredFields: ['eligibility', 'digests', 'wiringContract', 'governance', 'sources', 'gates', 'blockers', 'decisionTrace'],
    },
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimeControlledWiringDesignGate({
    designPath: option('--design') || path.resolve(process.cwd(), 'config/vector-runtime-controlled-wiring-design.v1.json'),
    harnessReceiptPath: option('--harness-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-controlled-module-harness-dry-run-receipt.v1.json'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-controlled-wiring-design-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime controlled wiring design gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime controlled wiring design gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
