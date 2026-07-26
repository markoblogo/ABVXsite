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

function validateDecision(decision) {
  requireObject(decision, 'decision');
  const gates = [
    gate('kind', decision.kind === 'CortexABVVectorRuntimeActivationDecision', 'decision kind must match', { kind: decision.kind }),
    gate('version', decision.version === 'v1', 'decision version must be v1', { version: decision.version }),
    gate('authority', decision.authority === 'local_runtime_activation_decision_only', 'decision authority must be local_runtime_activation_decision_only', { authority: decision.authority }),
    gate('engine', decision.engine === 'turbovec', 'decision engine must be turbovec', { engine: decision.engine }),
  ];

  requireObject(decision.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4t_prerequisite', decision.prerequisites.requiredActivationDecisionReviewEligibility === 'eligible_for_local_runtime_activation_decision', 'decision must require eligible Stage 4t receipt', decision.prerequisites),
    gate('stage4t_digest_required', decision.prerequisites.requiresActivationDecisionReviewReceiptDigest === true, 'Stage 4t receipt digest is required', decision.prerequisites),
  );

  requireObject(decision.ownerApproval, 'ownerApproval');
  gates.push(
    gate('owner_approval_required', decision.ownerApproval.required === true, 'owner approval must be required', decision.ownerApproval),
    gate('owner_approval_mode', decision.ownerApproval.approvalMode === 'explicit_owner_manual_decision', 'owner approval mode must be explicit manual decision', decision.ownerApproval),
    gate('owner_role', decision.ownerApproval.approvedByRole === 'owner', 'owner approval role must be owner', decision.ownerApproval),
    gate('owner_status', decision.ownerApproval.status === 'approved', 'owner approval status must be approved', decision.ownerApproval),
    gate('owner_scope', decision.ownerApproval.scope === 'local_private_runtime_callable_availability_only', 'owner approval scope must stay local runtime callable availability only', decision.ownerApproval),
  );

  requireObject(decision.activationIntent, 'activationIntent');
  requireArray(decision.activationIntent.allowedBindings, 'activationIntent.allowedBindings');
  requireArray(decision.activationIntent.allowedOperations, 'activationIntent.allowedOperations');
  requireArray(decision.activationIntent.allowedConsumers, 'activationIntent.allowedConsumers');
  const allowedBindings = new Set(['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence']);
  const allowedOperations = new Set(['load_read_only_index_artifact', 'query_tenant_scoped_candidates_only', 'verify_claim_evidence_refs']);
  gates.push(
    gate('intent_location', decision.activationIntent.allowedLocation === 'cortex-abv-private-runtime-only', 'activation intent must stay private-runtime only', decision.activationIntent),
    gate('intent_mode', decision.activationIntent.activationMode === 'same_process_owner_invoked_callable_only', 'activation intent mode must be owner-invoked same-process callable only', decision.activationIntent),
    gate('intent_module_path', decision.activationIntent.allowedModulePath === 'src/vector-runtime-controlled-module-harness.mjs', 'activation intent module path must match controlled harness', decision.activationIntent),
    gate('intent_bindings', decision.activationIntent.allowedBindings.every((binding) => allowedBindings.has(binding)), 'activation intent bindings must be allowlisted', decision.activationIntent),
    gate('intent_artifact_path', decision.activationIntent.allowedArtifactPath === 'data/vector-indexes/turbovec-poc/index-artifact.v1.json', 'activation intent artifact path must match Stage 4h local artifact', decision.activationIntent),
    gate('intent_operations', decision.activationIntent.allowedOperations.every((operation) => allowedOperations.has(operation)), 'activation intent operations must stay bounded', decision.activationIntent),
    gate('intent_consumers', decision.activationIntent.allowedConsumers.length === 1 && decision.activationIntent.allowedConsumers[0] === 'owner_invoked_private_runtime_process_only', 'activation intent consumers must stay owner-invoked local process only', decision.activationIntent),
    gate('intent_not_applied_here', decision.activationIntent.runtimeActivationAppliedHere === false, 'runtime activation must not be applied here', decision.activationIntent),
  );

  requireObject(decision.rollbackPlan, 'rollbackPlan');
  requireArray(decision.rollbackPlan.steps, 'rollbackPlan.steps');
  gates.push(
    gate('rollback_required', decision.rollbackPlan.required === true, 'rollback plan must be required', decision.rollbackPlan),
    gate('rollback_strategy', decision.rollbackPlan.strategy === 'return_to_inactive_local_private_runtime_state', 'rollback strategy must return to inactive local private runtime state', decision.rollbackPlan),
    gate('rollback_receipt_only', decision.rollbackPlan.receiptOnlyEvidence === true, 'rollback evidence must remain receipt-only', decision.rollbackPlan),
    gate('rollback_owner_reversal', decision.rollbackPlan.ownerReversalAllowed === true, 'owner reversal must remain allowed', decision.rollbackPlan),
  );

  requireObject(decision.nextGate, 'nextGate');
  gates.push(
    gate('next_gate_target', decision.nextGate.targetEligibility === 'eligible_for_local_runtime_activation_dry_run', 'next gate target must be local runtime activation dry-run', decision.nextGate),
    gate('next_gate_kind', decision.nextGate.futureRunKind === 'CortexABVVectorRuntimeLocalActivationDryRun', 'future run kind must match local activation dry-run', decision.nextGate),
    gate('next_gate_mode', decision.nextGate.futureRunMode === 'local_runtime_activation_dry_run_only', 'future run mode must match local activation dry-run only', decision.nextGate),
    gate('next_gate_not_applied_here', decision.nextGate.runtimeActivationAppliedHere === false, 'runtime activation must not be applied at decision gate', decision.nextGate),
  );

  requireObject(decision.forbiddenAuthority, 'forbiddenAuthority');
  for (const [key, expected] of Object.entries({
    runtimeActivationAppliedHere: false,
    persistentServiceAllowed: false,
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
    gates.push(gate(`forbidden_${key}`, decision.forbiddenAuthority[key] === expected, `forbiddenAuthority.${key} must be ${expected}`, decision.forbiddenAuthority));
  }

  requireObject(decision.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    activationDecisionOnly: true,
    runtimeActivationApplied: false,
    runtimeIntegration: false,
    endpoint: false,
    scheduler: false,
    networkCalls: false,
    llmCalls: false,
    writesOutsideReceipt: false,
    publicActionAuthority: false,
  })) {
    gates.push(gate(`governance_${key}`, decision.governance[key] === expected, `governance.${key} must be ${expected}`, decision.governance));
  }

  return gates;
}

