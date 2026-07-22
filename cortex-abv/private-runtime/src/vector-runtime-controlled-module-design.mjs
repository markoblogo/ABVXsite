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

function validateDesignShape(design) {
  requireObject(design, 'design');
  const gates = [
    gate('kind', design.kind === 'CortexABVVectorRuntimeControlledModuleDesign', 'design kind must match', { kind: design.kind }),
    gate('version', design.version === 'v1', 'design version must be v1', { version: design.version }),
    gate('authority', design.authority === 'design_review_only', 'design authority must be design_review_only', { authority: design.authority }),
    gate('engine', design.engine === 'turbovec', 'design engine must be turbovec', { engine: design.engine }),
  ];

  requireObject(design.prerequisites, 'prerequisites');
  gates.push(
    gate('dry_run_prerequisite', design.prerequisites.requiredDryRunEligibility === 'eligible_for_controlled_runtime_module_review', 'design must require eligible Stage 4h dry-run receipt', design.prerequisites),
    gate('dry_run_digest_required', design.prerequisites.requiresDryRunReceiptDigest === true, 'design must require Stage 4h receipt digest', design.prerequisites),
  );

  requireObject(design.moduleBoundary, 'moduleBoundary');
  gates.push(
    gate('private_runtime_only', design.moduleBoundary.allowedLocation === 'cortex-abv-private-runtime-only', 'module boundary must be private-runtime only', design.moduleBoundary),
    gate('local_library_only', design.moduleBoundary.moduleType === 'local_library_only', 'module must be a local library only', design.moduleBoundary),
    gate('no_endpoint', design.moduleBoundary.endpointAllowed === false, 'endpoint must remain forbidden', design.moduleBoundary),
    gate('no_scheduler', design.moduleBoundary.schedulerAllowed === false, 'scheduler must remain forbidden', design.moduleBoundary),
    gate('no_network_calls', design.moduleBoundary.networkCallsAllowed === false, 'network calls must remain forbidden', design.moduleBoundary),
    gate('no_llm_calls', design.moduleBoundary.llmCallsAllowed === false, 'LLM calls must remain forbidden', design.moduleBoundary),
    gate('no_public_action', design.moduleBoundary.publicActionAuthorityAllowed === false, 'public action authority must remain forbidden', design.moduleBoundary),
    gate('no_external_writes', design.moduleBoundary.writesOutsideReceiptsAllowed === false, 'writes outside receipts must remain forbidden', design.moduleBoundary),
    gate('no_artifact_mutation', design.moduleBoundary.artifactMutationAllowed === false, 'artifact mutation must remain forbidden', design.moduleBoundary),
    gate('no_source_mutation', design.moduleBoundary.sourcePackMutationAllowed === false, 'source-pack mutation must remain forbidden', design.moduleBoundary),
  );

  requireObject(design.artifactInterface, 'artifactInterface');
  gates.push(
    gate('artifact_kind', design.artifactInterface.requiredArtifactKind === 'CortexABVVectorRuntimeIndexArtifact', 'artifact kind must match Stage 4h artifact', design.artifactInterface),
    gate('artifact_version', design.artifactInterface.requiredArtifactVersion === 'v1', 'artifact version must be v1', design.artifactInterface),
    gate('artifact_root', design.artifactInterface.requiredArtifactRoot === 'data/vector-indexes/turbovec-poc', 'artifact root must match Stage 4h approved root', design.artifactInterface),
    gate('artifact_digest_required', design.artifactInterface.requiresArtifactDigest === true, 'artifact digest is required', design.artifactInterface),
    gate('source_digest_required', design.artifactInterface.requiresSourceDigest === true, 'source digest is required', design.artifactInterface),
    gate('receipt_linkage_required', design.artifactInterface.requiresReceiptLinkageDigest === true, 'receipt linkage digest is required', design.artifactInterface),
    gate('read_only_load', design.artifactInterface.loadMode === 'read_only', 'artifact load mode must be read_only', design.artifactInterface),
    gate('candidates_only', design.artifactInterface.candidateMode === 'candidates_only', 'module must return candidates only', design.artifactInterface),
    gate('no_answer_generation', design.artifactInterface.answerGeneration === false, 'answer generation must remain forbidden', design.artifactInterface),
  );

  requireObject(design.moduleInterface, 'moduleInterface');
  requireArray(design.moduleInterface.allowedFunctions, 'moduleInterface.allowedFunctions');
  const allowedFunctions = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  gates.push(
    gate('allowed_functions', design.moduleInterface.allowedFunctions.every((fn) => allowedFunctions.has(fn)), 'module functions must be explicit and bounded', design.moduleInterface),
    gate('tenant_scope_required', design.moduleInterface.requiresTenantScope === true, 'tenant scope is required', design.moduleInterface),
    gate('no_cross_tenant', design.moduleInterface.forbidCrossTenantLeakage === true, 'cross-tenant leakage must be forbidden', design.moduleInterface),
    gate('hard_threshold_required', design.moduleInterface.requiresHardThreshold === true, 'hard threshold is required', design.moduleInterface),
    gate('evidence_required', design.moduleInterface.requiresEvidenceRefs === true, 'evidence refs are required', design.moduleInterface),
  );
  requireObject(design.moduleInterface.returnShape, 'moduleInterface.returnShape');
  requireArray(design.moduleInterface.returnShape.queryCandidates, 'moduleInterface.returnShape.queryCandidates');
  requireArray(design.moduleInterface.returnShape.verifyClaimEvidence, 'moduleInterface.returnShape.verifyClaimEvidence');
  gates.push(
    gate('query_return_shape', ['candidateId', 'score', 'matchedTerms', 'evidenceRefs', 'tenant'].every((field) => design.moduleInterface.returnShape.queryCandidates.includes(field)), 'queryCandidates return shape must include candidate/evidence fields', design.moduleInterface.returnShape),
    gate('verify_return_shape', ['passed', 'missingEvidenceRefs', 'decisionTrace'].every((field) => design.moduleInterface.returnShape.verifyClaimEvidence.includes(field)), 'verifyClaimEvidence return shape must include decision trace', design.moduleInterface.returnShape),
  );

  requireObject(design.reviewGate, 'reviewGate');
  gates.push(
    gate('target_eligibility', design.reviewGate.targetEligibility === 'eligible_for_controlled_runtime_module_poc_review', 'target eligibility must be controlled runtime module POC review', design.reviewGate),
    gate('separate_implementation_approval', design.reviewGate.implementationRequiresSeparateApproval === true, 'implementation requires separate approval', design.reviewGate),
    gate('separate_wiring_approval', design.reviewGate.wiringRequiresSeparateApproval === true, 'wiring requires separate approval', design.reviewGate),
    gate('owner_review_required', design.reviewGate.ownerReviewRequired === true, 'owner review is required', design.reviewGate),
  );

  requireArray(design.rejectionCases, 'rejectionCases');
  const requiredRejections = [
    'dry_run_receipt_not_eligible',
    'missing_dry_run_receipt_digest',
    'artifact_digest_missing',
    'artifact_root_mismatch',
    'source_digest_missing',
    'receipt_linkage_digest_missing',
    'endpoint_requested',
    'scheduler_requested',
    'network_calls_requested',
    'llm_calls_requested',
    'public_action_authority_requested',
    'external_writes_requested',
    'artifact_mutation_requested',
    'source_pack_mutation_requested',
    'answer_generation_requested',
    'cross_tenant_access_requested',
  ];
  gates.push(gate('rejection_cases_complete', requiredRejections.every((item) => design.rejectionCases.includes(item)), 'required rejection cases must be listed', { requiredRejections, rejectionCases: design.rejectionCases }));

  requireObject(design.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    designReviewOnly: true,
    implementationApproved: false,
    wiringApproved: false,
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

function validateDryRunReceipt(dryRunReceipt, design) {
  const gates = [
    gate('kind', dryRunReceipt.kind === design.prerequisites.requiredDryRunReceiptKind, 'dry-run receipt kind must match design prerequisite', { kind: dryRunReceipt.kind }),
    gate('status', dryRunReceipt.status === design.prerequisites.requiredDryRunStatus, 'dry-run receipt status must match design prerequisite', { status: dryRunReceipt.status }),
    gate('eligibility', dryRunReceipt.eligibility === design.prerequisites.requiredDryRunEligibility, 'dry-run receipt eligibility must match design prerequisite', { eligibility: dryRunReceipt.eligibility }),
    gate('no_blockers', Array.isArray(dryRunReceipt.blockers) && dryRunReceipt.blockers.length === 0, 'dry-run receipt must have no blockers', { blockers: dryRunReceipt.blockers }),
    gate('artifact_digest_present', typeof dryRunReceipt.digests?.indexDigest === 'string' && dryRunReceipt.digests.indexDigest.length === 64, 'dry-run receipt must include index digest', dryRunReceipt.digests),
    gate('source_digest_present', typeof dryRunReceipt.digests?.sourceDigest === 'string' && dryRunReceipt.digests.sourceDigest.length === 64, 'dry-run receipt must include source digest', dryRunReceipt.digests),
    gate('linkage_digest_present', typeof dryRunReceipt.digests?.receiptLinkageDigest === 'string' && dryRunReceipt.digests.receiptLinkageDigest.length === 64, 'dry-run receipt must include receipt linkage digest', dryRunReceipt.digests),
    gate('artifact_root_matches', dryRunReceipt.artifact?.root === design.artifactInterface.requiredArtifactRoot, 'dry-run artifact root must match module artifact interface', dryRunReceipt.artifact),
    gate('artifact_gitignored', dryRunReceipt.artifact?.gitignored === true && dryRunReceipt.artifact?.committed === false, 'dry-run artifact must be gitignored and uncommitted', dryRunReceipt.artifact),
    gate('dry_run_governance_no_runtime', dryRunReceipt.governance?.runtimeIntegration === false, 'dry-run receipt must not approve runtime integration', dryRunReceipt.governance),
    gate('dry_run_governance_no_endpoint', dryRunReceipt.governance?.endpoint === false, 'dry-run receipt must not approve endpoints', dryRunReceipt.governance),
    gate('dry_run_governance_no_public_action', dryRunReceipt.governance?.publicActionAuthority === false, 'dry-run receipt must not approve public actions', dryRunReceipt.governance),
  ];
  return gates;
}

export function runVectorRuntimeControlledModuleDesignGate({ designPath, dryRunReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(designPath)) throw new Error(`controlled module design file not found: ${designPath}`);
  if (!existsSync(dryRunReceiptPath)) throw new Error(`dry-run receipt file not found: ${dryRunReceiptPath}`);
  const design = readJson(designPath);
  const dryRunReceipt = readJson(dryRunReceiptPath);
  const gates = {
    design: validateDesignShape(design),
    dryRunReceipt: validateDryRunReceipt(dryRunReceipt, design),
  };
  const blockers = Object.entries(gates)
    .flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const designDigest = sha256(design);
  const dryRunReceiptDigest = sha256(dryRunReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeControlledModuleDesignReceipt',
    version: 'v1',
    authority: 'design_review_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_controlled_runtime_module_poc_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'controlled_runtime_module_design_review',
    engine: design.engine,
    digests: {
      designDigest,
      dryRunReceiptDigest,
      stage4hIndexDigest: dryRunReceipt.digests?.indexDigest,
      stage4hReceiptLinkageDigest: dryRunReceipt.digests?.receiptLinkageDigest,
    },
    moduleContract: {
      allowedLocation: design.moduleBoundary?.allowedLocation,
      moduleType: design.moduleBoundary?.moduleType,
      artifactInterface: design.artifactInterface,
      moduleInterface: design.moduleInterface,
    },
    governance: {
      readOnly: true,
      proposalOnly: true,
      designReviewOnly: true,
      implementationApproved: false,
      wiringApproved: false,
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
      dryRunReceipt: {
        path: dryRunReceiptPath,
        kind: dryRunReceipt.kind,
        status: dryRunReceipt.status,
        eligibility: dryRunReceipt.eligibility,
        digest: dryRunReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'controlled_module_design_contract_plus_stage4h_dry_run_receipt',
      reason: eligible
        ? 'Controlled module contract can be reviewed because it consumes the Stage 4h artifact interface and preserves local read-only governance.'
        : 'Controlled module contract or Stage 4h dry-run receipt failed review gates.',
      nextAllowedStep: eligible ? 'controlled_runtime_module_poc_review' : 'repair_controlled_module_design_or_stage4h_receipt',
    },
    review: {
      pendingReview: eligible,
      approvalMeaning: 'Approve only review of a future controlled local module POC. This does not approve module implementation, runtime wiring, endpoints, schedulers, network calls, model calls, source or artifact mutation, external writes, public actions or publication.',
      requiredFields: ['eligibility', 'digests', 'moduleContract', 'governance', 'sources', 'gates', 'blockers', 'decisionTrace'],
    },
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimeControlledModuleDesignGate({
    designPath: option('--design') || path.resolve(process.cwd(), 'config/vector-runtime-controlled-module-design.v1.json'),
    dryRunReceiptPath: option('--dry-run-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-implementation-poc-dry-run-receipt.v1.json'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-controlled-module-design-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime controlled module design gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime controlled module design gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
