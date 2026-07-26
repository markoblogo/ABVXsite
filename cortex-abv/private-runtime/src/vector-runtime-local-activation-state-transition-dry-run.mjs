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
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
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

function validateDesign(design, stage4yReceipt) {
  requireObject(design, 'design');
  const gates = [
    gate('kind', design.kind === 'CortexABVVectorRuntimeLocalActivationStateTransitionDryRun', 'design kind must match', { kind: design.kind }),
    gate('version', design.version === 'v1', 'design version must be v1', { version: design.version }),
    gate('authority', design.authority === 'local_activation_state_transition_dry_run_only', 'design authority must be local_activation_state_transition_dry_run_only', { authority: design.authority }),
    gate('engine', design.engine === 'turbovec', 'design engine must be turbovec', { engine: design.engine }),
  ];

  requireObject(design.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4y_kind', stage4yReceipt.kind === design.prerequisites.requiredTransitionArtifactReceiptKind, 'Stage 4y receipt kind must match', { kind: stage4yReceipt.kind }),
    gate('stage4y_status', stage4yReceipt.status === design.prerequisites.requiredTransitionArtifactStatus, 'Stage 4y receipt status must be passed', { status: stage4yReceipt.status }),
    gate('stage4y_eligibility', stage4yReceipt.eligibility === design.prerequisites.requiredTransitionArtifactEligibility, 'Stage 4y receipt eligibility must match', { eligibility: stage4yReceipt.eligibility }),
    gate('stage4y_no_blockers', Array.isArray(stage4yReceipt.blockers) && stage4yReceipt.blockers.length === 0, 'Stage 4y receipt must have no blockers', { blockers: stage4yReceipt.blockers }),
    gate('stage4y_digest_required', design.prerequisites.requiresTransitionArtifactReceiptDigest === true, 'Stage 4y receipt digest must be required', design.prerequisites),
  );

  requireObject(design.module, 'module');
  requireArray(design.module.requiredBindings, 'module.requiredBindings');
  gates.push(
    gate('module_path', design.module.path === stage4yReceipt.transitionIntent?.allowedModulePath, 'module path must match Stage 4y transition intent', { module: design.module, allowedModulePath: stage4yReceipt.transitionIntent?.allowedModulePath }),
    gate('module_type', design.module.type === stage4yReceipt.transitionIntent?.transitionMode, 'module type must match Stage 4y transition mode', { module: design.module, transitionMode: stage4yReceipt.transitionIntent?.transitionMode }),
    gate('required_bindings', design.module.requiredBindings.every((binding) => stage4yReceipt.transitionIntent?.allowedBindings?.includes(binding)), 'required bindings must be Stage 4y allowlisted', { requiredBindings: design.module.requiredBindings, allowedBindings: stage4yReceipt.transitionIntent?.allowedBindings }),
  );

  requireObject(design.artifact, 'artifact');
  gates.push(
    gate('artifact_path', design.artifact.path === 'data/vector-indexes/turbovec-poc/index-artifact.v1.json', 'artifact path must match fixed local artifact path', design.artifact),
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
  const suffix = '_local_activation_state_transition_dry_run';
  for (const [key, command] of Object.entries(design.commands)) {
    gates.push(gate(`command_${key}`, typeof command === 'string' && command.endsWith(suffix), `${key} command must use ${suffix} suffix`, { command }));
  }

  requireObject(design.checks, 'checks');
  for (const [key, expected] of Object.entries({
    requiresModuleImportable: true,
    requiresBindingsPresent: true,
    requiresArtifactReadOnly: true,
    requiresStage4xReceiptDigest: true,
    requiresStage4wReceiptDigest: true,
    requiresStage4vReceiptDigest: true,
    requiresStage4uReceiptDigest: true,
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
    requiresTransitionNotApplied: true,
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
    stateTransitionApplied: false,
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

function validateDigestContinuity(stage4yReceipt) {
  return {
    gates: [
      gate('stage4x_receipt_digest_present', typeof stage4yReceipt.stage4xReceiptDigest === 'string' && stage4yReceipt.stage4xReceiptDigest.length === 64, 'Stage 4x receipt digest must be present', { stage4xReceiptDigest: stage4yReceipt.stage4xReceiptDigest }),
      gate('stage4w_receipt_digest_present', typeof stage4yReceipt.prerequisiteDigests?.stage4wReceiptDigest === 'string' && stage4yReceipt.prerequisiteDigests.stage4wReceiptDigest.length === 64, 'Stage 4w receipt digest must be present', stage4yReceipt.prerequisiteDigests),
      gate('stage4v_receipt_digest_present', typeof stage4yReceipt.prerequisiteDigests?.stage4vReceiptDigest === 'string' && stage4yReceipt.prerequisiteDigests.stage4vReceiptDigest.length === 64, 'Stage 4v receipt digest must be present', stage4yReceipt.prerequisiteDigests),
      gate('stage4u_receipt_digest_present', typeof stage4yReceipt.prerequisiteDigests?.stage4uReceiptDigest === 'string' && stage4yReceipt.prerequisiteDigests.stage4uReceiptDigest.length === 64, 'Stage 4u receipt digest must be present', stage4yReceipt.prerequisiteDigests),
      gate('stage4t_receipt_digest_present', typeof stage4yReceipt.prerequisiteDigests?.stage4tReceiptDigest === 'string' && stage4yReceipt.prerequisiteDigests.stage4tReceiptDigest.length === 64, 'Stage 4t receipt digest must be present', stage4yReceipt.prerequisiteDigests),
      gate('stage4s_receipt_digest_present', typeof stage4yReceipt.prerequisiteDigests?.stage4sReceiptDigest === 'string' && stage4yReceipt.prerequisiteDigests.stage4sReceiptDigest.length === 64, 'Stage 4s receipt digest must be present', stage4yReceipt.prerequisiteDigests),
      gate('stage4r_receipt_digest_present', typeof stage4yReceipt.prerequisiteDigests?.stage4rReceiptDigest === 'string' && stage4yReceipt.prerequisiteDigests.stage4rReceiptDigest.length === 64, 'Stage 4r receipt digest must be present', stage4yReceipt.prerequisiteDigests),
      gate('stage4q_receipt_digest_present', typeof stage4yReceipt.prerequisiteDigests?.stage4qReceiptDigest === 'string' && stage4yReceipt.prerequisiteDigests.stage4qReceiptDigest.length === 64, 'Stage 4q receipt digest must be present', stage4yReceipt.prerequisiteDigests),
      gate('stage4p_receipt_digest_present', typeof stage4yReceipt.prerequisiteDigests?.stage4pReceiptDigest === 'string' && stage4yReceipt.prerequisiteDigests.stage4pReceiptDigest.length === 64, 'Stage 4p receipt digest must be present', stage4yReceipt.prerequisiteDigests),
      gate('stage4o_receipt_digest_present', typeof stage4yReceipt.prerequisiteDigests?.stage4oReceiptDigest === 'string' && stage4yReceipt.prerequisiteDigests.stage4oReceiptDigest.length === 64, 'Stage 4o receipt digest must be present', stage4yReceipt.prerequisiteDigests),
      gate('stage4n_receipt_digest_present', typeof stage4yReceipt.prerequisiteDigests?.stage4nReceiptDigest === 'string' && stage4yReceipt.prerequisiteDigests.stage4nReceiptDigest.length === 64, 'Stage 4n receipt digest must be present', stage4yReceipt.prerequisiteDigests),
      gate('stage4h_index_digest_present', typeof stage4yReceipt.prerequisiteDigests?.stage4hIndexDigest === 'string' && stage4yReceipt.prerequisiteDigests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', stage4yReceipt.prerequisiteDigests),
      gate('stage4h_source_digest_present', typeof stage4yReceipt.prerequisiteDigests?.stage4hSourceDigest === 'string' && stage4yReceipt.prerequisiteDigests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', stage4yReceipt.prerequisiteDigests),
      gate('receipt_linkage_digest_present', typeof stage4yReceipt.prerequisiteDigests?.receiptLinkageDigest === 'string' && stage4yReceipt.prerequisiteDigests.receiptLinkageDigest.length === 64, 'receipt linkage digest must be present', stage4yReceipt.prerequisiteDigests),
      gate('owner_approval_approved', stage4yReceipt.ownerApproval?.status === 'approved', 'Stage 4y owner approval must remain approved', stage4yReceipt.ownerApproval),
      gate('rollback_plan_required', stage4yReceipt.rollbackPlan?.required === true && Array.isArray(stage4yReceipt.rollbackPlan.steps) && stage4yReceipt.rollbackPlan.steps.length > 0, 'Stage 4y rollback plan must remain present', stage4yReceipt.rollbackPlan),
      gate('no_transition_applied_in_stage4y', stage4yReceipt.transitionIntent?.transitionAppliedHere === false, 'Stage 4y must not apply transition', stage4yReceipt.transitionIntent),
      gate('no_endpoint_in_stage4y', stage4yReceipt.governance?.endpoint === false, 'Stage 4y must not approve endpoint', stage4yReceipt.governance),
    ],
    digests: {
      stage4yReceiptDigest: sha256(stage4yReceipt),
      stage4xReceiptDigest: stage4yReceipt.stage4xReceiptDigest,
      stage4wReceiptDigest: stage4yReceipt.prerequisiteDigests?.stage4wReceiptDigest,
      stage4vReceiptDigest: stage4yReceipt.prerequisiteDigests?.stage4vReceiptDigest,
      stage4uReceiptDigest: stage4yReceipt.prerequisiteDigests?.stage4uReceiptDigest,
      stage4tReceiptDigest: stage4yReceipt.prerequisiteDigests?.stage4tReceiptDigest,
      stage4sReceiptDigest: stage4yReceipt.prerequisiteDigests?.stage4sReceiptDigest,
      stage4rReceiptDigest: stage4yReceipt.prerequisiteDigests?.stage4rReceiptDigest,
      stage4qReceiptDigest: stage4yReceipt.prerequisiteDigests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4yReceipt.prerequisiteDigests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4yReceipt.prerequisiteDigests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4yReceipt.prerequisiteDigests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4yReceipt.prerequisiteDigests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4yReceipt.prerequisiteDigests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4yReceipt.prerequisiteDigests?.receiptLinkageDigest,
    },
  };
}

function buildReceipt({ design, stage4yReceipt, gates, blockers, digests, moduleInfo, loadedIndex, queryResults, runAt }) {
  const passed = blockers.length === 0;
  const designDigest = sha256(design);
  return {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeLocalActivationStateTransitionDryRunReceipt',
    version: 'v1',
    authority: 'local_activation_state_transition_dry_run_only',
    status: passed ? 'passed' : 'blocked',
    eligibility: passed ? 'eligible_for_local_transition_state_effect_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'local_runtime_activation_state_transition_dry_run',
    engine: design.engine,
    digests: {
      designDigest,
      stage4yReceiptDigest: digests.stage4yReceiptDigest,
      stage4xReceiptDigest: digests.stage4xReceiptDigest,
      stage4wReceiptDigest: digests.stage4wReceiptDigest,
      stage4vReceiptDigest: digests.stage4vReceiptDigest,
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
    ownerApproval: stage4yReceipt.ownerApproval,
    transitionIntent: stage4yReceipt.transitionIntent,
    module: {
      path: design.module?.path,
      importable: moduleInfo?.importable === true,
      bindingsPresent: moduleInfo?.bindingsPresent === true,
      transitionApplied: false,
    },
    artifact: loadedIndex ? {
      path: design.artifact?.path,
      indexDigest: loadedIndex.digests.indexDigest,
      sourceDigest: loadedIndex.digests.sourceDigest,
      documentCount: loadedIndex.artifact.documentCount,
      readOnly: true,
    } : undefined,
    commandsExecuted: passed ? [
      design.commands.verifyStage4yDigest,
      design.commands.loadLocalRuntimeBinding,
      design.commands.queryLocalRuntimeBinding,
      design.commands.verifyTransitionNotApplied,
    ] : [],
    rollbackNotes: design.rollbackNotes,
    queryResults,
    governance: {
      readOnly: true,
      proposalOnly: true,
      dryRunOnly: true,
      runtimeActivationApplied: false,
      stateTransitionApplied: false,
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
      policySource: 'local_activation_state_transition_dry_run_plus_stage4y_transition_artifact',
      reason: passed
        ? 'Local transition dry-run verified the transition artifact digest chain, module import and bindings, read-only artifact load, tenant-scoped candidate-only queries, evidence refs and that no transition was applied.'
        : 'Local transition dry-run failed artifact, digest, module, query, evidence or governance gates.',
      nextAllowedStep: passed ? 'local_transition_state_effect_review' : 'repair_local_activation_state_transition_dry_run',
      activationApplied: false,
      stateTransitionApplied: false,
    },
  };
}

export async function runVectorRuntimeLocalActivationStateTransitionDryRun({ designPath, stage4yReceiptPath, artifactPath, receiptPath, runAt, runtimeRoot } = {}) {
  if (!existsSync(designPath)) throw new Error(`local activation state transition dry-run design file not found: ${designPath}`);
  if (!existsSync(stage4yReceiptPath)) throw new Error(`Stage 4y receipt file not found: ${stage4yReceiptPath}`);
  const design = readJson(designPath);
  const stage4yReceipt = readJson(stage4yReceiptPath);
  const continuity = validateDigestContinuity(stage4yReceipt);
  let gates = {
    design: validateDesign(design, stage4yReceipt),
    continuity: continuity.gates,
  };
  let blockers = flattenBlockers(gates);
  if (blockers.length > 0) {
    const receipt = buildReceipt({ design, stage4yReceipt, gates, blockers, digests: continuity.digests, runAt });
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
    const receipt = buildReceipt({ design, stage4yReceipt, gates, blockers, digests: continuity.digests, moduleInfo, runAt });
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
    const receipt = buildReceipt({ design, stage4yReceipt, gates, blockers, digests: continuity.digests, moduleInfo, loadedIndex, runAt });
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
    gate(`query_${result.id}_transition_not_applied`, result.decisionTrace.answerGeneration === false, 'transition dry-run must not generate answers or apply transition', result.decisionTrace),
  ]);
  blockers = flattenBlockers(gates);

  const receipt = buildReceipt({ design, stage4yReceipt, gates, blockers, digests: continuity.digests, moduleInfo, loadedIndex, queryResults, runAt });
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = await runVectorRuntimeLocalActivationStateTransitionDryRun({
      designPath: option('--design') || path.resolve(process.cwd(), 'config/vector-runtime-local-activation-state-transition-dry-run.v1.json'),
      stage4yReceiptPath: option('--stage4y-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-activation-state-transition-receipt.v1.json'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-activation-state-transition-dry-run-receipt.v1.json'),
    });
    console.log(`Vector runtime local activation state transition dry-run complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
  } catch (error) {
    console.error(`Vector runtime local activation state transition dry-run failed: ${error.message}`);
    process.exitCode = 1;
  }
}
