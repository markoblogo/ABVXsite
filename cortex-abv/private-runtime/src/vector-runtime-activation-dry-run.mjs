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

function flattenBlockers(gates) {
  return Object.entries(gates)
    .flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
}

function validateDesign(design, stage4qReceipt) {
  requireObject(design, 'design');
  const gates = [
    gate('kind', design.kind === 'CortexABVVectorRuntimeActivationDryRun', 'design kind must match', { kind: design.kind }),
    gate('version', design.version === 'v1', 'design version must be v1', { version: design.version }),
    gate('authority', design.authority === 'local_dry_run_only', 'design authority must be local_dry_run_only', { authority: design.authority }),
    gate('engine', design.engine === 'turbovec', 'design engine must be turbovec', { engine: design.engine }),
  ];

  requireObject(design.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4q_kind', stage4qReceipt.kind === design.prerequisites.requiredActivationDryRunReviewReceiptKind, 'Stage 4q receipt kind must match', { kind: stage4qReceipt.kind }),
    gate('stage4q_status', stage4qReceipt.status === design.prerequisites.requiredActivationDryRunReviewStatus, 'Stage 4q receipt status must be passed', { status: stage4qReceipt.status }),
    gate('stage4q_eligibility', stage4qReceipt.eligibility === design.prerequisites.requiredActivationDryRunReviewEligibility, 'Stage 4q receipt eligibility must match', { eligibility: stage4qReceipt.eligibility }),
    gate('stage4q_no_blockers', Array.isArray(stage4qReceipt.blockers) && stage4qReceipt.blockers.length === 0, 'Stage 4q receipt must have no blockers', { blockers: stage4qReceipt.blockers }),
    gate('stage4q_digest_required', design.prerequisites.requiresActivationDryRunReviewReceiptDigest === true, 'Stage 4q receipt digest must be required', design.prerequisites),
  );

  requireObject(design.module, 'module');
  requireArray(design.module.requiredBindings, 'module.requiredBindings');
  gates.push(
    gate('module_path', design.module.path === stage4qReceipt.dryRunScope?.allowedModulePath, 'module path must match Stage 4q scope', { module: design.module, allowedModulePath: stage4qReceipt.dryRunScope?.allowedModulePath }),
    gate('module_type', design.module.type === stage4qReceipt.dryRunScope?.activationMode, 'module type must match Stage 4q activation mode', { module: design.module, activationMode: stage4qReceipt.dryRunScope?.activationMode }),
    gate('required_bindings', design.module.requiredBindings.every((binding) => stage4qReceipt.dryRunScope?.allowedBindings?.includes(binding)), 'required bindings must be Stage 4q allowlisted', { requiredBindings: design.module.requiredBindings, allowedBindings: stage4qReceipt.dryRunScope?.allowedBindings }),
  );

  requireObject(design.artifact, 'artifact');
  gates.push(
    gate('artifact_path', design.artifact.path === stage4qReceipt.dryRunScope?.allowedArtifactPath, 'artifact path must match Stage 4q allowed artifact path', { artifact: design.artifact, allowedArtifactPath: stage4qReceipt.dryRunScope?.allowedArtifactPath }),
    gate('artifact_read_only', design.artifact.readOnly === true, 'artifact must be read-only', design.artifact),
    gate('artifact_kind', design.artifact.kind === 'CortexABVVectorRuntimeIndexArtifact', 'artifact kind must match', design.artifact),
  );

  requireArray(design.queries, 'queries');
  for (const query of design.queries) {
    gates.push(
      gate(`query_${query.id}_tenant`, typeof query.tenant === 'string' && query.tenant.length > 0, 'query must include tenant scope', query),
      gate(`query_${query.id}_expected`, Array.isArray(query.expectedCandidateIds) && query.expectedCandidateIds.length > 0, 'query must include expected candidates', query),
      gate(`query_${query.id}_threshold`, Number.isFinite(query.minScore) && query.minScore >= 0, 'query must include hard threshold', query),
    );
  }

  requireObject(design.commands, 'commands');
  const allowedCommands = stage4qReceipt.dryRunScope?.commands || [];
  for (const [key, command] of Object.entries(design.commands)) {
    gates.push(gate(`command_${key}`, allowedCommands.includes(command) && command.endsWith('_activation_dry_run'), `${key} command must be Stage 4q allowlisted activation dry-run command`, { command, allowedCommands }));
  }

  requireObject(design.checks, 'checks');
  for (const [key, expected] of Object.entries({
    requiresModuleImportable: true,
    requiresBindingsPresent: true,
    requiresArtifactReadOnly: true,
    requiresStage4pReceiptDigest: true,
    requiresStage4oReceiptDigest: true,
    requiresStage4nReceiptDigest: true,
    requiresStage4hArtifactDigest: true,
    requiresStage4hSourceDigest: true,
    requiresTenantScope: true,
    requiresCandidatesOnly: true,
    requiresEvidenceRefs: true,
    requiresActivationNotExposed: true,
    requiresRollbackNotes: true,
  })) {
    gates.push(gate(`check_${key}`, design.checks[key] === expected, `checks.${key} must be ${expected}`, design.checks));
  }

  requireArray(design.rollbackNotes, 'rollbackNotes');
  gates.push(gate('rollback_notes', design.rollbackNotes.length > 0, 'rollback notes must be present', { rollbackNotes: design.rollbackNotes }));

  requireObject(design.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    dryRunOnly: true,
    runtimeActivation: false,
    runtimeIntegration: false,
    endpoint: false,
    scheduler: false,
    networkCalls: false,
    llmCalls: false,
    writesOutsideReceipt: false,
    artifactMutation: false,
    sourceMutation: false,
    publicActionAuthority: false,
  })) {
    gates.push(gate(`governance_${key}`, design.governance[key] === expected, `governance.${key} must be ${expected}`, design.governance));
  }

  return gates;
}

