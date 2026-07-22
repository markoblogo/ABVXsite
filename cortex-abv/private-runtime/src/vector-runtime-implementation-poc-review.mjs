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

function hasGitignoreCoverage(runtimeRoot, localIndexArtifactRoot) {
  const gitignorePath = path.join(runtimeRoot, '.gitignore');
  if (!existsSync(gitignorePath)) return false;
  const content = readFileSync(gitignorePath, 'utf8');
  const normalizedRoot = localIndexArtifactRoot.replace(/\/+$/, '');
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => {
      const normalizedLine = line.replace(/\/\*\*$/, '').replace(/\/+$/, '');
      return normalizedLine === normalizedRoot || normalizedRoot.startsWith(`${normalizedLine}/`);
    });
}

function validateReviewShape(review, runtimeRoot) {
  requireObject(review, 'review');
  const gates = [
    gate('kind', review.kind === 'CortexABVVectorRuntimeImplementationPocReview', 'review kind must match', { kind: review.kind }),
    gate('version', review.version === 'v1', 'review version must be v1', { version: review.version }),
    gate('authority', review.authority === 'plan_only', 'review authority must be plan_only', { authority: review.authority }),
    gate('engine', review.engine === 'turbovec', 'review engine must be turbovec', { engine: review.engine }),
  ];

  requireObject(review.prerequisites, 'prerequisites');
  gates.push(
    gate('wiring_prerequisite', review.prerequisites.requiredWiringDesignEligibility === 'eligible_for_implementation_poc_review', 'review must require eligible wiring design receipt', review.prerequisites),
  );

  requireObject(review.pocScope, 'pocScope');
  const localRoot = review.pocScope.localIndexArtifactRoot;
  gates.push(
    gate('dry_run_review_only', review.pocScope.mode === 'dry_run_review_only', 'POC scope must be dry-run review only', review.pocScope),
    gate('local_index_root', typeof localRoot === 'string' && localRoot.startsWith('data/vector-indexes/') && !localRoot.includes('..'), 'index artifact root must stay under data/vector-indexes', { localIndexArtifactRoot: localRoot }),
    gate('gitignored_index_root', review.pocScope.gitignoreRequired === true && hasGitignoreCoverage(runtimeRoot, localRoot), 'index artifact root must be covered by private-runtime .gitignore', { localIndexArtifactRoot: localRoot }),
    gate('no_committed_index_artifacts', review.pocScope.committedIndexArtifactsAllowed === false, 'committed index artifacts are forbidden', review.pocScope),
    gate('no_network', review.pocScope.networkAccessAllowed === false, 'network access is forbidden for dry-run POC scope', review.pocScope),
    gate('no_endpoint', review.pocScope.endpointAllowed === false, 'endpoint is forbidden', review.pocScope),
    gate('no_scheduler', review.pocScope.schedulerAllowed === false, 'scheduler is forbidden', review.pocScope),
    gate('no_llm_calls', review.pocScope.llmCallsAllowed === false, 'LLM calls are forbidden', review.pocScope),
    gate('no_public_action', review.pocScope.publicActionAuthorityAllowed === false, 'public action authority is forbidden', review.pocScope),
    gate('bounded_writes', review.pocScope.writesOutsideReceiptOrLocalArtifactAllowed === false, 'writes must be limited to receipt or local index artifact', review.pocScope),
  );

  requireObject(review.sourcePackPolicy, 'sourcePackPolicy');
  requireArray(review.sourcePackPolicy.allowedSourcePacks, 'sourcePackPolicy.allowedSourcePacks');
  const allowedTypes = new Set(['synthetic_benchmark', 'reviewed_private_source_pack']);
  gates.push(
    gate('allowlisted_source_pack_types', review.sourcePackPolicy.allowedSourcePacks.every((source) => allowedTypes.has(source.type)), 'source packs must be synthetic or reviewed private packs only', review.sourcePackPolicy),
    gate('no_public_site_adapters', review.sourcePackPolicy.publicSiteAdaptersAllowed === false, 'public site adapters are not allowed for this POC review gate', review.sourcePackPolicy),
    gate('no_raw_personal_data', review.sourcePackPolicy.rawPersonalDataAllowed === false, 'raw personal data is not allowed', review.sourcePackPolicy),
    gate('no_cross_tenant_sources', review.sourcePackPolicy.crossTenantSourcesAllowed === false, 'cross-tenant sources are not allowed', review.sourcePackPolicy),
  );

  requireObject(review.digestAndRollback, 'digestAndRollback');
  for (const [key, expected] of Object.entries({
    requiresSourceDigestBeforeBuild: true,
    requiresSourcePackDigest: true,
    requiresIndexDigestAfterBuild: true,
    requiresWiringReceiptDigest: true,
    requiresReceiptDigestLinkage: true,
    rollbackNotesRequired: true,
    baselineAdvancementAllowed: false,
  })) {
    gates.push(gate(`digest_${key}`, review.digestAndRollback[key] === expected, `digestAndRollback.${key} must be ${expected}`, review.digestAndRollback));
  }
  gates.push(gate('rollback_action', review.digestAndRollback.rollbackAction === 'delete_or_abandon_local_index_artifact', 'rollback action must delete or abandon local artifact', review.digestAndRollback));

  requireObject(review.dryRunCommandPolicy, 'dryRunCommandPolicy');
  requireArray(review.dryRunCommandPolicy.allowedCommands, 'dryRunCommandPolicy.allowedCommands');
  const commandAllowlist = new Set(['build_index_poc_dry_run', 'query_index_poc_dry_run', 'verify_index_poc_dry_run']);
  gates.push(
    gate('bounded_dry_run_commands', review.dryRunCommandPolicy.allowedCommands.every((command) => commandAllowlist.has(command)), 'dry-run commands must be explicitly allowlisted', review.dryRunCommandPolicy),
    gate('dry_run_suffix', review.dryRunCommandPolicy.allowedCommands.every((command) => command.endsWith(review.dryRunCommandPolicy.commandsMustEndWith)), 'dry-run commands must use the required suffix', review.dryRunCommandPolicy),
    gate('no_shell_access', review.dryRunCommandPolicy.shellAccessAllowed === false, 'shell access is forbidden for future dry-run command surface', review.dryRunCommandPolicy),
    gate('no_dependency_install', review.dryRunCommandPolicy.installDependenciesAllowed === false, 'dependency install is forbidden in implementation POC dry-run command surface', review.dryRunCommandPolicy),
    gate('no_source_mutation', review.dryRunCommandPolicy.mutateSourcePacksAllowed === false, 'source pack mutation is forbidden', review.dryRunCommandPolicy),
  );

  requireArray(review.rejectionCases, 'rejectionCases');
  const requiredRejections = [
    'wiring_design_not_eligible',
    'local_index_artifact_not_gitignored',
    'index_artifact_committed',
    'source_pack_not_allowlisted',
    'missing_source_digest',
    'missing_index_digest',
    'missing_rollback_notes',
    'baseline_advancement_requested',
    'non_dry_run_command',
    'network_access_requested',
    'endpoint_requested',
    'scheduler_requested',
    'llm_calls_requested',
    'public_action_authority_requested',
    'cross_tenant_source_requested',
  ];
  gates.push(gate('rejection_cases_complete', requiredRejections.every((item) => review.rejectionCases.includes(item)), 'required rejection cases must be listed', { requiredRejections, rejectionCases: review.rejectionCases }));

  requireObject(review.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    implementationPocReviewOnly: true,
    implementationPocApproved: false,
    dryRunOnly: true,
    runtimeIntegration: false,
    endpoint: false,
    scheduler: false,
    llmCalls: false,
    writesOutsideReceipt: false,
    publicActionAuthority: false,
  })) {
    gates.push(gate(`governance_${key}`, review.governance[key] === expected, `governance.${key} must be ${expected}`, review.governance));
  }

  return gates;
}