function validateStage4tReceipt(stage4tReceipt, decision) {
  const scope = stage4tReceipt.localActivationScope ?? {};
  return [
    gate('kind', stage4tReceipt.kind === decision.prerequisites.requiredActivationDecisionReviewReceiptKind, 'Stage 4t receipt kind must match prerequisite', { kind: stage4tReceipt.kind }),
    gate('status', stage4tReceipt.status === decision.prerequisites.requiredActivationDecisionReviewStatus, 'Stage 4t receipt status must be passed', { status: stage4tReceipt.status }),
    gate('eligibility', stage4tReceipt.eligibility === decision.prerequisites.requiredActivationDecisionReviewEligibility, 'Stage 4t receipt eligibility must match prerequisite', { eligibility: stage4tReceipt.eligibility }),
    gate('no_blockers', Array.isArray(stage4tReceipt.blockers) && stage4tReceipt.blockers.length === 0, 'Stage 4t receipt must have no blockers', { blockers: stage4tReceipt.blockers }),
    gate('stage4s_receipt_digest_present', typeof stage4tReceipt.stage4sReceiptDigest === 'string' && stage4tReceipt.stage4sReceiptDigest.length === 64, 'Stage 4s receipt digest must be present', { stage4sReceiptDigest: stage4tReceipt.stage4sReceiptDigest }),
    gate('stage4r_receipt_digest_present', typeof stage4tReceipt.prerequisiteDigests?.stage4rReceiptDigest === 'string' && stage4tReceipt.prerequisiteDigests.stage4rReceiptDigest.length === 64, 'Stage 4r receipt digest must be present', stage4tReceipt.prerequisiteDigests),
    gate('stage4q_receipt_digest_present', typeof stage4tReceipt.prerequisiteDigests?.stage4qReceiptDigest === 'string' && stage4tReceipt.prerequisiteDigests.stage4qReceiptDigest.length === 64, 'Stage 4q receipt digest must be present', stage4tReceipt.prerequisiteDigests),
    gate('stage4p_receipt_digest_present', typeof stage4tReceipt.prerequisiteDigests?.stage4pReceiptDigest === 'string' && stage4tReceipt.prerequisiteDigests.stage4pReceiptDigest.length === 64, 'Stage 4p receipt digest must be present', stage4tReceipt.prerequisiteDigests),
    gate('stage4o_receipt_digest_present', typeof stage4tReceipt.prerequisiteDigests?.stage4oReceiptDigest === 'string' && stage4tReceipt.prerequisiteDigests.stage4oReceiptDigest.length === 64, 'Stage 4o receipt digest must be present', stage4tReceipt.prerequisiteDigests),
    gate('stage4n_receipt_digest_present', typeof stage4tReceipt.prerequisiteDigests?.stage4nReceiptDigest === 'string' && stage4tReceipt.prerequisiteDigests.stage4nReceiptDigest.length === 64, 'Stage 4n receipt digest must be present', stage4tReceipt.prerequisiteDigests),
    gate('stage4h_index_digest_present', typeof stage4tReceipt.prerequisiteDigests?.stage4hIndexDigest === 'string' && stage4tReceipt.prerequisiteDigests.stage4hIndexDigest.length === 64, 'Stage 4h index digest must be present', stage4tReceipt.prerequisiteDigests),
    gate('stage4h_source_digest_present', typeof stage4tReceipt.prerequisiteDigests?.stage4hSourceDigest === 'string' && stage4tReceipt.prerequisiteDigests.stage4hSourceDigest.length === 64, 'Stage 4h source digest must be present', stage4tReceipt.prerequisiteDigests),
    gate('receipt_linkage_digest_present', typeof stage4tReceipt.prerequisiteDigests?.receiptLinkageDigest === 'string' && stage4tReceipt.prerequisiteDigests.receiptLinkageDigest.length === 64, 'receipt linkage digest must be present', stage4tReceipt.prerequisiteDigests),
    gate('scope_location_match', scope.allowedLocation === decision.activationIntent.allowedLocation, 'activation intent location must match Stage 4t local scope', { scope, activationIntent: decision.activationIntent }),
    gate('scope_mode_match', scope.activationMode === decision.activationIntent.activationMode, 'activation intent mode must match Stage 4t local scope', { scope, activationIntent: decision.activationIntent }),
    gate('scope_module_path_match', scope.allowedModulePath === decision.activationIntent.allowedModulePath, 'activation intent module path must match Stage 4t local scope', { scope, activationIntent: decision.activationIntent }),
    gate('scope_artifact_path_match', scope.allowedArtifactPath === decision.activationIntent.allowedArtifactPath, 'activation intent artifact path must match Stage 4t local scope', { scope, activationIntent: decision.activationIntent }),
    gate('scope_bindings_match', JSON.stringify(scope.allowedBindings) === JSON.stringify(decision.activationIntent.allowedBindings), 'activation intent bindings must match Stage 4t local scope', { scope, activationIntent: decision.activationIntent }),
    gate('scope_operations_match', JSON.stringify(scope.allowedOperations) === JSON.stringify(decision.activationIntent.allowedOperations), 'activation intent operations must match Stage 4t local scope', { scope, activationIntent: decision.activationIntent }),
    gate('scope_consumers_match', JSON.stringify(scope.allowedConsumers) === JSON.stringify(decision.activationIntent.allowedConsumers), 'activation intent consumers must match Stage 4t local scope', { scope, activationIntent: decision.activationIntent }),
    gate('no_runtime_activation', stage4tReceipt.governance?.runtimeActivationApproved === false, 'Stage 4t must not apply runtime activation', stage4tReceipt.governance),
    gate('no_runtime_integration', stage4tReceipt.governance?.runtimeIntegration === false, 'Stage 4t must not approve runtime integration', stage4tReceipt.governance),
    gate('no_endpoint', stage4tReceipt.governance?.endpoint === false, 'Stage 4t must not approve endpoint', stage4tReceipt.governance),
    gate('no_scheduler', stage4tReceipt.governance?.scheduler === false, 'Stage 4t must not approve scheduler', stage4tReceipt.governance),
    gate('no_network', stage4tReceipt.governance?.networkCalls === false, 'Stage 4t must not approve network calls', stage4tReceipt.governance),
    gate('no_llm', stage4tReceipt.governance?.llmCalls === false, 'Stage 4t must not approve LLM calls', stage4tReceipt.governance),
    gate('no_public_action', stage4tReceipt.governance?.publicActionAuthority === false, 'Stage 4t must not approve public action authority', stage4tReceipt.governance)
  ];
}