async function loadModule(modulePath) {
  const module = await import(`file://${path.resolve(modulePath)}`);
  return module;
}

function validateDigestContinuity({ stage4qReceipt, stage4pReceipt }) {
  const stage4qReceiptDigest = sha256(stage4qReceipt);
  const stage4pReceiptDigest = sha256(stage4pReceipt);
  return {
    gates: [
      gate('stage4p_receipt_digest_present', stage4qReceipt.stage4pReceiptDigest === stage4pReceiptDigest, 'Stage 4q must link to Stage 4p receipt digest', { expected: stage4qReceipt.stage4pReceiptDigest, observed: stage4pReceiptDigest }),
      gate('stage4o_receipt_digest_present', typeof stage4qReceipt.prerequisiteDigests?.stage4oReceiptDigest === 'string' && stage4qReceipt.prerequisiteDigests.stage4oReceiptDigest.length === 64, 'Stage 4o receipt digest must be present', stage4qReceipt.prerequisiteDigests),
      gate('stage4n_receipt_digest_present', typeof stage4qReceipt.prerequisiteDigests?.stage4nReceiptDigest === 'string' && stage4qReceipt.prerequisiteDigests.stage4nReceiptDigest.length === 64, 'Stage 4n receipt digest must be present', stage4qReceipt.prerequisiteDigests),
      gate('stage4h_index_digest_present', typeof stage4qReceipt.prerequisiteDigests?.stage4hIndexDigest === 'string' && stage4qReceipt.prerequisiteDigests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', stage4qReceipt.prerequisiteDigests),
      gate('stage4h_source_digest_present', typeof stage4qReceipt.prerequisiteDigests?.stage4hSourceDigest === 'string' && stage4qReceipt.prerequisiteDigests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', stage4qReceipt.prerequisiteDigests),
      gate('no_runtime_activation_in_stage4p', stage4pReceipt.governance?.runtimeActivationApproved === false, 'Stage 4p must not approve runtime activation', stage4pReceipt.governance),
      gate('no_runtime_activation_in_stage4q', stage4qReceipt.governance?.runtimeActivationApproved === false, 'Stage 4q must not approve runtime activation', stage4qReceipt.governance),
    ],
    digests: {
      stage4qReceiptDigest,
      stage4pReceiptDigest,
      stage4oReceiptDigest: stage4qReceipt.prerequisiteDigests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4qReceipt.prerequisiteDigests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4qReceipt.prerequisiteDigests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4qReceipt.prerequisiteDigests?.stage4hSourceDigest,
    },
  };
}

function buildReceipt({ design, stage4qReceipt, gates, blockers, digests = {}, moduleInfo, loadedIndex, queryResults = [], runAt }) {
  const passed = blockers.length === 0;
  const designDigest = sha256(design);
  return {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeActivationDryRunReceipt',
    version: 'v1',
    authority: 'local_dry_run_only',
    status: passed ? 'passed' : 'blocked',
    eligibility: passed ? 'eligible_for_runtime_readiness_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'runtime_activation_dry_run',
    engine: design.engine,
    digests: {
      designDigest,
      stage4qReceiptDigest: digests.stage4qReceiptDigest,
      stage4pReceiptDigest: digests.stage4pReceiptDigest,
      stage4oReceiptDigest: digests.stage4oReceiptDigest,
      stage4nReceiptDigest: digests.stage4nReceiptDigest,
      stage4hIndexDigest: digests.stage4hIndexDigest || loadedIndex?.digests?.indexDigest,
      stage4hSourceDigest: digests.stage4hSourceDigest || loadedIndex?.digests?.sourceDigest,
      receiptLinkageDigest: sha256({
        designDigest,
        stage4qReceiptDigest: digests.stage4qReceiptDigest,
        stage4pReceiptDigest: digests.stage4pReceiptDigest,
        stage4oReceiptDigest: digests.stage4oReceiptDigest,
        stage4nReceiptDigest: digests.stage4nReceiptDigest,
        stage4hIndexDigest: digests.stage4hIndexDigest || loadedIndex?.digests?.indexDigest,
        stage4hSourceDigest: digests.stage4hSourceDigest || loadedIndex?.digests?.sourceDigest,
      }),
    },
    module: {
      path: design.module?.path,
      importable: moduleInfo?.importable === true,
      bindingsPresent: moduleInfo?.bindingsPresent === true,
      activationExposed: false,
    },
    artifact: loadedIndex ? {
      path: design.artifact?.path,
      indexDigest: loadedIndex.digests.indexDigest,
      sourceDigest: loadedIndex.digests.sourceDigest,
      documentCount: loadedIndex.artifact.documentCount,
      readOnly: true,
    } : undefined,
    commandsExecuted: passed ? [
      design.commands.verifyStage4pDigest,
      design.commands.loadLocalRuntimeBinding,
      design.commands.queryLocalRuntimeBinding,
      design.commands.verifyActivationNotExposed,
    ] : [],
    rollbackNotes: design.rollbackNotes,
    queryResults,
    governance: {
      readOnly: true,
      proposalOnly: true,
      dryRunOnly: true,
      runtimeActivation: false,
      runtimeIntegration: false,
      endpoint: false,
      scheduler: false,
      networkCalls: false,
      llmCalls: false,
      writesOutsideReceipt: false,
      artifactMutation: false,
      sourceMutation: false,
      publicActionAuthority: false,
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'runtime_activation_dry_run_plus_stage4q_receipt_digest',
      reason: passed
        ? 'Local activation dry-run verified module import and bindings, loaded the artifact read-only, ran tenant-scoped candidate-only queries, verified evidence refs and did not expose activation.'
        : 'Local activation dry-run failed design, digest, module, query, evidence or governance gates.',
      nextAllowedStep: passed ? 'runtime_readiness_review_gate' : 'repair_runtime_activation_dry_run',
    },
  };
}

export async function runVectorRuntimeActivationDryRun({ designPath, stage4qReceiptPath, stage4pReceiptPath, artifactPath, receiptPath, runAt, runtimeRoot } = {}) {
  if (!existsSync(designPath)) throw new Error(`activation dry-run design file not found: ${designPath}`);
  if (!existsSync(stage4qReceiptPath)) throw new Error(`Stage 4q receipt file not found: ${stage4qReceiptPath}`);
  const resolvedRuntimeRoot = runtimeRoot || path.resolve(path.dirname(designPath), '..');
  const resolvedStage4pReceiptPath = stage4pReceiptPath || path.resolve(resolvedRuntimeRoot, 'receipts/vector-runtime-activation-review-receipt.v1.json');
  if (!existsSync(resolvedStage4pReceiptPath)) throw new Error(`Stage 4p receipt file not found: ${resolvedStage4pReceiptPath}`);
  const design = readJson(designPath);
  const stage4qReceipt = readJson(stage4qReceiptPath);
  const stage4pReceipt = readJson(resolvedStage4pReceiptPath);
  const continuity = validateDigestContinuity({ stage4qReceipt, stage4pReceipt });
  let gates = {
    design: validateDesign(design, stage4qReceipt),
    continuity: continuity.gates,
  };
  let blockers = flattenBlockers(gates);
  if (blockers.length > 0) {
    const receipt = buildReceipt({ design, stage4qReceipt, gates, blockers, digests: continuity.digests, runAt });
    if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    return receipt;
  }

  const resolvedModulePath = path.resolve(resolvedRuntimeRoot, design.module.path);
  const module = await loadModule(resolvedModulePath);
  const requiredBindings = design.module.requiredBindings;
  const bindingsPresent = requiredBindings.every((binding) => typeof module[binding] === 'function');
  const moduleGates = [
    gate('module_importable', true, 'module must be importable', { modulePath: resolvedModulePath }),
    gate('bindings_present', bindingsPresent, 'required bindings must be present', { requiredBindings }),
  ];

  const resolvedArtifactPath = artifactPath || path.resolve(resolvedRuntimeRoot, design.artifact.path);
  const loadedIndex = module.loadIndexArtifact({
    artifactPath: resolvedArtifactPath,
    expectedIndexDigest: continuity.digests.stage4hIndexDigest,
    expectedSourceDigest: continuity.digests.stage4hSourceDigest,
  });
  const artifactGates = [
    gate('artifact_read_only', loadedIndex.decisionTrace?.artifactReadOnly === true, 'artifact must load read-only', loadedIndex.decisionTrace),
    gate('no_activation_exposed', loadedIndex.decisionTrace?.endpoint === false && loadedIndex.decisionTrace?.networkCalls === false && loadedIndex.decisionTrace?.llmCalls === false, 'activation must remain unexposed and local-only', loadedIndex.decisionTrace),
  ];

  const queryResults = design.queries.map((query) => {
    const result = module.queryCandidates({
      loadedIndex,
      query: query.query,
      tenant: query.tenant,
      topK: query.topK,
      minScore: query.minScore,
    });
    const verification = module.verifyClaimEvidence({ candidates: result.candidates });
    const candidateIds = result.candidates.map((candidate) => candidate.candidateId);
    const hits = query.expectedCandidateIds.filter((id) => candidateIds.includes(id));
    return {
      id: query.id,
      status: hits.length === query.expectedCandidateIds.length && verification.passed ? 'passed' : 'blocked',
      tenant: query.tenant,
      candidateIds,
      expectedCandidateIds: query.expectedCandidateIds,
      hits,
      evidenceVerification: verification,
      decisionTrace: result.decisionTrace,
      candidates: result.candidates,
    };
  });
  const queryGates = [
    gate('tenant_scoped_queries', queryResults.every((result) => result.candidates.every((candidate) => candidate.tenant === result.tenant)), 'all candidates must stay tenant-scoped', { queryCount: queryResults.length }),
    gate('expected_candidates_found', queryResults.every((result) => result.status === 'passed'), 'expected candidates and evidence verification must pass', { queryResults: queryResults.map((result) => ({ id: result.id, status: result.status })) }),
    gate('candidates_only', queryResults.every((result) => result.decisionTrace?.candidatesOnly === true && result.decisionTrace?.answerGeneration === false), 'queries must return candidates only', { queryResults: queryResults.map((result) => ({ id: result.id, candidatesOnly: result.decisionTrace?.candidatesOnly, answerGeneration: result.decisionTrace?.answerGeneration })) }),
  ];

  gates = {
    design: gates.design,
    continuity: gates.continuity,
    module: moduleGates,
    artifact: artifactGates,
    query: queryGates,
  };
  blockers = flattenBlockers(gates);
  const receipt = buildReceipt({
    design,
    stage4qReceipt,
    gates,
    blockers,
    digests: continuity.digests,
    moduleInfo: { importable: true, bindingsPresent },
    loadedIndex,
    queryResults,
    runAt,
  });
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export async function run() {
  const receipt = await runVectorRuntimeActivationDryRun({
    designPath: option('--design') || path.resolve(process.cwd(), 'config/vector-runtime-activation-dry-run.v1.json'),
    stage4qReceiptPath: option('--stage4q-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-activation-dry-run-review-receipt.v1.json'),
    stage4pReceiptPath: option('--stage4p-receipt'),
    artifactPath: option('--artifact'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-activation-dry-run-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime activation dry-run complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(`Vector runtime activation dry-run failed: ${error.message}`);
    process.exitCode = 1;
  });
}