function validateWiringReceipt(wiringReceipt, review) {
  return [
    gate('kind', wiringReceipt.kind === review.prerequisites.requiredWiringDesignReceiptKind, 'wiring design receipt kind must match review prerequisite', { kind: wiringReceipt.kind }),
    gate('status', wiringReceipt.status === review.prerequisites.requiredWiringDesignStatus, 'wiring design receipt status must match review prerequisite', { status: wiringReceipt.status }),
    gate('eligibility', wiringReceipt.eligibility === review.prerequisites.requiredWiringDesignEligibility, 'wiring design receipt eligibility must match review prerequisite', { eligibility: wiringReceipt.eligibility }),
    gate('no_blockers', Array.isArray(wiringReceipt.blockers) && wiringReceipt.blockers.length === 0, 'wiring design receipt must have no blockers', { blockers: wiringReceipt.blockers }),
    gate('no_runtime_integration', wiringReceipt.governance?.runtimeIntegration === false, 'wiring design receipt must not approve runtime integration', wiringReceipt.governance),
    gate('no_implementation_poc_approval', wiringReceipt.governance?.implementationPocApproved === false, 'wiring design receipt must not approve implementation POC', wiringReceipt.governance),
    gate('no_public_action', wiringReceipt.governance?.publicActionAuthority === false, 'wiring design receipt must not approve public action authority', wiringReceipt.governance),
  ];
}

