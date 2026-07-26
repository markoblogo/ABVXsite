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

function validateDryRunDesign(design, stage4aeReceipt) {
  requireObject(design, 'design');
  const gates = [
    gate('kind', design.kind === 'CortexABVVectorRuntimeLocalEffectTransitionDryRun', 'design kind must match', { kind: design.kind }),
    gate('version', design.version === 'v1', 'design version must be v1', { version: design.version }),
    gate('authority', design.authority === 'local_effect_transition_dry_run_only', 'design authority must be local_effect_transition_dry_run_only', { authority: design.authority }),
    gate('engine', design.engine === 'turbovec', 'design engine must be turbovec', { engine: design.engine }),
  ];

  requireObject(design.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4ae_kind', stage4aeReceipt.kind === design.prerequisites.requiredEffectTransitionArtifactKind, 'Stage 4ae artifact receipt kind must match', { kind: stage4aeReceipt.kind }),
    gate('stage4ae_status', stage4aeReceipt.status === design.prerequisites.requiredEffectTransitionArtifactStatus, 'Stage 4ae artifact receipt status must be passed', { status: stage4aeReceipt.status }),
    gate('stage4ae_eligibility', stage4aeReceipt.eligibility === design.prerequisites.requiredEffectTransitionArtifactEligibility, 'Stage 4ae artifact eligibility must match', { eligibility: stage4aeReceipt.eligibility }),
    gate('stage4ae_no_blockers', Array.isArray(stage4aeReceipt.blockers) && stage4aeReceipt.blockers.length === 0, 'Stage 4ae artifact receipt must have no blockers', { blockers: stage4aeReceipt.blockers }),
    gate('stage4ae_digest_required', design.prerequisites.requiresEffectTransitionArtifactDigest === true, 'Stage 4ae artifact receipt digest must be required', design.prerequisites),
  );

  requireObject(design.module, 'module');
  requireArray(design.module.requiredBindings, 'module.requiredBindings');
  gates.push(
    gate('module_path', stage4aeReceipt.effectTransitionDefinition?.requiredModulePath === design.module.path, 'module path must match Stage 4ae transition intent', {
      modulePath: design.module.path,
      requiredModulePath: stage4aeReceipt.effectTransitionDefinition?.requiredModulePath,
    }),
    gate('module_type', stage4aeReceipt.effectTransitionDefinition?.transitionMode === design.module.type, 'module type must match Stage 4ae transition mode', {
      moduleType: design.module.type,
      transitionMode: stage4aeReceipt.effectTransitionDefinition?.transitionMode,
    }),
    gate(
      'module_bindings',
      stage4aeReceipt.effectTransitionDefinition?.allowedBindings?.every((binding) => design.module.requiredBindings.includes(binding)),
      'required bindings must match Stage 4ae allowlisted bindings',
      { requiredBindings: design.module.requiredBindings, allowedBindings: stage4aeReceipt.effectTransitionDefinition?.allowedBindings },
    ),
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
  const suffix = '_local_effect_transition_dry_run';
  for (const [key, command] of Object.entries(design.commands)) {
    gates.push(gate(`command_${key}`, typeof command === 'string' && command.endsWith(suffix), `${key} command must use ${suffix} suffix`, { command }));
  }

  requireObject(design.checks, 'checks');
  for (const [key, expected] of Object.entries({
    requiresModuleImportable: true,
    requiresBindingsPresent: true,
    requiresArtifactReadOnly: true,
    requiresStage4acReceiptDigest: true,
    requiresStage4aaReceiptDigest: true,
    requiresStage4zReceiptDigest: true,
    requiresStage4yReceiptDigest: true,
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
    requiresReceiptLinkageDigest: true,
    requiresTenantScope: true,
    requiresCandidatesOnly: true,
    requiresEvidenceRefs: true,
    requiresTransitionNotApplied: true,
    requiresStateTransitionNotApplied: true,
    requiresActivationNotApplied: true,
    requiresRollbackReadiness: true,
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
    localEffectTransitionDryRunOnly: true,
    runtimeActivationApplied: false,
    stateTransitionApplied: false,
    effectTransitionApplied: false,
    runtimeIntegration: false,
    endpoint: false,
    scheduler: false,
    networkCalls: false,
    llmCalls: false,
    artifactMutation: false,
    sourceMutation: false,
    writesOutsideReceipt: false,
    publicActionAuthority: false,
  })) {
    gates.push(gate(`governance_${key}`, design.governance[key] === expected, `governance.${key} must be ${expected}`, design.governance));
  }

  return gates;
}

function validateStage4aeReceipt(receipt, design) {
  const td = receipt.effectTransitionDefinition || {};
  const ts = receipt.effectTransitionSummary || {};
  return [
    gate('kind', receipt.kind === 'CortexABVVectorRuntimeLocalEffectTransitionReceipt', 'receipt kind must be Stage 4ae receipt kind', { kind: receipt.kind }),
    gate('status', receipt.status === design.prerequisites.requiredEffectTransitionArtifactStatus, 'receipt status must be passed', { status: receipt.status }),
    gate('eligibility', receipt.eligibility === 'eligible_for_local_effect_transition_dry_run', 'receipt eligibility must match expected dry-run eligibility', { eligibility: receipt.eligibility }),
    gate('no_blockers', Array.isArray(receipt.blockers) && receipt.blockers.length === 0, 'receipt must have no blockers', { blockers: receipt.blockers }),
    gate('stage4ad_receipt_digest_present', typeof receipt.stage4adReceiptDigest === 'string' && receipt.stage4adReceiptDigest.length === 64, 'Stage 4ad receipt digest must be present', { stage4adReceiptDigest: receipt.stage4adReceiptDigest }),
    gate('transition_scope_match', td.transitionScope === 'strictly_local_receipt_only', 'transition scope must stay strict local receipt-only', { transitionScope: td.transitionScope }),
    gate('transition_source_state_match', td.sourceState === 'bounded_owner_initiated_local_active_runtime_candidate', 'transition source state must match Stage 4ae boundary', { sourceState: td.sourceState }),
    gate('transition_target_state_match', td.targetState === 'bounded_owner_approved_local_effect_transition_candidate', 'transition target state must match Stage 4ae boundary', { targetState: td.targetState }),
    gate(
      'transition_steps_match',
      JSON.stringify(td.allowedLocalDecisionSteps) === JSON.stringify([
        'candidate_query_preview',
        'claim_evidence_verification',
        'rollback_readiness_review',
        'proposal_alignment_review',
      ]),
      'allowed local transition steps must stay aligned',
      td,
    ),
    gate(
      'transition_bindings_match',
      JSON.stringify((td.allowedBindings || []).sort()) === JSON.stringify(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence'].sort()),
      'allowed bindings must stay aligned',
      td,
    ),
    gate('transition_mode_match', td.transitionMode === design.module.type, 'transition mode must match design module type', {
      transitionMode: td.transitionMode,
      moduleType: design.module.type,
    }),
    gate('transition_module_path_match', td.requiredModulePath === design.module.path, 'required module path must match design', {
      requiredModulePath: td.requiredModulePath,
      designModulePath: design.module.path,
    }),
    gate('transition_not_applied_here', td.effectTransitionAppliedHere === false, 'effect transition must not be applied in Stage 4ae artifact', td),
    gate('state_transition_not_applied_here', td.stateTransitionAppliedHere === false, 'state transition must not be applied in Stage 4ae artifact', td),
    gate('activation_not_applied_here', td.runtimeActivationAppliedHere === false, 'runtime activation must not be applied in Stage 4ae artifact', td),
    gate('effect_execution_planned', ts.effectExecutionPlanned === false, 'effect execution should not be planned in Stage 4ae artifact', ts),
    gate('candidate_query_ready', ts.candidateQueryPreviewReady === true, 'Stage 4ae candidate query readiness must be true', ts),
    gate('evidence_ready', ts.claimEvidenceVerificationReady === true, 'Stage 4ae claim-evidence readiness must be true', ts),
    gate('rollback_readiness', ts.rollbackReadinessPlanned === true, 'Stage 4ae rollback readiness must be planned', ts),
    gate('proposal_alignment', ts.proposalAlignmentConfirmed === true, 'Stage 4ae proposal alignment must be confirmed', ts),
    gate('owner_status', receipt.ownerApproval?.status === 'approved', 'Stage 4ae owner approval status must remain approved', receipt.ownerApproval),
    gate(
      'no_transition_in_stage4ae',
      receipt.governance?.stateTransitionApplied === false,
      'Stage 4ae governance must not allow state transition',
      receipt.governance,
    ),
    gate(
      'no_activation_in_stage4ae',
      receipt.governance?.runtimeActivationApplied === false,
      'Stage 4ae governance must not allow runtime activation',
      receipt.governance,
    ),
  ];
}

function validateDigestContinuity(stage4aeReceipt) {
  return {
    gates: [
      gate('stage4ad_receipt_digest_present', typeof stage4aeReceipt.stage4adReceiptDigest === 'string' && stage4aeReceipt.stage4adReceiptDigest.length === 64, 'Stage 4ad receipt digest must be present', { stage4adReceiptDigest: stage4aeReceipt.stage4adReceiptDigest }),
      gate('stage4ac_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4acReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4acReceiptDigest.length === 64, 'Stage 4ac receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4aa_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4aaReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4aaReceiptDigest.length === 64, 'Stage 4aa receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4z_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4zReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4zReceiptDigest.length === 64, 'Stage 4z receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4y_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4yReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4yReceiptDigest.length === 64, 'Stage 4y receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4x_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4xReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4xReceiptDigest.length === 64, 'Stage 4x receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4w_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4wReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4wReceiptDigest.length === 64, 'Stage 4w receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4v_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4vReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4vReceiptDigest.length === 64, 'Stage 4v receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4u_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4uReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4uReceiptDigest.length === 64, 'Stage 4u receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4t_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4tReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4tReceiptDigest.length === 64, 'Stage 4t receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4s_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4sReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4sReceiptDigest.length === 64, 'Stage 4s receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4r_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4rReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4rReceiptDigest.length === 64, 'Stage 4r receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4q_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4qReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4qReceiptDigest.length === 64, 'Stage 4q receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4p_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4pReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4pReceiptDigest.length === 64, 'Stage 4p receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4o_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4oReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4oReceiptDigest.length === 64, 'Stage 4o receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4n_receipt_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4nReceiptDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4nReceiptDigest.length === 64, 'Stage 4n receipt digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4h_index_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4hIndexDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('stage4h_source_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.stage4hSourceDigest === 'string' && stage4aeReceipt.prerequisiteDigests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('receipt_linkage_digest_present', typeof stage4aeReceipt.prerequisiteDigests?.receiptLinkageDigest === 'string' && stage4aeReceipt.prerequisiteDigests.receiptLinkageDigest.length === 64, 'receipt linkage digest must be present', stage4aeReceipt.prerequisiteDigests),
      gate('no_transition_in_prereq', stage4aeReceipt.governance?.stateTransitionApplied === false, 'Stage 4ae governance must not allow state transition', stage4aeReceipt.governance),
      gate('no_activation_in_prereq', stage4aeReceipt.governance?.runtimeActivationApplied === false, 'Stage 4ae governance must not allow activation', stage4aeReceipt.governance),
    ],
    digests: {
      stage4aeReceiptDigest: sha256(stage4aeReceipt),
      stage4acReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4acReceiptDigest,
      stage4aaReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4aaReceiptDigest,
      stage4zReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4zReceiptDigest,
      stage4yReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4yReceiptDigest,
      stage4xReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4xReceiptDigest,
      stage4wReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4wReceiptDigest,
      stage4vReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4vReceiptDigest,
      stage4uReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4uReceiptDigest,
      stage4tReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4tReceiptDigest,
      stage4sReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4sReceiptDigest,
      stage4rReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4rReceiptDigest,
      stage4qReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4aeReceipt.prerequisiteDigests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4aeReceipt.prerequisiteDigests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4aeReceipt.prerequisiteDigests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4aeReceipt.prerequisiteDigests?.receiptLinkageDigest,
      stage4adReceiptDigest: stage4aeReceipt.stage4adReceiptDigest,
    },
  };
}

async function loadModule(modulePath) {
  return import(`file://${path.resolve(modulePath)}`);
}

function buildReceipt({
  design,
  stage4aeReceipt,
  gates,
  blockers,
  continuity,
  designPath,
  moduleInfo,
  loadedIndex,
  queryResults,
  runAt,
}) {
  const passed = blockers.length === 0;
  const designDigest = sha256(design);
  return {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeLocalEffectTransitionDryRunReceipt',
    version: 'v1',
    authority: 'local_effect_transition_dry_run_only',
    status: passed ? 'passed' : 'blocked',
    eligibility: passed ? 'eligible_for_local_transition_state_effect_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'local_effect_transition_dry_run',
    engine: design.engine,
    digests: {
      designDigest,
      stage4aeReceiptDigest: continuity.stage4aeReceiptDigest,
      stage4acReceiptDigest: continuity.stage4acReceiptDigest,
      stage4aaReceiptDigest: continuity.stage4aaReceiptDigest,
      stage4zReceiptDigest: continuity.stage4zReceiptDigest,
      stage4yReceiptDigest: continuity.stage4yReceiptDigest,
      stage4xReceiptDigest: continuity.stage4xReceiptDigest,
      stage4wReceiptDigest: continuity.stage4wReceiptDigest,
      stage4vReceiptDigest: continuity.stage4vReceiptDigest,
      stage4uReceiptDigest: continuity.stage4uReceiptDigest,
      stage4tReceiptDigest: continuity.stage4tReceiptDigest,
      stage4sReceiptDigest: continuity.stage4sReceiptDigest,
      stage4rReceiptDigest: continuity.stage4rReceiptDigest,
      stage4qReceiptDigest: continuity.stage4qReceiptDigest,
      stage4pReceiptDigest: continuity.stage4pReceiptDigest,
      stage4oReceiptDigest: continuity.stage4oReceiptDigest,
      stage4nReceiptDigest: continuity.stage4nReceiptDigest,
      stage4hIndexDigest: continuity.stage4hIndexDigest,
      stage4hSourceDigest: continuity.stage4hSourceDigest,
      receiptLinkageDigest: continuity.receiptLinkageDigest,
    },
    ownerApproval: stage4aeReceipt.ownerApproval,
    transitionIntent: stage4aeReceipt.effectTransitionDefinition,
    transitionSummary: stage4aeReceipt.effectTransitionSummary,
    rollbackPlan: stage4aeReceipt.rollbackPlan,
    nextGate: stage4aeReceipt.nextGate,
    module: {
      path: design.module?.path,
      importable: moduleInfo?.importable === true,
      bindingsPresent: moduleInfo?.bindingsPresent === true,
      effectTransitionApplied: false,
      stateTransitionApplied: false,
      runtimeActivationApplied: false,
    },
    artifact: loadedIndex ? {
      path: design.artifact?.path,
      indexDigest: loadedIndex.digests.indexDigest,
      sourceDigest: loadedIndex.digests.sourceDigest,
      documentCount: loadedIndex.artifact.documentCount || loadedIndex.artifact.documents?.length || 0,
      readOnly: true,
    } : undefined,
    commandsExecuted: passed ? [
      design.commands.verifyStage4aeReceipt,
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
      localEffectTransitionDryRunOnly: true,
      runtimeActivationApplied: false,
      stateTransitionApplied: false,
      effectTransitionApplied: false,
      runtimeIntegration: false,
      endpoint: false,
      scheduler: false,
      networkCalls: false,
      llmCalls: false,
      artifactMutation: false,
      sourceMutation: false,
      writesOutsideReceipt: false,
      publicActionAuthority: false,
    },
    sources: {
      dryRunDesign: {
        path: designPath,
        kind: design.kind,
        digest: designDigest,
      },
      localEffectTransitionReceipt: {
        path: 'receipts/vector-runtime-local-effect-transition-receipt.v1.json',
        kind: stage4aeReceipt.kind,
        status: stage4aeReceipt.status,
        eligibility: stage4aeReceipt.eligibility,
        digest: continuity.stage4aeReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'local_effect_transition_dry_run_plus_stage4ae_artifact',
      reason: passed
        ? 'Local effect transition dry-run validated artifact digest chain, module importability, read-only local artifact load, tenant-scoped candidate-only queries and verified evidence with no transition/application/activation applied.'
        : 'Local effect transition dry-run failed design, digest, module, artifact, query, evidence or governance gates.',
      nextAllowedStep: passed ? 'local_transition_state_effect_review' : 'repair_local_effect_transition_dry_run',
      effectTransitionApplied: false,
      stateTransitionApplied: false,
      runtimeActivationApplied: false,
    },
    summary: passed
      ? 'Local effect transition dry-run completed. It verifies bounded local transition intent and does not apply any transition, effect execution, or runtime activation.'
      : 'Local effect transition dry-run is not eligible.',
  };
}

export async function runVectorRuntimeLocalEffectTransitionDryRun({ designPath, stage4aeReceiptPath, artifactPath, receiptPath, runAt, runtimeRoot } = {}) {
  if (!existsSync(designPath)) throw new Error(`local effect transition dry-run design file not found: ${designPath}`);
  if (!existsSync(stage4aeReceiptPath)) throw new Error(`local effect transition artifact receipt file not found: ${stage4aeReceiptPath}`);

  const design = readJson(designPath);
  const stage4aeReceipt = readJson(stage4aeReceiptPath);
  const continuity = validateDigestContinuity(stage4aeReceipt);

  let gates = {
    design: validateDryRunDesign(design, stage4aeReceipt),
    stage4aeReceipt: validateStage4aeReceipt(stage4aeReceipt, design),
    continuity: continuity.gates,
  };
  let blockers = flattenBlockers(gates);

  if (blockers.length > 0) {
    const receipt = buildReceipt({
      design,
      stage4aeReceipt,
      gates,
      blockers,
      continuity: continuity.digests,
      designPath,
      runAt,
    });
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
    const receipt = buildReceipt({
      design,
      stage4aeReceipt,
      gates,
      blockers,
      continuity: continuity.digests,
      designPath,
      moduleInfo,
      runAt,
    });
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
    gate(
      'artifact_index_digest_match',
      loadedIndex?.digests?.indexDigest === continuity.digests.stage4hIndexDigest,
      'artifact index digest must match Stage 4h index digest',
      { loadedIndex, expectedDigest: continuity.digests.stage4hIndexDigest },
    ),
    gate(
      'artifact_source_digest_match',
      loadedIndex?.digests?.sourceDigest === continuity.digests.stage4hSourceDigest,
      'artifact source digest must match Stage 4h source digest',
      { loadedIndex, expectedDigest: continuity.digests.stage4hSourceDigest },
    ),
  ];
  blockers = flattenBlockers(gates);

  if (blockers.length > 0) {
    const receipt = buildReceipt({
      design,
      stage4aeReceipt,
      gates,
      blockers,
      continuity: continuity.digests,
      designPath,
      moduleInfo,
      loadedIndex,
      runAt,
    });
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
    const hits = candidateIds.filter((id) => query.expectedCandidateIds.includes(id));
    const evidenceVerification = module.verifyClaimEvidence({ candidates: result.candidates });
    return {
      id: query.id,
      tenant: query.tenant,
      status: hits.length > 0 && evidenceVerification.passed ? 'passed' : 'blocked',
      candidateIds,
      expectedCandidateIds: query.expectedCandidateIds,
      hits,
      evidenceVerification,
      decisionTrace: result.decisionTrace,
      candidates: result.candidates,
      queryText: result.query,
    };
  });
  gates.queries = queryResults.flatMap((result) => [
    gate(`query_${result.id}_passed`, result.status === 'passed', 'query must return expected candidate with verified evidence', result),
    gate(`query_${result.id}_tenant_scope`, result.decisionTrace?.tenantScope === result.tenant, 'tenant scope must remain enforced', result.decisionTrace),
    gate(`query_${result.id}_candidates_only`, result.decisionTrace?.candidatesOnly === true, 'query must remain candidates-only', result.decisionTrace),
    gate(`query_${result.id}_transition_not_applied`, result.decisionTrace?.answerGeneration === false, 'dry-run must not generate answers or apply transitions', result.decisionTrace),
  ]);
  blockers = flattenBlockers(gates);

  const receipt = buildReceipt({
    design,
    stage4aeReceipt,
    gates,
    blockers,
    continuity: continuity.digests,
    designPath,
    moduleInfo,
    loadedIndex,
    queryResults,
    runAt,
  });
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = await runVectorRuntimeLocalEffectTransitionDryRun({
      designPath: option('--design') || path.resolve(process.cwd(), 'config/vector-runtime-local-effect-transition-dry-run.v1.json'),
      stage4aeReceiptPath: option('--stage4ae-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-effect-transition-receipt.v1.json'),
      artifactPath: option('--artifact'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-effect-transition-dry-run-receipt.v1.json'),
    });
    console.log(`Vector runtime local effect-transition dry-run complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
  } catch (error) {
    console.error(`Vector runtime local effect-transition dry-run failed: ${error.message}`);
    process.exitCode = 1;
  }
}
