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
  return Object.entries(gates).flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
}

function validateDesign(design, stage4uReceipt) {
  requireObject(design, 'design');
  const gates = [
    gate('kind', design.kind === 'CortexABVVectorRuntimeLocalActivationDryRun', 'design kind must match', { kind: design.kind }),
    gate('version', design.version === 'v1', 'design version must be v1', { version: design.version }),
    gate('authority', design.authority === 'local_activation_dry_run_only', 'design authority must be local_activation_dry_run_only', { authority: design.authority }),
    gate('engine', design.engine === 'turbovec', 'design engine must be turbovec', { engine: design.engine }),
  ];

  requireObject(design.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4u_kind', stage4uReceipt.kind === design.prerequisites.requiredActivationDecisionReceiptKind, 'Stage 4u receipt kind must match', { kind: stage4uReceipt.kind }),
    gate('stage4u_status', stage4uReceipt.status === design.prerequisites.requiredActivationDecisionStatus, 'Stage 4u receipt status must be passed', { status: stage4uReceipt.status }),
    gate('stage4u_eligibility', stage4uReceipt.eligibility === design.prerequisites.requiredActivationDecisionEligibility, 'Stage 4u receipt eligibility must match', { eligibility: stage4uReceipt.eligibility }),
    gate('stage4u_no_blockers', Array.isArray(stage4uReceipt.blockers) && stage4uReceipt.blockers.length === 0, 'Stage 4u receipt must have no blockers', { blockers: stage4uReceipt.blockers }),
    gate('stage4u_digest_required', design.prerequisites.requiresActivationDecisionReceiptDigest === true, 'Stage 4u receipt digest must be required', design.prerequisites),
  );

  requireObject(design.module, 'module');
  requireArray(design.module.requiredBindings, 'module.requiredBindings');
  gates.push(
    gate('module_path', design.module.path === stage4uReceipt.activationIntent?.allowedModulePath, 'module path must match Stage 4u activation intent', { module: design.module, allowedModulePath: stage4uReceipt.activationIntent?.allowedModulePath }),
    gate('module_type', design.module.type === stage4uReceipt.activationIntent?.activationMode, 'module type must match Stage 4u activation intent mode', { module: design.module, activationMode: stage4uReceipt.activationIntent?.activationMode }),
    gate('required_bindings', design.module.requiredBindings.every((binding) => stage4uReceipt.activationIntent?.allowedBindings?.includes(binding)), 'required bindings must be Stage 4u allowlisted', { requiredBindings: design.module.requiredBindings, allowedBindings: stage4uReceipt.activationIntent?.allowedBindings }),
  );

  requireObject(design.artifact, 'artifact');
  gates.push(
    gate('artifact_path', design.artifact.path === stage4uReceipt.activationIntent?.allowedArtifactPath, 'artifact path must match Stage 4u allowed artifact path', { artifact: design.artifact, allowedArtifactPath: stage4uReceipt.activationIntent?.allowedArtifactPath }),
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
  const requiredSuffix = '_local_activation_dry_run';
  for (const [key, command] of Object.entries(design.commands)) {
    gates.push(gate(`command_${key}`, typeof command === 'string' && command.endsWith(requiredSuffix), `${key} command must use ${requiredSuffix} suffix`, { command }));
  }

  requireObject(design.checks, 'checks');
  for (const [key, expected] of Object.entries({
    requiresModuleImportable: true,
    requiresBindingsPresent: true,
    requiresArtifactReadOnly: true,
    requiresStage4tReceiptDigest: true,
    requiresStage4sReceiptDigest: true,
    requiresStage4rReceiptDigest: true,
    requiresStage4qReceiptDigest: true,
    requiresStage4pReceiptDigest: true,
    requiresStage4oReceiptDigest: true,
    requiresStage4nReceiptDigest: true,
    requiresStage4hArtifactDigest: true,
    requiresStage4hSourceDigest: true,
    requiresTenantScope: true,
    requiresCandidatesOnly: true,
    requiresEvidenceRefs: true,
    requiresActivationNotApplied: true,
    requiresRollbackPlan: true,
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
    runtimeActivationApplied: false,
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
  return import(`file://${path.resolve(modulePath)}`);
}

function validateDigestContinuity(stage4uReceipt) {
  return {
    gates: [
      gate('stage4t_receipt_digest_present', typeof stage4uReceipt.stage4tReceiptDigest === 'string' && stage4uReceipt.stage4tReceiptDigest.length === 64, 'Stage 4t receipt digest must be present', { stage4tReceiptDigest: stage4uReceipt.stage4tReceiptDigest }),
      gate('stage4s_receipt_digest_present', typeof stage4uReceipt.prerequisiteDigests?.stage4sReceiptDigest === 'string' && stage4uReceipt.prerequisiteDigests.stage4sReceiptDigest.length === 64, 'Stage 4s receipt digest must be present', stage4uReceipt.prerequisiteDigests),
      gate('stage4r_receipt_digest_present', typeof stage4uReceipt.prerequisiteDigests?.stage4rReceiptDigest === 'string' && stage4uReceipt.prerequisiteDigests.stage4rReceiptDigest.length === 64, 'Stage 4r receipt digest must be present', stage4uReceipt.prerequisiteDigests),
      gate('stage4q_receipt_digest_present', typeof stage4uReceipt.prerequisiteDigests?.stage4qReceiptDigest === 'string' && stage4uReceipt.prerequisiteDigests.stage4qReceiptDigest.length === 64, 'Stage 4q receipt digest must be present', stage4uReceipt.prerequisiteDigests),
      gate('stage4p_receipt_digest_present', typeof stage4uReceipt.prerequisiteDigests?.stage4pReceiptDigest === 'string' && stage4uReceipt.prerequisiteDigests.stage4pReceiptDigest.length === 64, 'Stage 4p receipt digest must be present', stage4uReceipt.prerequisiteDigests),
      gate('stage4o_receipt_digest_present', typeof stage4uReceipt.prerequisiteDigests?.stage4oReceiptDigest === 'string' && stage4uReceipt.prerequisiteDigests.stage4oReceiptDigest.length === 64, 'Stage 4o receipt digest must be present', stage4uReceipt.prerequisiteDigests),
      gate('stage4n_receipt_digest_present', typeof stage4uReceipt.prerequisiteDigests?.stage4nReceiptDigest === 'string' && stage4uReceipt.prerequisiteDigests.stage4nReceiptDigest.length === 64, 'Stage 4n receipt digest must be present', stage4uReceipt.prerequisiteDigests),
      gate('stage4h_index_digest_present', typeof stage4uReceipt.prerequisiteDigests?.stage4hIndexDigest === 'string' && stage4uReceipt.prerequisiteDigests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', stage4uReceipt.prerequisiteDigests),
      gate('stage4h_source_digest_present', typeof stage4uReceipt.prerequisiteDigests?.stage4hSourceDigest === 'string' && stage4uReceipt.prerequisiteDigests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', stage4uReceipt.prerequisiteDigests),
      gate('receipt_linkage_digest_present', typeof stage4uReceipt.prerequisiteDigests?.receiptLinkageDigest === 'string' && stage4uReceipt.prerequisiteDigests.receiptLinkageDigest.length === 64, 'receipt linkage digest must be present', stage4uReceipt.prerequisiteDigests),
      gate('owner_approval_approved', stage4uReceipt.ownerApproval?.status === 'approved', 'Stage 4u owner approval must remain approved', stage4uReceipt.ownerApproval),
      gate('rollback_plan_required', stage4uReceipt.rollbackPlan?.required === true && Array.isArray(stage4uReceipt.rollbackPlan.steps) && stage4uReceipt.rollbackPlan.steps.length > 0, 'Stage 4u rollback plan must remain present', stage4uReceipt.rollbackPlan),
      gate('no_runtime_activation_in_stage4u', stage4uReceipt.governance?.runtimeActivationApplied === false, 'Stage 4u must not apply runtime activation', stage4uReceipt.governance),
      gate('no_endpoint_in_stage4u', stage4uReceipt.governance?.endpoint === false, 'Stage 4u must not approve endpoint', stage4uReceipt.governance),
    ],
    digests: {
      stage4uReceiptDigest: sha256(stage4uReceipt),
      stage4tReceiptDigest: stage4uReceipt.stage4tReceiptDigest,
      stage4sReceiptDigest: stage4uReceipt.prerequisiteDigests?.stage4sReceiptDigest,
      stage4rReceiptDigest: stage4uReceipt.prerequisiteDigests?.stage4rReceiptDigest,
      stage4qReceiptDigest: stage4uReceipt.prerequisiteDigests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4uReceipt.prerequisiteDigests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4uReceipt.prerequisiteDigests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4uReceipt.prerequisiteDigests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4uReceipt.prerequisiteDigests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4uReceipt.prerequisiteDigests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4uReceipt.prerequisiteDigests?.receiptLinkageDigest,
    },
  };
}

function buildReceipt({ design, stage4uReceipt, gates, blockers, digests, moduleInfo, loadedIndex, queryResults, runAt }) {
  const passed = blockers.length === 0;
  const designDigest = sha256(design);
  return {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeLocalActivationDryRunReceipt',
    version: 'v1',
    authority: 'local_activation_dry_run_only',
    status: passed ? 'passed' : 'blocked',
    eligibility: passed ? 'eligible_for_local_runtime_activation_state_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'local_runtime_activation_dry_run',
    engine: design.engine,
    digests: {
      designDigest,
      stage4uReceiptDigest: digests.stage4uReceiptDigest,
      stage4tReceiptDigest: digests.stage4tReceiptDigest,
      stage4sReceiptDigest: digests.stage4sReceiptDigest,
      stage4rReceiptDigest: digests.stage4rReceiptDigest,
      stage4qReceiptDigest: digests.stage4qReceiptDigest,
      stage4pReceiptDigest: digests.stage4pReceiptDigest,
      stage4oReceiptDigest: digests.stage4oReceiptDigest,
      stage4nReceiptDigest: digests.stage4nReceiptDigest,
      stage4hIndexDigest: digests.stage4hIndexDigest || loadedIndex?.digests?.indexDigest,
      stage4hSourceDigest: digests.stage4hSourceDigest || loadedIndex?.digests?.sourceDigest,
      receiptLinkageDigest: digests.receiptLinkageDigest,
    },
    ownerApproval: stage4uReceipt.ownerApproval,
    activationIntent: stage4uReceipt.activationIntent,
    module: {
      path: design.module?.path,
      importable: moduleInfo?.importable === true,
      bindingsPresent: moduleInfo?.bindingsPresent === true,
      activationApplied: false,
    },
    artifact: loadedIndex ? {
      path: design.artifact?.path,
      indexDigest: loadedIndex.digests.indexDigest,
      sourceDigest: loadedIndex.digests.sourceDigest,
      documentCount: loadedIndex.artifact.documentCount,
      readOnly: true,
    } : undefined,
    commandsExecuted: passed ? [
      design.commands.verifyStage4uDigest,
      design.commands.loadLocalRuntimeBinding,
      design.commands.queryLocalRuntimeBinding,
      design.commands.verifyActivationNotApplied,
    ] : [],
    rollbackNotes: design.rollbackNotes,
    queryResults,
    governance: {
      readOnly: true,
      proposalOnly: true,
      dryRunOnly: true,
      runtimeActivationApplied: false,
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
      policySource: 'local_runtime_activation_dry_run_plus_stage4u_decision_receipt',
      reason: passed
        ? 'Local activation dry-run verified the decision digest chain, module import and bindings, read-only artifact load, tenant-scoped candidate-only queries, evidence refs and that activation was still not applied.'
        : 'Local activation dry-run failed decision, digest, module, query, evidence or governance gates.',
      nextAllowedStep: passed ? 'local_runtime_activation_state_review' : 'repair_local_runtime_activation_dry_run',
      activationApplied: false,
    },
  };
}

export async function runVectorRuntimeLocalActivationDryRun({ designPath, stage4uReceiptPath, artifactPath, receiptPath, runAt, runtimeRoot } = {}) {
  if (!existsSync(designPath)) throw new Error(`local activation dry-run design file not found: ${designPath}`);
  if (!existsSync(stage4uReceiptPath)) throw new Error(`Stage 4u receipt file not found: ${stage4uReceiptPath}`);
  const design = readJson(designPath);
  const stage4uReceipt = readJson(stage4uReceiptPath);
  const continuity = validateDigestContinuity(stage4uReceipt);
  let gates = {
    design: validateDesign(design, stage4uReceipt),
    continuity: continuity.gates,
  };
  let blockers = flattenBlockers(gates);
  if (blockers.length > 0) {
    const receipt = buildReceipt({ design, stage4uReceipt, gates, blockers, digests: continuity.digests, runAt });
    if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    return receipt;
  }

  const resolvedRuntimeRoot = runtimeRoot || path.resolve(path.dirname(designPath), '..');
  const resolvedArtifactPath = artifactPath || path.resolve(resolvedRuntimeRoot, design.artifact.path);
  const resolvedModulePath = path.resolve(resolvedRuntimeRoot, design.module.path);
  const module = await loadModule(resolvedModulePath);
  const requiredBindings = design.module.requiredBindings;
  const moduleInfo = {
    importable: true,
    bindingsPresent: requiredBindings.every((binding) => typeof module[binding] === 'function'),
  };
  gates.module = [
    gate('module_importable', moduleInfo.importable === true, 'module must be importable', { modulePath: resolvedModulePath }),
    gate('bindings_present', moduleInfo.bindingsPresent === true, 'all required bindings must be present', { requiredBindings }),
  ];
  blockers = flattenBlockers(gates);
  if (blockers.length > 0) {
    const receipt = buildReceipt({ design, stage4uReceipt, gates, blockers, digests: continuity.digests, moduleInfo, runAt });
    if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    return receipt;
  }

  const loadedIndex = module.loadIndexArtifact({
    artifactPath: resolvedArtifactPath,
    expectedIndexDigest: continuity.digests.stage4hIndexDigest,
    expectedSourceDigest: continuity.digests.stage4hSourceDigest,
  });
  gates.artifact = [
    gate('artifact_read_only', loadedIndex?.decisionTrace?.artifactReadOnly === true, 'artifact must load read-only', loadedIndex),
    gate('artifact_index_digest_match', loadedIndex?.digests?.indexDigest === continuity.digests.stage4hIndexDigest, 'artifact index digest must match Stage 4h digest', { loadedIndex, expectedDigest: continuity.digests.stage4hIndexDigest }),
    gate('artifact_source_digest_match', loadedIndex?.digests?.sourceDigest === continuity.digests.stage4hSourceDigest, 'artifact source digest must match Stage 4h source digest', { loadedIndex, expectedDigest: continuity.digests.stage4hSourceDigest }),
  ];
  blockers = flattenBlockers(gates);
  if (blockers.length > 0) {
    const receipt = buildReceipt({ design, stage4uReceipt, gates, blockers, digests: continuity.digests, moduleInfo, loadedIndex, runAt });
    if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    return receipt;
  }

  const queryResults = design.queries.map((query) => {
    const result = module.queryCandidates({
      loadedIndex,
      tenant: query.tenant,
      query: query.query,
      topK: query.topK,
      minScore: query.minScore,
    });
    const candidateIds = result.candidates.map((candidate) => candidate.candidateId);
    const evidenceVerification = module.verifyClaimEvidence({ candidates: result.candidates });
    return {
      id: query.id,
      status: candidateIds.some((id) => query.expectedCandidateIds.includes(id)) && evidenceVerification.passed ? 'passed' : 'blocked',
      tenant: query.tenant,
      candidateIds,
      expectedCandidateIds: query.expectedCandidateIds,
      hits: candidateIds.filter((id) => query.expectedCandidateIds.includes(id)),
      evidenceVerification,
      decisionTrace: result.decisionTrace,
      candidates: result.candidates,
    };
  });
  gates.queries = queryResults.flatMap((result) => [
    gate(`query_${result.id}_passed`, result.status === 'passed', 'query must return expected candidate with verified evidence', result),
    gate(`query_${result.id}_tenant_scope`, result.decisionTrace.tenantScope === result.tenant, 'tenant scope must remain enforced', result.decisionTrace),
    gate(`query_${result.id}_candidates_only`, result.decisionTrace.candidatesOnly === true, 'query must remain candidates-only', result.decisionTrace),
    gate(`query_${result.id}_activation_not_applied`, result.decisionTrace.answerGeneration === false, 'activation dry-run must not generate answers or apply activation', result.decisionTrace),
  ]);
  blockers = flattenBlockers(gates);

  const receipt = buildReceipt({ design, stage4uReceipt, gates, blockers, digests: continuity.digests, moduleInfo, loadedIndex, queryResults, runAt });
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = await runVectorRuntimeLocalActivationDryRun({
      designPath: option('--design') || path.resolve(process.cwd(), 'config/vector-runtime-local-activation-dry-run.v1.json'),
      stage4uReceiptPath: option('--stage4u-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-activation-decision-receipt.v1.json'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-activation-dry-run-receipt.v1.json'),
    });
    console.log(`Vector runtime local activation dry-run complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
  } catch (error) {
    console.error(`Vector runtime local activation dry-run failed: ${error.message}`);
    process.exitCode = 1;
  }
}