export function runVectorRuntimeActivationDecision({ decisionPath, stage4tReceiptPath, receiptPath, runAt } = {}) {
  if (!existsSync(decisionPath)) throw new Error(`runtime activation decision file not found: ${decisionPath}`);
  if (!existsSync(stage4tReceiptPath)) throw new Error(`runtime activation decision review receipt file not found: ${stage4tReceiptPath}`);
  const decision = readJson(decisionPath);
  const stage4tReceipt = readJson(stage4tReceiptPath);
  const gates = {
    decision: validateDecision(decision),
    stage4tReceipt: validateStage4tReceipt(stage4tReceipt, decision),
  };
  const blockers = Object.entries(gates).flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const decisionDigest = sha256(decision);
  const stage4tReceiptDigest = sha256(stage4tReceipt);
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeActivationDecisionReceipt',
    version: 'v1',
    authority: 'local_runtime_activation_decision_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_local_runtime_activation_dry_run' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'runtime_activation_decision',
    engine: decision.engine,
    decisionDigest,
    stage4tReceiptDigest,
    prerequisiteDigests: {
      stage4sReceiptDigest: stage4tReceipt.stage4sReceiptDigest,
      stage4rReceiptDigest: stage4tReceipt.prerequisiteDigests?.stage4rReceiptDigest,
      stage4qReceiptDigest: stage4tReceipt.prerequisiteDigests?.stage4qReceiptDigest,
      stage4pReceiptDigest: stage4tReceipt.prerequisiteDigests?.stage4pReceiptDigest,
      stage4oReceiptDigest: stage4tReceipt.prerequisiteDigests?.stage4oReceiptDigest,
      stage4nReceiptDigest: stage4tReceipt.prerequisiteDigests?.stage4nReceiptDigest,
      stage4hIndexDigest: stage4tReceipt.prerequisiteDigests?.stage4hIndexDigest,
      stage4hSourceDigest: stage4tReceipt.prerequisiteDigests?.stage4hSourceDigest,
      receiptLinkageDigest: stage4tReceipt.prerequisiteDigests?.receiptLinkageDigest,
    },
    ownerApproval: decision.ownerApproval,
    activationIntent: decision.activationIntent,
    rollbackPlan: decision.rollbackPlan,
    nextGate: decision.nextGate,
    governance: {
      readOnly: true,
      proposalOnly: true,
      activationDecisionOnly: true,
      runtimeActivationApplied: false,
      runtimeIntegration: false,
      endpoint: false,
      scheduler: false,
      networkCalls: false,
      llmCalls: false,
      writesOutsideReceipt: false,
      publicActionAuthority: false,
    },
    sources: {
      decision: { path: decisionPath, kind: decision.kind, digest: decisionDigest },
      activationDecisionReviewReceipt: {
        path: stage4tReceiptPath,
        kind: stage4tReceipt.kind,
        status: stage4tReceipt.status,
        eligibility: stage4tReceipt.eligibility,
        digest: stage4tReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'runtime_activation_decision_artifact_plus_stage4t_review_receipt',
      reason: eligible
        ? 'Explicit owner-approved local activation decision recorded under the Stage 4t boundary, still without applying activation.'
        : 'Local activation decision artifact blocked because Stage 4t proof, owner approval, rollback plan or governance boundary is incomplete.',
      nextAllowedStep: eligible ? 'local_runtime_activation_dry_run' : 'revise_local_runtime_activation_decision',
      activationApplied: false,
      endpointApproved: false,
      networkApproved: false,
      publicActionApproved: false,
    },
    summary: eligible
      ? 'Owner-approved local activation decision artifact recorded. It only allows preparation for a later local activation dry-run and does not apply activation.'
      : 'Local runtime activation decision artifact is not eligible.',
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const receipt = runVectorRuntimeActivationDecision({
      decisionPath: option('--decision') || path.resolve(process.cwd(), 'config/vector-runtime-activation-decision.v1.json'),
      stage4tReceiptPath: option('--stage4t-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-activation-decision-review-receipt.v1.json'),
      receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-activation-decision-receipt.v1.json'),
    });
    console.log(`Vector runtime activation decision artifact complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
  } catch (error) {
    console.error(`Vector runtime activation decision artifact failed: ${error.message}`);
    process.exitCode = 1;
  }
}
