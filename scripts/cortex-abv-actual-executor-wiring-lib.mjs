function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value.trim();
}

function requireBoolean(value, label) {
  if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean`);
  return value;
}

function stringArray(value, label) {
  if (!Array.isArray(value) || !value.length || !value.every((item) => typeof item === 'string' && item.trim())) {
    throw new Error(`${label} must be a non-empty string array`);
  }
  return value.map((item) => item.trim());
}

const REQUIRED_FORBIDDEN_BEHAVIORS = [
  'automerge',
  'autopublish',
  'direct_main_push',
  'source_repository_write',
  'social_post',
  'message_send',
  'email_send',
  'external_direct_execution',
];

export function validateActualExecutorWiringContract(contract) {
  if (!contract || contract.schemaVersion !== 1 || contract.kind !== 'CortexABVActualExecutorWiring') {
    throw new Error('contract must be CortexABVActualExecutorWiring v1');
  }
  if (contract.version !== 'v1') throw new Error('contract.version must be v1');
  if (contract.status !== 'design_only') throw new Error('contract.status must be design_only');
  if (contract.mode !== 'approved_plan_manual_apply_only') throw new Error('contract.mode must be approved_plan_manual_apply_only');

  if (!contract.inputContract || typeof contract.inputContract !== 'object') throw new Error('contract.inputContract must be an object');
  const input = contract.inputContract;
  if (nonEmptyString(input.requiredPlanKind, 'contract.inputContract.requiredPlanKind') !== 'CortexABVExecutorWiringPlan') {
    throw new Error('contract.inputContract.requiredPlanKind must be CortexABVExecutorWiringPlan');
  }
  if (nonEmptyString(input.requiredPlanStatus, 'contract.inputContract.requiredPlanStatus') !== 'ready_for_owner_merge') {
    throw new Error('contract.inputContract.requiredPlanStatus must be ready_for_owner_merge');
  }
  if (nonEmptyString(input.requiredMappedAction, 'contract.inputContract.requiredMappedAction') !== 'owner_merge_pull_request') {
    throw new Error('contract.inputContract.requiredMappedAction must be owner_merge_pull_request');
  }
  if (nonEmptyString(input.requiredPublishPath, 'contract.inputContract.requiredPublishPath') !== 'pull_request_merge_only') {
    throw new Error('contract.inputContract.requiredPublishPath must be pull_request_merge_only');
  }
  if (nonEmptyString(input.requiredTargetSurfaceId, 'contract.inputContract.requiredTargetSurfaceId') !== 'abvxsite-project-copy') {
    throw new Error('contract.inputContract.requiredTargetSurfaceId must be abvxsite-project-copy');
  }

  if (!contract.outputContract || typeof contract.outputContract !== 'object') throw new Error('contract.outputContract must be an object');
  const output = contract.outputContract;
  if (nonEmptyString(output.receiptKind, 'contract.outputContract.receiptKind') !== 'CortexABVActualExecutorWiringReceipt') {
    throw new Error('contract.outputContract.receiptKind must be CortexABVActualExecutorWiringReceipt');
  }
  if (nonEmptyString(output.eligibleStatus, 'contract.outputContract.eligibleStatus') !== 'eligible_for_manual_apply_only') {
    throw new Error('contract.outputContract.eligibleStatus must be eligible_for_manual_apply_only');
  }
  if (nonEmptyString(output.blockedStatus, 'contract.outputContract.blockedStatus') !== 'blocked') {
    throw new Error('contract.outputContract.blockedStatus must be blocked');
  }

  if (!contract.manualApplyIntent || typeof contract.manualApplyIntent !== 'object') throw new Error('contract.manualApplyIntent must be an object');
  const intent = contract.manualApplyIntent;
  if (nonEmptyString(intent.kind, 'contract.manualApplyIntent.kind') !== 'pull_request_merge_intent') {
    throw new Error('contract.manualApplyIntent.kind must be pull_request_merge_intent');
  }
  if (nonEmptyString(intent.repository, 'contract.manualApplyIntent.repository') !== 'markoblogo/ABVXsite') {
    throw new Error('contract.manualApplyIntent.repository must be markoblogo/ABVXsite');
  }
  if (nonEmptyString(intent.baseBranch, 'contract.manualApplyIntent.baseBranch') !== 'main') {
    throw new Error('contract.manualApplyIntent.baseBranch must be main');
  }
  if (nonEmptyString(intent.branchPrefix, 'contract.manualApplyIntent.branchPrefix') !== 'cortexabv/write-side-') {
    throw new Error('contract.manualApplyIntent.branchPrefix must be cortexabv/write-side-');
  }
  requireBoolean(intent.requiresOwnerReviewArtifact, 'contract.manualApplyIntent.requiresOwnerReviewArtifact');
  requireBoolean(intent.requiresOwnerDecisionNote, 'contract.manualApplyIntent.requiresOwnerDecisionNote');
  requireBoolean(intent.requiresPlanArtifact, 'contract.manualApplyIntent.requiresPlanArtifact');

  if (!contract.proofRequirements || typeof contract.proofRequirements !== 'object') throw new Error('contract.proofRequirements must be an object');
  const proof = contract.proofRequirements;
  requireBoolean(proof.requiresRealSourceDiff, 'contract.proofRequirements.requiresRealSourceDiff');
  requireBoolean(proof.requiresProposalPullRequest, 'contract.proofRequirements.requiresProposalPullRequest');
  requireBoolean(proof.requiresApprovedReviewArtifact, 'contract.proofRequirements.requiresApprovedReviewArtifact');
  requireBoolean(proof.requiresApprovedExecutorPlan, 'contract.proofRequirements.requiresApprovedExecutorPlan');
  requireBoolean(proof.requiresTargetBranchVisibility, 'contract.proofRequirements.requiresTargetBranchVisibility');

  const forbidden = stringArray(contract.forbiddenBehaviors, 'contract.forbiddenBehaviors');
  for (const behavior of REQUIRED_FORBIDDEN_BEHAVIORS) {
    if (!forbidden.includes(behavior)) throw new Error(`contract.forbiddenBehaviors must include ${behavior}`);
  }

  return contract;
}

export function validateExecutorWiringPlanForActualWiring(plan, contract) {
  const validatedContract = validateActualExecutorWiringContract(contract);
  if (!plan || plan.kind !== validatedContract.inputContract.requiredPlanKind) {
    throw new Error(`plan must be ${validatedContract.inputContract.requiredPlanKind}`);
  }
  if (nonEmptyString(plan.status, 'plan.status') !== validatedContract.inputContract.requiredPlanStatus) {
    throw new Error(`plan.status must be ${validatedContract.inputContract.requiredPlanStatus}`);
  }
  if (nonEmptyString(plan.mappedAction, 'plan.mappedAction') !== validatedContract.inputContract.requiredMappedAction) {
    throw new Error(`plan.mappedAction must be ${validatedContract.inputContract.requiredMappedAction}`);
  }
  if (nonEmptyString(plan.publishPath, 'plan.publishPath') !== validatedContract.inputContract.requiredPublishPath) {
    throw new Error(`plan.publishPath must be ${validatedContract.inputContract.requiredPublishPath}`);
  }
  if (nonEmptyString(plan.targetSurfaceId, 'plan.targetSurfaceId') !== validatedContract.inputContract.requiredTargetSurfaceId) {
    throw new Error(`plan.targetSurfaceId must be ${validatedContract.inputContract.requiredTargetSurfaceId}`);
  }
  if (nonEmptyString(plan.repository, 'plan.repository') !== validatedContract.manualApplyIntent.repository) {
    throw new Error(`plan.repository must be ${validatedContract.manualApplyIntent.repository}`);
  }
  if (nonEmptyString(plan.baseBranch, 'plan.baseBranch') !== validatedContract.manualApplyIntent.baseBranch) {
    throw new Error(`plan.baseBranch must be ${validatedContract.manualApplyIntent.baseBranch}`);
  }
  if (nonEmptyString(plan.requiredBranchPrefix, 'plan.requiredBranchPrefix') !== validatedContract.manualApplyIntent.branchPrefix) {
    throw new Error(`plan.requiredBranchPrefix must be ${validatedContract.manualApplyIntent.branchPrefix}`);
  }
  if (plan.autopublish !== false) throw new Error('plan.autopublish must be false');
  if (plan.ownerTriggerRequired !== true) throw new Error('plan.ownerTriggerRequired must be true');
  if (plan.externalDirectExecution !== false) throw new Error('plan.externalDirectExecution must be false');
  nonEmptyString(plan.ownerDecision, 'plan.ownerDecision');
  return plan;
}

function buildGate(name, passed, message, details = null) {
  return { name, passed, message, details };
}

export function buildActualExecutorWiringReceipt({
  contract,
  plan,
  proof = {},
}) {
  const validatedContract = validateActualExecutorWiringContract(contract);
  const validatedPlan = validateExecutorWiringPlanForActualWiring(plan, validatedContract);

  const gates = [
    buildGate('real_source_diff', proof.realSourceDiff === true, 'Real source diff must exist.', { realSourceDiff: !!proof.realSourceDiff }),
    buildGate('proposal_pull_request', proof.proposalPullRequest === true, 'Proposal pull request must exist.', { proposalPullRequest: !!proof.proposalPullRequest }),
    buildGate('approved_review_artifact', proof.approvedReviewArtifact === true, 'Approved review artifact must exist.', { approvedReviewArtifact: !!proof.approvedReviewArtifact }),
    buildGate('approved_executor_plan', proof.approvedExecutorPlan === true, 'Approved executor plan must exist.', { approvedExecutorPlan: !!proof.approvedExecutorPlan }),
    buildGate('target_branch_visible', proof.targetBranchVisible === true, 'Target proposal branch must be visible for manual apply.', { targetBranchVisible: !!proof.targetBranchVisible }),
  ];

  const eligible = gates.every((gate) => gate.passed);
  return {
    schemaVersion: 1,
    kind: validatedContract.outputContract.receiptKind,
    version: 'v1',
    status: eligible ? validatedContract.outputContract.eligibleStatus : validatedContract.outputContract.blockedStatus,
    mode: validatedContract.mode,
    manualApplyIntent: {
      kind: validatedContract.manualApplyIntent.kind,
      repository: validatedPlan.repository,
      baseBranch: validatedPlan.baseBranch,
      branchPrefix: validatedPlan.requiredBranchPrefix,
      mappedAction: validatedPlan.mappedAction,
      publishPath: validatedPlan.publishPath,
    },
    governance: {
      automerge: false,
      autopublish: false,
      directMainPush: false,
      externalDirectExecution: false,
    },
    proof,
    gates,
  };
}
