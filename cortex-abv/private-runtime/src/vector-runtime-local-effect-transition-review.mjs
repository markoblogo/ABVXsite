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
  return { id, status: passed ? 'accepted' : 'blocked', reason, evidence };
}

function validateReview(review) {
  requireObject(review, 'review');
  requireObject(review.prerequisites, 'prerequisites');

  const requiredDryRunStatus =
    review.prerequisites.requiredLocalEffectTransitionDryRunReceiptStatus ??
    review.prerequisites.requiredLocalEffectTransitionDryRunStatus;

  const gates = [
    gate('kind', review.kind === 'CortexABVVectorRuntimeLocalEffectTransitionReview', 'review kind must match', { kind: review.kind }),
    gate('version', review.version === 'v1', 'review version must be v1', { version: review.version }),
    gate('authority', review.authority === 'local_effect_transition_review_only', 'review authority must be local_effect_transition_review_only', { authority: review.authority }),
    gate('engine', review.engine === 'turbovec', 'review engine must be turbovec', { engine: review.engine }),
  ];
  gates.push(
    gate(
      'prerequisite_kind',
      review.prerequisites.requiredLocalEffectTransitionDryRunReceiptKind === 'CortexABVVectorRuntimeLocalEffectTransitionDryRunReceipt',
      'review must require the 4af dry-run receipt kind',
      review.prerequisites,
    ),
    gate(
      'prerequisite_status',
      requiredDryRunStatus === 'passed',
      'review must require passed 4af status',
      review.prerequisites,
    ),
    gate(
      'prerequisite_eligibility',
      review.prerequisites.requiredLocalEffectTransitionDryRunEligibility === 'eligible_for_local_transition_state_effect_review',
      'review must require eligible 4af eligibility',
      review.prerequisites,
    ),
    gate('prerequisite_digest', review.prerequisites.requiresLocalEffectTransitionDryRunReceiptDigest === true, '4af receipt digest must be required', review.prerequisites),
  );

  requireObject(review.transitionDefinition, 'transitionDefinition');
  gates.push(
    gate(
      'transition_scope',
      review.transitionDefinition.transitionScope === 'strictly_local_receipt_only',
      'transition scope must stay strictly local and receipt-only',
      review.transitionDefinition,
    ),
    gate(
      'transition_source_state',
      review.transitionDefinition.sourceState === 'bounded_owner_initiated_local_active_runtime_candidate',
      'transition source state must be bounded owner-invoked local active candidate',
      review.transitionDefinition,
    ),
    gate(
      'transition_target_state',
      review.transitionDefinition.targetState === 'bounded_owner_approved_local_effect_transition_candidate',
      'transition target state must be bounded owner-approved transition candidate',
      review.transitionDefinition,
    ),
    gate(
      'transition_mode',
      review.transitionDefinition.transitionMode === 'owner_invoked_local_effect_plan_only',
      'transition mode must be owner_invoked_local_effect_plan_only',
      review.transitionDefinition,
    ),
    gate(
      'transition_module_path',
      review.transitionDefinition.requiredModulePath === 'src/vector-runtime-controlled-module-harness.mjs',
      'required module path must be fixed harness',
      review.transitionDefinition,
    ),
  );

  requireArray(review.transitionDefinition.requiredBindings, 'transitionDefinition.requiredBindings');
  gates.push(
    gate(
      'transition_bindings_allowlist',
      review.transitionDefinition.requiredBindings.length === 3 &&
        review.transitionDefinition.requiredBindings.every((binding) =>
          ['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence'].includes(binding),
        ),
      'required bindings must match allowlist',
      review.transitionDefinition.requiredBindings,
    ),
    gate(
      'transition_steps_allowlist',
      review.transitionDefinition.allowedLocalDecisionSteps.length === 4 &&
        review.transitionDefinition.allowedLocalDecisionSteps.every((step) =>
          ['candidate_query_preview', 'claim_evidence_verification', 'rollback_readiness_review', 'proposal_alignment_review'].includes(step),
        ),
      'allowed local decision steps must match allowlist',
      review.transitionDefinition.allowedLocalDecisionSteps,
    ),
  );

  for (const [key, expected] of Object.entries({
    effectTransitionAppliedHere: false,
    stateTransitionAppliedHere: false,
    runtimeActivationAppliedHere: false,
    persistentProcessAllowed: false,
    daemonProcessAllowed: false,
    schedulerAllowed: false,
    endpointAllowed: false,
    networkCallsAllowed: false,
    llmCallsAllowed: false,
    publicActionAuthorityAllowed: false,
    answerGenerationAllowed: false,
    sourceMutationAllowed: false,
    artifactMutationAllowed: false,
    writesOutsideReceiptAllowed: false,
  })) {
    gates.push(
      gate(
        `transition_definition_${key}`,
        review.transitionDefinition[key] === expected,
        `transitionDefinition.${key} must be ${expected}`,
        review.transitionDefinition,
      ),
    );
  }

  requireObject(review.requiredDryRunSignals, 'requiredDryRunSignals');
  for (const [key, list] of Object.entries({
    ownerApproval: review.requiredDryRunSignals.ownerApproval,
    module: review.requiredDryRunSignals.module,
    artifact: review.requiredDryRunSignals.artifact,
    queries: review.requiredDryRunSignals.queries,
    execution: review.requiredDryRunSignals.execution,
    rollback: review.requiredDryRunSignals.rollback,
  })) {
    gates.push(gate(`required_signal_${key}`, Array.isArray(list) && list.length > 0, `${key} required signals must be present`, review.requiredDryRunSignals));
  }

  requireObject(review.rollbackTransitionPolicy, 'rollbackTransitionPolicy');
  for (const [key, expected] of Object.entries({
    required: true,
    ownerReversalAllowed: true,
    receiptOnlyEvidence: true,
    externalMutationAllowed: false,
  })) {
    gates.push(
      gate(
        `rollback_policy_${key}`,
        review.rollbackTransitionPolicy[key] === expected,
        `rollbackTransitionPolicy.${key} must be ${expected}`,
        review.rollbackTransitionPolicy,
      ),
    );
  }

  requireObject(review.nextGate, 'nextGate');
  gates.push(
    gate(
      'next_gate_eligibility',
      typeof review.nextGate.targetEligibility === 'string' && review.nextGate.targetEligibility.length > 0,
      'next gate eligibility must be explicit',
      review.nextGate,
    ),
    gate(
      'next_gate_not_applied',
      review.nextGate.effectTransitionAppliedHere === false,
      'next gate must keep transition unapplied',
      review.nextGate,
    ),
  );

  requireObject(review.forbiddenAuthority, 'forbiddenAuthority');
  for (const [key, expected] of Object.entries({
    activationAppliedHere: false,
    stateTransitionAppliedHere: false,
    persistentProcessAllowed: false,
    daemonProcessAllowed: false,
    schedulerAllowed: false,
    endpointAllowed: false,
    networkCallsAllowed: false,
    llmCallsAllowed: false,
    publicActionAuthorityAllowed: false,
    answerGenerationAllowed: false,
    sourceMutationAllowed: false,
    artifactMutationAllowed: false,
    writesOutsideReceiptAllowed: false,
    crossTenantQueriesAllowed: false,
    autonomousExecutionAllowed: false,
  })) {
    gates.push(
      gate(
        `forbidden_${key}`,
        review.forbiddenAuthority[key] === expected,
        `forbiddenAuthority.${key} must be ${expected}`,
        review.forbiddenAuthority,
      ),
    );
  }

  requireObject(review.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    localEffectTransitionReviewOnly: true,
    runtimeActivationApplied: false,
    stateTransitionApplied: false,
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

function validateStage4afReceipt(receipt, review) {
  const requiredDryRunStatus =
    review.prerequisites.requiredLocalEffectTransitionDryRunReceiptStatus ??
    review.prerequisites.requiredLocalEffectTransitionDryRunStatus;
  const queries = Array.isArray(receipt.queryResults) ? receipt.queryResults : [];
  return [
    gate('kind', receipt.kind === review.prerequisites.requiredLocalEffectTransitionDryRunReceiptKind, '4af receipt kind must match prerequisite', { kind: receipt.kind }),
    gate(
      'status',
      receipt.status === requiredDryRunStatus,
      '4af receipt status must be passed',
      {
        status: receipt.status,
        requiredStatus: requiredDryRunStatus,
      },
    ),
    gate('eligibility', receipt.eligibility === review.prerequisites.requiredLocalEffectTransitionDryRunEligibility, '4af receipt eligibility must match', {
      eligibility: receipt.eligibility,
    }),
    gate('no_blockers', Array.isArray(receipt.blockers) && receipt.blockers.length === 0, '4af receipt must have no blockers', { blockers: receipt.blockers }),
    gate(
      'artifact_read_only',
      receipt.artifact?.readOnly === true && typeof receipt.artifact?.indexDigest === 'string' && typeof receipt.artifact?.sourceDigest === 'string',
      '4af artifact must stay read-only and provide digests',
      receipt.artifact,
    ),
    gate(
      'transition_not_applied',
      receipt.transitionIntent?.effectTransitionAppliedHere === false && receipt.transitionIntent?.stateTransitionAppliedHere === false && receipt.transitionIntent?.runtimeActivationAppliedHere === false,
      '4af transition intent must show no applied authority',
      receipt.transitionIntent,
    ),
    gate(
      'transition_scope',
      receipt.transitionIntent?.transitionScope === review.transitionDefinition.transitionScope && receipt.transitionIntent?.transitionMode === review.transitionDefinition.transitionMode,
      '4af transition intent must match review transition scope/mode',
      receipt.transitionIntent,
    ),
    gate(
      'transition_states',
      receipt.transitionIntent?.sourceState === review.transitionDefinition.sourceState && receipt.transitionIntent?.targetState === review.transitionDefinition.targetState,
      '4af transition intent states must match review',
      receipt.transitionIntent,
    ),
    gate(
      'transition_bindings',
      JSON.stringify(receipt.transitionIntent?.allowedBindings || []) === JSON.stringify(review.transitionDefinition.requiredBindings),
      '4af transition bindings must match allowlist',
      receipt.transitionIntent,
    ),
    gate(
      'queries_passed',
      queries.length > 0 && queries.every((query) => query.status === 'passed'),
      '4af query results must all pass',
      { queryResults: queries },
    ),
    gate(
      'queries_tenant_scoped',
      queries.length > 0 && queries.every((query) => query.decisionTrace?.tenantScope === query.tenant),
      '4af tenant scope must be enforced',
      { decisionTraces: queries.map((q) => q.decisionTrace) },
    ),
    gate(
      'queries_candidates_only',
      queries.length > 0 && queries.every((query) => query.decisionTrace?.candidatesOnly === true),
      '4af candidate-only mode must remain true',
      { decisionTraces: queries.map((q) => q.decisionTrace) },
    ),
    gate(
      'queries_answer_generation_disabled',
      queries.length > 0 && queries.every((query) => query.decisionTrace?.answerGeneration === false),
      '4af answer generation must remain disabled',
      { decisionTraces: queries.map((q) => q.decisionTrace) },
    ),
    gate(
      'evidence_verified',
      queries.length > 0 && queries.every((query) => query.evidenceVerification?.passed === true),
      '4af evidence verification must pass',
      { evidenceVerification: queries.map((q) => q.evidenceVerification) },
    ),
    gate('commands_executed', Array.isArray(receipt.commandsExecuted) && receipt.commandsExecuted.length === 4, '4af must execute 4 dry-run commands', {
      commandsExecuted: receipt.commandsExecuted,
    }),
    gate(
      'no_activation',
      receipt.governance?.runtimeActivationApplied === false && receipt.governance?.endpoint === false && receipt.governance?.networkCalls === false,
      '4af governance must keep execution authority off',
      receipt.governance,
    ),
    gate(
      'owner_status',
      receipt.ownerApproval?.status === 'approved',
      '4af owner approval status must remain approved',
      receipt.ownerApproval,
    ),
    gate(
      'rollback_notes_present',
      Array.isArray(receipt.rollbackNotes) && receipt.rollbackNotes.length > 0,
      '4af rollback notes must be present',
      { rollbackNotes: receipt.rollbackNotes },
    ),
  ];
}

function allChecksPass(gates) {
  return Object.values(gates).every((group) => group.every((item) => item.status === 'accepted'));
}

function flattenBlockers(gates) {
  return Object.entries(gates).flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
}

export function runVectorRuntimeLocalEffectTransitionReview({
  reviewPath,
  stage4afReceiptPath,
  receiptPath,
  runAt,
} = {}) {
  if (!existsSync(reviewPath)) throw new Error(`local effect transition review file not found: ${reviewPath}`);
  if (!existsSync(stage4afReceiptPath)) throw new Error(`local effect transition dry-run receipt file not found: ${stage4afReceiptPath}`);

  const review = readJson(reviewPath);
  const stage4afReceipt = readJson(stage4afReceiptPath);
  const gates = {
    review: validateReview(review),
    stage4afReceipt: validateStage4afReceipt(stage4afReceipt, review),
  };

  const blockers = flattenBlockers(gates);
  const eligible = blockers.length === 0;
  const reviewDigest = sha256(review);
  const stage4afReceiptDigest = sha256(stage4afReceipt);

  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeLocalEffectTransitionReviewReceipt',
    version: 'v1',
    authority: 'local_effect_transition_review_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_local_effect_transition_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'local_effect_transition_review',
    engine: review.engine,
    reviewDigest,
    stage4afReceiptDigest,
    prerequisiteDigests: {
      stage4aeReceiptDigest: stage4afReceipt.digests?.stage4aeReceiptDigest,
      stage4acReceiptDigest: stage4afReceipt.digests?.stage4acReceiptDigest,
      stage4aaReceiptDigest: stage4afReceipt.digests?.stage4aaReceiptDigest,
      stage4zReceiptDigest: stage4afReceipt.digests?.stage4zReceiptDigest,
      stage4yReceiptDigest: stage4afReceipt.digests?.stage4yReceiptDigest,
      stage4xReceiptDigest: stage4afReceipt.digests?.stage4xReceiptDigest,
      stage4wReceiptDigest: stage4afReceipt.digests?.stage4wReceiptDigest,
      stage4vReceiptDigest: stage4afReceipt.digests?.stage4vReceiptDigest,
      stage4uReceiptDigest: stage4afReceipt.digests?.stage4uReceiptDigest,
      stage4tReceiptDigest: stage4afReceipt.digests?.stage4tReceiptDigest,
      stage4sReceiptDigest: stage4afReceipt.digests?.stage4sReceiptDigest,
      stage4rReceiptDigest: stage4afReceipt.digests?.stage4rReceiptDigest,
      stage4qReceiptDigest: stage4afReceipt.digests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4afReceipt.digests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4afReceipt.digests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4afReceipt.digests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4afReceipt.digests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4afReceipt.digests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4afReceipt.digests?.receiptLinkageDigest,
    },
    transitionDefinition: {
      transitionScope: review.transitionDefinition.transitionScope,
      sourceState: review.transitionDefinition.sourceState,
      targetState: review.transitionDefinition.targetState,
      transitionMode: review.transitionDefinition.transitionMode,
      requiredModulePath: review.transitionDefinition.requiredModulePath,
      requiredBindings: review.transitionDefinition.requiredBindings,
      allowedLocalDecisionSteps: review.transitionDefinition.allowedLocalDecisionSteps,
      effectTransitionAppliedHere: review.transitionDefinition.effectTransitionAppliedHere,
      stateTransitionAppliedHere: review.transitionDefinition.stateTransitionAppliedHere,
      runtimeActivationAppliedHere: review.transitionDefinition.runtimeActivationAppliedHere,
      persistentProcessAllowed: review.transitionDefinition.persistentProcessAllowed,
      daemonProcessAllowed: review.transitionDefinition.daemonProcessAllowed,
      schedulerAllowed: review.transitionDefinition.schedulerAllowed,
      endpointAllowed: review.transitionDefinition.endpointAllowed,
      networkCallsAllowed: review.transitionDefinition.networkCallsAllowed,
      llmCallsAllowed: review.transitionDefinition.llmCallsAllowed,
      publicActionAuthorityAllowed: review.transitionDefinition.publicActionAuthorityAllowed,
    },
    sources: {
      review: {
        path: reviewPath,
        kind: review.kind,
        status: 'passed',
        digest: reviewDigest,
      },
      stage4afReceipt: {
        path: stage4afReceiptPath,
        kind: stage4afReceipt.kind,
        status: stage4afReceipt.status,
        eligibility: stage4afReceipt.eligibility,
        digest: stage4afReceiptDigest,
      },
    },
    requiredDryRunSignals: review.requiredDryRunSignals,
    rollbackTransitionPolicy: review.rollbackTransitionPolicy,
    nextGate: review.nextGate,
    governance: {
      readOnly: true,
      proposalOnly: true,
      localEffectTransitionReviewOnly: true,
      runtimeActivationApplied: false,
      stateTransitionApplied: false,
      runtimeIntegration: false,
      endpoint: false,
      scheduler: false,
      networkCalls: false,
      llmCalls: false,
      writesOutsideReceipt: false,
      publicActionAuthority: false,
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'local_effect_transition_review_contract_plus_stage4af_dry_run_receipt',
      reason: eligible
        ? 'The local effect transition dry-run has passed with receipt-only evidence, bounded bindings, and no applied transition/activation authority.'
        : 'Local effect transition review is blocked until Stage 4af dry-run proof and local transition boundaries are clean.',
      transitionSourceState: stage4afReceipt.transitionIntent?.sourceState,
      transitionTargetState: stage4afReceipt.transitionIntent?.targetState,
      transitionApplied: false,
      stateTransitionApplied: false,
      runtimeActivationApplied: false,
      answerGenerationDisabled: queriesSafe(stage4afReceipt),
    },
    summary: eligible
      ? 'Local effect transition review passed as discussion-only with no authority application and explicit receipt lineage.'
      : 'Local effect transition review blocked by one or more review or 4af gates.',
  };

  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

function queriesSafe(receipt) {
  const queries = Array.isArray(receipt?.queryResults) ? receipt.queryResults : [];
  if (queries.length === 0) return false;
  return queries.every((query) => query.decisionTrace?.answerGeneration === false);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = runVectorRuntimeLocalEffectTransitionReview({
      reviewPath: option('--review') || path.resolve(process.cwd(), 'config/vector-runtime-local-effect-transition-review.v1.json'),
      stage4afReceiptPath: option('--stage4af-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-effect-transition-dry-run-receipt.v1.json'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-local-effect-transition-review-receipt.v1.json'),
    });
    console.log(
      `Vector runtime local effect transition review complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`,
    );
  } catch (error) {
    console.error(`Vector runtime local effect transition review failed: ${error.message}`);
    process.exitCode = 1;
  }
}