export function runVectorRuntimeImplementationPocReviewGate({ reviewPath, wiringReceiptPath, receiptPath, runAt, runtimeRoot = process.cwd() } = {}) {
  if (!existsSync(reviewPath)) throw new Error(`review file not found: ${reviewPath}`);
  if (!existsSync(wiringReceiptPath)) throw new Error(`wiring design receipt file not found: ${wiringReceiptPath}`);
  const review = readJson(reviewPath);
  const wiringReceipt = readJson(wiringReceiptPath);
  const gates = {
    review: validateReviewShape(review, runtimeRoot),
    wiringDesign: validateWiringReceipt(wiringReceipt, review),
  };
  const blockers = Object.entries(gates)
    .flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeImplementationPocReviewReceipt',
    version: 'v1',
    authority: 'plan_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_implementation_poc_dry_run_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'implementation_poc_scope_review',
    engine: review.engine,
    reviewDigest: sha256(review),
    wiringDesignReceiptDigest: sha256(wiringReceipt),
    minimumPocScope: {
      localIndexArtifactRoot: review.pocScope?.localIndexArtifactRoot,
      allowedSourcePacks: review.sourcePackPolicy?.allowedSourcePacks,
      allowedDryRunCommands: review.dryRunCommandPolicy?.allowedCommands,
      digestAndRollback: review.digestAndRollback,
    },
    governance: {
      readOnly: true,
      proposalOnly: true,
      implementationPocReviewOnly: true,
      implementationPocApproved: false,
      dryRunOnly: true,
      runtimeIntegration: false,
      endpoint: false,
      scheduler: false,
      llmCalls: false,
      writesOutsideReceipt: false,
      publicActionAuthority: false,
    },
    sources: {
      review: { path: reviewPath, kind: review.kind, digest: sha256(review) },
      wiringDesignReceipt: {
        path: wiringReceiptPath,
        kind: wiringReceipt.kind,
        status: wiringReceipt.status,
        eligibility: wiringReceipt.eligibility,
        digest: sha256(wiringReceipt),
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'implementation_poc_review_contract_plus_wiring_design_receipt',
      reason: eligible
        ? 'Minimum POC dry-run scope is bounded, locally contained and linked to an eligible wiring design receipt.'
        : 'Minimum POC dry-run scope or wiring design receipt failed review gates.',
      nextAllowedStep: eligible ? 'implementation_poc_dry_run_design_review' : 'repair_poc_review_scope_or_wiring_design',
    },
    review: {
      pendingReview: eligible,
      approvalMeaning: 'Approve only review of a future dry-run implementation POC scope. This does not approve POC implementation, package installation, runtime activation, endpoints, schedulers, model calls, external writes, source-pack mutation, public actions or publication.',
      requiredFields: ['eligibility', 'minimumPocScope', 'governance', 'sources', 'gates', 'blockers', 'decisionTrace'],
    },
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimeImplementationPocReviewGate({
    reviewPath: option('--review') || path.resolve(process.cwd(), 'config/vector-runtime-implementation-poc-review.v1.json'),
    wiringReceiptPath: option('--wiring') || path.resolve(process.cwd(), 'receipts/vector-runtime-wiring-design-receipt.v1.json'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-implementation-poc-review-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime implementation POC review gate complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime implementation POC review gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
