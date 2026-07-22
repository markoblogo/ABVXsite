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
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function requireArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must be a non-empty array`);
  }
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
    gate('kind', design.kind === 'CortexABVVectorRuntimeWiringDesign', 'design kind must match', { kind: design.kind }),
    gate('version', design.version === 'v1', 'design version must be v1', { version: design.version }),
    gate('authority', design.authority === 'plan_only', 'design authority must be plan_only', { authority: design.authority }),
    gate('engine', design.engine === 'turbovec', 'design engine must be turbovec', { engine: design.engine }),
  ];

  requireObject(design.prerequisites, 'prerequisites');
  gates.push(
    gate('preflight_required', design.prerequisites.requiredPreflightEligibility === 'eligible_for_design_review', 'design must require eligible preflight', design.prerequisites),
  );

  requireObject(design.runtimeBoundary, 'runtimeBoundary');
  gates.push(
    gate('private_runtime_only', design.runtimeBoundary.allowedLocation === 'cortex-abv-private-runtime-only', 'runtime boundary must be private-runtime only', design.runtimeBoundary),
    gate('no_public_repo_runtime', design.runtimeBoundary.publicRepoRuntime === false, 'public repo runtime must remain false', design.runtimeBoundary),
    gate('no_endpoint', design.runtimeBoundary.endpoint === false, 'endpoint must remain false', design.runtimeBoundary),
    gate('no_scheduler', design.runtimeBoundary.scheduler === false, 'scheduler must remain false', design.runtimeBoundary),
    gate('no_llm_calls', design.runtimeBoundary.llmCalls === false, 'llm calls must remain false', design.runtimeBoundary),
    gate('no_public_action', design.runtimeBoundary.publicActionAuthority === false, 'public action authority must remain false', design.runtimeBoundary),
    gate('no_external_writes', design.runtimeBoundary.writesOutsideReceipts === false, 'writes outside receipts must remain false', design.runtimeBoundary),
  );
  requireArray(design.runtimeBoundary.allowedCommands, 'runtimeBoundary.allowedCommands');
  gates.push(
    gate('bounded_commands', design.runtimeBoundary.allowedCommands.every((command) => ['build_index_poc', 'query_index_poc'].includes(command)), 'allowed commands must be bounded POC commands', {
      allowedCommands: design.runtimeBoundary.allowedCommands,
    }),
  );

  requireObject(design.indexLifecycle, 'indexLifecycle');
  gates.push(
    gate('allowlisted_sources', design.indexLifecycle.sourceMode === 'allowlisted_synthetic_or_reviewed_private_source_pack_only', 'index sources must be allowlisted or reviewed private packs only', design.indexLifecycle),
    gate('no_auto_rebuild', design.indexLifecycle.automaticRebuild === false, 'automatic rebuild must remain false', design.indexLifecycle),
    gate('source_digest_required', design.indexLifecycle.requiresSourceDigest === true, 'source digest is required', design.indexLifecycle),
    gate('index_digest_required', design.indexLifecycle.requiresIndexDigest === true, 'index digest is required', design.indexLifecycle),
    gate('local_gitignored_artifact', design.indexLifecycle.indexArtifactPolicy === 'local_gitignored_artifact_only', 'index artifacts must be local gitignored only', design.indexLifecycle),
    gate('rollback_required', design.indexLifecycle.rollbackNotesRequired === true, 'rollback notes are required', design.indexLifecycle),
  );

  requireObject(design.queryContract, 'queryContract');
  gates.push(
    gate('candidates_only', design.queryContract.returnsCandidatesOnly === true, 'query returns candidates only', design.queryContract),
    gate('no_answer_generation', design.queryContract.answerGeneration === false, 'answer generation must remain false', design.queryContract),
    gate('claim_evidence_required', design.queryContract.requiresClaimEvidence === true, 'claim evidence is required', design.queryContract),
    gate('hard_threshold_required', design.queryContract.requiresHardThreshold === true, 'hard threshold is required', design.queryContract),
    gate('tenant_scope_required', design.queryContract.requiresTenantScope === true, 'tenant scope is required', design.queryContract),
    gate('no_cross_tenant', design.queryContract.forbidCrossTenantLeakage === true, 'cross-tenant leakage must be forbidden', design.queryContract),
  );
  requireArray(design.queryContract.allowedQuerySources, 'queryContract.allowedQuerySources');

  requireObject(design.promotionGate, 'promotionGate');
  requireArray(design.promotionGate.requiredReceipts, 'promotionGate.requiredReceipts');
  gates.push(
    gate('target_eligibility', design.promotionGate.targetEligibility === 'eligible_for_implementation_poc_review', 'promotion target must be implementation POC review eligibility', design.promotionGate),
    gate('owner_review_required', design.promotionGate.ownerReviewRequired === true, 'owner review is required', design.promotionGate),
    gate('separate_poc_approval', design.promotionGate.implementationPocRequiresSeparateApproval === true, 'implementation POC requires separate approval', design.promotionGate),
  );

  requireArray(design.rejectionCases, 'rejectionCases');
  const requiredRejections = [
    'missing_claim_evidence',
    'package_policy_drift',
    'dependency_probe_drift',
    'platform_mismatch',
    'runtime_action_authority_true',
    'endpoint_true',
    'llm_calls_true',
    'writes_outside_receipts_true',
    'cross_tenant_access',
    'automatic_rebuild_true',
  ];
  gates.push(
    gate('rejection_cases_complete', requiredRejections.every((item) => design.rejectionCases.includes(item)), 'required rejection cases must be listed', {
      requiredRejections,
      rejectionCases: design.rejectionCases,
    }),
  );

  requireObject(design.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    designReviewOnly: true,
    runtimeIntegration: false,
    implementationPocApproved: false,
    endpoint: false,
    llmCalls: false,
    writesOutsideReceipt: false,
    publicActionAuthority: false,
  })) {
    gates.push(gate(`governance_${key}`, design.governance[key] === expected, `governance.${key} must be ${expected}`, design.governance));
  }

  return gates;
}

function validatePreflight(preflight, design) {
  const gates = [
    gate('kind', preflight.kind === design.prerequisites.requiredPreflightKind, 'preflight kind must match design prerequisite', { kind: preflight.kind }),
    gate('status', preflight.status === 'passed', 'preflight status must be passed', { status: preflight.status }),
    gate('eligibility', preflight.eligibility === design.prerequisites.requiredPreflightEligibility, 'preflight eligibility must match design prerequisite', { eligibility: preflight.eligibility }),
    gate('no_blockers', Array.isArray(preflight.blockers) && preflight.blockers.length === 0, 'preflight must have no blockers', { blockers: preflight.blockers }),
    gate('preflight_no_runtime', preflight.governance?.runtimeIntegration === false, 'preflight must not approve runtime integration', preflight.governance),
    gate('preflight_design_review_only', preflight.governance?.designReviewOnly === true, 'preflight must remain design-review only', preflight.governance),
    gate('preflight_no_public_action', preflight.governance?.publicActionAuthority === false, 'preflight must not approve public actions', preflight.governance),
  ];
  return gates;
}

export function runVectorRuntimeWiringDesignGate({ designPath, preflightReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(designPath)) throw new Error(`design file not found: ${designPath}`);
  if (!existsSync(preflightReceiptPath)) throw new Error(`preflight receipt file not found: ${preflightReceiptPath}`);
  const design = readJson(designPath);
  const preflight = readJson(preflightReceiptPath);
  const designGates = validateDesignShape(design);
  const preflightGates = validatePreflight(preflight, design);
  const gates = {
    design: designGates,
    preflight: preflightGates,
  };
  const blockers = Object.entries(gates)
    .flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeWiringDesignReceipt',
    version: 'v1',
    authority: 'plan_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_implementation_poc_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'runtime_wiring_design_review',
    engine: design.engine,
    designDigest: sha256(design),
    preflightDigest: sha256(preflight),
    governance: {
      runtimeIntegration: false,
      implementationPocApproved: false,
      designReviewOnly: true,
      readOnly: true,
      proposalOnly: true,
      endpoint: false,
      llmCalls: false,
      writesOutsideReceipt: false,
      publicActionAuthority: false,
    },
    sources: {
      design: { path: designPath, kind: design.kind, digest: sha256(design) },
      preflight: { path: preflightReceiptPath, kind: preflight.kind, status: preflight.status, eligibility: preflight.eligibility, digest: sha256(preflight) },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'wiring_design_contract_plus_preflight',
      reason: eligible
        ? 'Design contract and preflight gates are coherent; eligible only for implementation POC review.'
        : 'Design contract or preflight gate blocked; not eligible for implementation POC review.',
      nextAllowedStep: eligible ? 'implementation_poc_review' : 'repair_design_or_preflight',
    },
    review: {
      pendingReview: eligible,
      approvalMeaning: 'Approve only review of a future implementation POC. This does not approve runtime implementation, activation, endpoints, external writes, model calls, publication or public actions.',
      requiredFields: ['eligibility', 'governance', 'sources', 'gates', 'blockers', 'decisionTrace'],
    },
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimeWiringDesignGate({
    designPath: option('--design') || path.resolve(process.cwd(), 'config/vector-runtime-wiring-design.v1.json'),
    preflightReceiptPath: option('--preflight') || path.resolve(process.cwd(), 'receipts/vector-runtime-integration-preflight-receipt.v1.json'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-wiring-design-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime wiring design gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime wiring design gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
