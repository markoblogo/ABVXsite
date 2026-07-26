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
    gate('kind', review.kind === 'CortexABVVectorRuntimeControlledWiringReview', 'review kind must match', { kind: review.kind }),
    gate('version', review.version === 'v1', 'review version must be v1', { version: review.version }),
    gate('authority', review.authority === 'review_only', 'review authority must be review_only', { authority: review.authority }),
    gate('engine', review.engine === 'turbovec', 'review engine must be turbovec', { engine: review.engine }),
  ];

  requireObject(review.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4n_prerequisite', review.prerequisites.requiredPocDryRunEligibility === 'eligible_for_controlled_runtime_wiring_review', 'review must require eligible Stage 4n POC dry-run receipt', review.prerequisites),
    gate('stage4n_digest_required', review.prerequisites.requiresPocDryRunReceiptDigest === true, 'Stage 4n receipt digest is required', review.prerequisites),
  );

  requireObject(review.wiringDefinition, 'wiringDefinition');
  requireArray(review.wiringDefinition.allowedBindings, 'wiringDefinition.allowedBindings');
  const allowedBindings = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  gates.push(
    gate('definition_meaning', review.wiringDefinition.meaning === 'reviewed_internal_local_binding_boundary', 'wiring meaning must be reviewed internal local binding boundary', review.wiringDefinition),
    gate('private_runtime_only', review.wiringDefinition.allowedLocation === 'cortex-abv-private-runtime-only', 'wiring must stay private-runtime only', review.wiringDefinition),
    gate('local_binding_only', review.wiringDefinition.bindingMode === 'in_process_local_library_binding_only', 'wiring must stay local in-process only', review.wiringDefinition),
    gate('module_path', review.wiringDefinition.allowedModulePath === 'src/vector-runtime-controlled-module-harness.mjs', 'wiring module path must match controlled harness', review.wiringDefinition),
    gate('allowed_bindings', review.wiringDefinition.allowedBindings.every((binding) => allowedBindings.has(binding)), 'wiring bindings must be allowlisted harness functions', review.wiringDefinition),
    gate('candidates_only', review.wiringDefinition.returnsCandidatesOnly === true, 'wiring must return candidates only', review.wiringDefinition),
    gate('no_answer_generation', review.wiringDefinition.answerGenerationAllowed === false, 'answer generation must remain forbidden', review.wiringDefinition),
    gate('tenant_scope_required', review.wiringDefinition.tenantScopeRequired === true, 'tenant scope is required', review.wiringDefinition),
    gate('hard_threshold_required', review.wiringDefinition.hardThresholdRequired === true, 'hard threshold is required', review.wiringDefinition),
    gate('evidence_refs_required', review.wiringDefinition.evidenceRefsRequired === true, 'evidence refs are required', review.wiringDefinition),
    gate('receipt_only_audit', review.wiringDefinition.receiptOnlyAuditRequired === true, 'receipt-only audit is required', review.wiringDefinition),
    gate('no_runtime_activation_in_definition', review.wiringDefinition.runtimeActivationApproved === false, 'wiring review must not approve runtime activation', review.wiringDefinition),
  );

  requireObject(review.activationBoundary, 'activationBoundary');
  gates.push(
    gate('activation_review_required', review.activationBoundary.activationReviewRequired === true, 'activation review must be separate and required', review.activationBoundary),
    gate('target_eligibility', review.activationBoundary.targetEligibility === 'eligible_for_runtime_activation_review', 'target eligibility must be runtime activation review', review.activationBoundary),
    gate('no_activation_here', review.activationBoundary.runtimeActivationAllowedHere === false, 'runtime activation must be forbidden here', review.activationBoundary),
    gate('no_endpoint', review.activationBoundary.endpointAllowed === false, 'endpoint must remain forbidden', review.activationBoundary),
    gate('no_scheduler', review.activationBoundary.schedulerAllowed === false, 'scheduler must remain forbidden', review.activationBoundary),
    gate('no_network', review.activationBoundary.networkCallsAllowed === false, 'network calls must remain forbidden', review.activationBoundary),
    gate('no_llm', review.activationBoundary.llmCallsAllowed === false, 'LLM calls must remain forbidden', review.activationBoundary),
    gate('no_public_action', review.activationBoundary.publicActionAuthorityAllowed === false, 'public action authority must remain forbidden', review.activationBoundary),
    gate('no_source_mutation', review.activationBoundary.sourceMutationAllowed === false, 'source mutation must remain forbidden', review.activationBoundary),
    gate('no_artifact_mutation', review.activationBoundary.artifactMutationAllowed === false, 'artifact mutation must remain forbidden', review.activationBoundary),
    gate('no_external_writes', review.activationBoundary.writesOutsideReceiptAllowed === false, 'external writes must remain forbidden', review.activationBoundary),
    gate('no_cross_tenant', review.activationBoundary.crossTenantQueriesAllowed === false, 'cross-tenant queries must remain forbidden', review.activationBoundary),
    gate('no_baseline_advancement', review.activationBoundary.baselineAdvancementAllowed === false, 'baseline advancement must remain forbidden', review.activationBoundary),
    gate('owner_review_required', review.activationBoundary.ownerReviewRequired === true, 'owner review is required', review.activationBoundary),
  );

  requireObject(review.requiredEvidence, 'requiredEvidence');
  for (const [key, expected] of Object.entries({
    requiresStage4nReceiptDigest: true,
    requiresStage4mReceiptDigest: true,
    requiresStage4lReceiptDigest: true,
    requiresStage4kReceiptDigest: true,
    requiresStage4hArtifactDigest: true,
    requiresStage4hSourceDigest: true,
    requiresPassedQueryResults: true,
    requiresEvidenceVerification: true,
    requiresRollbackNotes: true,
  })) {
    gates.push(gate(`evidence_${key}`, review.requiredEvidence[key] === expected, `requiredEvidence.${key} must be ${expected}`, review.requiredEvidence));
  }

  requireArray(review.rejectionCases, 'rejectionCases');
  const requiredRejections = [
    'controlled_wiring_poc_dry_run_not_eligible',
    'missing_stage4n_receipt_digest',
    'missing_stage4m_receipt_digest',
    'missing_stage4l_receipt_digest',
    'missing_stage4k_receipt_digest',
    'missing_stage4h_artifact_digest',
    'missing_stage4h_source_digest',
    'failed_query_result',
    'missing_evidence_refs',
    'missing_rollback_notes',
    'runtime_activation_requested',
    'endpoint_requested',
    'scheduler_requested',
    'network_calls_requested',
    'llm_calls_requested',
    'public_action_authority_requested',
    'source_mutation_requested',
    'artifact_mutation_requested',
    'external_writes_requested',
    'cross_tenant_queries_requested',
    'answer_generation_requested',
    'baseline_advancement_requested',
  ];
  gates.push(gate('rejection_cases_complete', requiredRejections.every((item) => review.rejectionCases.includes(item)), 'required rejection cases must be listed', { requiredRejections, rejectionCases: review.rejectionCases }));

  requireObject(review.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    wiringReviewOnly: true,
    wiringReviewed: true,
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

function validateStage4nReceipt(stage4nReceipt, review) {
  return [
    gate('kind', stage4nReceipt.kind === review.prerequisites.requiredPocDryRunReceiptKind, 'Stage 4n receipt kind must match prerequisite', { kind: stage4nReceipt.kind }),
    gate('status', stage4nReceipt.status === review.prerequisites.requiredPocDryRunStatus, 'Stage 4n receipt status must be passed', { status: stage4nReceipt.status }),
    gate('eligibility', stage4nReceipt.eligibility === review.prerequisites.requiredPocDryRunEligibility, 'Stage 4n receipt eligibility must match prerequisite', { eligibility: stage4nReceipt.eligibility }),
    gate('no_blockers', Array.isArray(stage4nReceipt.blockers) && stage4nReceipt.blockers.length === 0, 'Stage 4n receipt must have no blockers', { blockers: stage4nReceipt.blockers }),
    gate('stage4m_digest_present', typeof stage4nReceipt.digests?.stage4mReceiptDigest === 'string' && stage4nReceipt.digests.stage4mReceiptDigest.length === 64, 'Stage 4m digest must be present', stage4nReceipt.digests),
    gate('stage4l_digest_present', typeof stage4nReceipt.digests?.stage4lReceiptDigest === 'string' && stage4nReceipt.digests.stage4lReceiptDigest.length === 64, 'Stage 4l digest must be present', stage4nReceipt.digests),
    gate('stage4k_digest_present', typeof stage4nReceipt.digests?.stage4kReceiptDigest === 'string' && stage4nReceipt.digests.stage4kReceiptDigest.length === 64, 'Stage 4k digest must be present', stage4nReceipt.digests),
    gate('stage4h_index_digest_present', typeof stage4nReceipt.digests?.stage4hIndexDigest === 'string' && stage4nReceipt.digests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', stage4nReceipt.digests),
    gate('stage4h_source_digest_present', typeof stage4nReceipt.digests?.stage4hSourceDigest === 'string' && stage4nReceipt.digests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', stage4nReceipt.digests),
    gate('binding_local', stage4nReceipt.binding?.mode === review.wiringDefinition.bindingMode, 'Stage 4n binding mode must match wiring definition', stage4nReceipt.binding),
    gate('binding_not_activated', stage4nReceipt.binding?.activated === false, 'Stage 4n binding must not be activated', stage4nReceipt.binding),
    gate('queries_passed', Array.isArray(stage4nReceipt.queryResults) && stage4nReceipt.queryResults.length > 0 && stage4nReceipt.queryResults.every((result) => result.status === 'passed'), 'Stage 4n query results must pass', { queryResults: stage4nReceipt.queryResults?.map((result) => ({ id: result.id, status: result.status })) }),
    gate('tenant_scoped', Array.isArray(stage4nReceipt.queryResults) && stage4nReceipt.queryResults.every((result) => result.decisionTrace?.tenantScope === result.tenant), 'Stage 4n query results must be tenant-scoped', { queryResults: stage4nReceipt.queryResults?.map((result) => ({ id: result.id, tenant: result.tenant, tenantScope: result.decisionTrace?.tenantScope })) }),
    gate('candidates_only', Array.isArray(stage4nReceipt.queryResults) && stage4nReceipt.queryResults.every((result) => result.decisionTrace?.candidatesOnly === true && result.decisionTrace?.answerGeneration === false), 'Stage 4n must return candidates only with no answer generation', { queryResults: stage4nReceipt.queryResults?.map((result) => ({ id: result.id, candidatesOnly: result.decisionTrace?.candidatesOnly, answerGeneration: result.decisionTrace?.answerGeneration })) }),
    gate('evidence_verified', Array.isArray(stage4nReceipt.queryResults) && stage4nReceipt.queryResults.every((result) => result.evidenceVerification?.passed === true), 'Stage 4n evidence verification must pass', { queryResults: stage4nReceipt.queryResults?.map((result) => ({ id: result.id, evidencePassed: result.evidenceVerification?.passed })) }),
    gate('rollback_notes_present', Array.isArray(stage4nReceipt.rollbackNotes) && stage4nReceipt.rollbackNotes.length > 0, 'Stage 4n rollback notes must be present', { rollbackNotes: stage4nReceipt.rollbackNotes }),
    gate('no_runtime_activation', stage4nReceipt.governance?.runtimeActivation === false, 'Stage 4n receipt must not activate runtime', stage4nReceipt.governance),
    gate('no_runtime_integration', stage4nReceipt.governance?.runtimeIntegration === false, 'Stage 4n receipt must not approve runtime integration', stage4nReceipt.governance),
    gate('no_endpoint', stage4nReceipt.governance?.endpoint === false, 'Stage 4n receipt must not approve endpoint', stage4nReceipt.governance),
    gate('no_network', stage4nReceipt.governance?.networkCalls === false, 'Stage 4n receipt must not approve network calls', stage4nReceipt.governance),
    gate('no_llm', stage4nReceipt.governance?.llmCalls === false, 'Stage 4n receipt must not approve LLM calls', stage4nReceipt.governance),
    gate('no_public_action', stage4nReceipt.governance?.publicActionAuthority === false, 'Stage 4n receipt must not approve public actions', stage4nReceipt.governance),
  ];
}

export function runVectorRuntimeControlledWiringReviewGate({ reviewPath, stage4nReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(reviewPath)) throw new Error(`controlled wiring review file not found: ${reviewPath}`);
  if (!existsSync(stage4nReceiptPath)) throw new Error(`controlled wiring POC dry-run receipt file not found: ${stage4nReceiptPath}`);
  const review = readJson(reviewPath);
  const stage4nReceipt = readJson(stage4nReceiptPath);
  const gates = {
    review: validateReview(review),
    stage4nReceipt: validateStage4nReceipt(stage4nReceipt, review),
  };
  const blockers = Object.entries(gates)
    .flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const reviewDigest = sha256(review);
  const stage4nReceiptDigest = sha256(stage4nReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeControlledWiringReviewReceipt',
    version: 'v1',
    authority: 'review_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_runtime_activation_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'controlled_runtime_wiring_review',
    engine: review.engine,
    reviewDigest,
    stage4nReceiptDigest,
    prerequisiteDigests: {
      stage4mReceiptDigest: stage4nReceipt.digests?.stage4mReceiptDigest,
      stage4lReceiptDigest: stage4nReceipt.digests?.stage4lReceiptDigest,
      stage4kReceiptDigest: stage4nReceipt.digests?.stage4kReceiptDigest,
      stage4hIndexDigest: stage4nReceipt.digests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4nReceipt.digests?.stage4hSourceDigest,
      stage4nReceiptLinkageDigest: stage4nReceipt.digests?.receiptLinkageDigest,
    },
    wiringDefinition: {
      ...review.wiringDefinition,
      runtimeActivationApproved: false,
    },
    activationBoundary: review.activationBoundary,
    governance: {
      readOnly: true,
      proposalOnly: true,
      wiringReviewOnly: true,
      wiringReviewed: true,
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
      controlledWiringPocDryRunReceipt: {
        path: stage4nReceiptPath,
        kind: stage4nReceipt.kind,
        status: stage4nReceipt.status,
        eligibility: stage4nReceipt.eligibility,
        digest: stage4nReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'controlled_wiring_review_contract_plus_stage4n_poc_dry_run_receipt',
      reason: eligible
        ? 'Controlled runtime wiring can advance to activation review because Stage 4n passed local binding, digest, tenant, evidence and governance gates without activation.'
        : 'Controlled runtime wiring review or Stage 4n dry-run receipt failed review gates.',
      nextAllowedStep: eligible ? 'runtime_activation_review_gate' : 'repair_controlled_wiring_review_or_stage4n_receipt',
    },
    review: {
      pendingReview: eligible,
      approvalMeaning: 'Approve only review of a future runtime activation gate. This does not activate runtime wiring, expose endpoints, start schedulers, call models, use network, mutate source/index artifacts, write externally, create public actions or publish.',
      requiredFields: ['eligibility', 'wiringDefinition', 'activationBoundary', 'prerequisiteDigests', 'governance', 'sources', 'gates', 'blockers', 'decisionTrace'],
    },
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimeControlledWiringReviewGate({
    reviewPath: option('--review') || path.resolve(process.cwd(), 'config/vector-runtime-controlled-wiring-review.v1.json'),
    stage4nReceiptPath: option('--stage4n-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-controlled-wiring-poc-dry-run-receipt.v1.json'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-controlled-wiring-review-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime controlled wiring review gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime controlled wiring review gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
