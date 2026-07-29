import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  buildActualExecutorWiringReceipt,
  validateActualExecutorWiringContract,
  validateExecutorWiringPlanForActualWiring,
} from '../scripts/cortex-abv-actual-executor-wiring-lib.mjs';

const contract = JSON.parse(readFileSync(new URL('../cortex-abv/actual-executor-wiring.v1.json', import.meta.url), 'utf8'));

function approvedPlan(overrides = {}) {
  return {
    schemaVersion: 1,
    kind: 'CortexABVExecutorWiringPlan',
    version: 'v1',
    authority: 'write',
    externalSideEffects: false,
    status: 'ready_for_owner_merge',
    mode: 'approved_review_pr_first_only',
    targetSurfaceId: 'abvxsite-project-copy',
    repository: 'markoblogo/ABVXsite',
    baseBranch: 'main',
    requiredBranchPrefix: 'cortexabv/write-side-',
    reviewArtifactKind: 'CortexABVWriteExecutorReviewArtifact',
    reviewArtifactOwnerStatus: 'approved',
    mappedAction: 'owner_merge_pull_request',
    publishPath: 'pull_request_merge_only',
    autopublish: false,
    ownerTriggerRequired: true,
    externalDirectExecution: false,
    observedSourceCount: 1,
    ownerDecision: 'Approved after owner review.',
    ...overrides,
  };
}

test('actual executor wiring contract validates manual-apply-only scope', () => {
  const validated = validateActualExecutorWiringContract(contract);
  assert.equal(validated.mode, 'approved_plan_manual_apply_only');
  assert.equal(validated.outputContract.eligibleStatus, 'eligible_for_manual_apply_only');
});

test('actual executor wiring accepts only approved PR-first plans', () => {
  const plan = approvedPlan();
  const validated = validateExecutorWiringPlanForActualWiring(plan, contract);
  assert.equal(validated.mappedAction, 'owner_merge_pull_request');
  assert.throws(
    () => validateExecutorWiringPlanForActualWiring(approvedPlan({ autopublish: true }), contract),
    /plan.autopublish must be false/,
  );
});

test('actual executor wiring receipt is eligible only when proof chain is complete', () => {
  const receipt = buildActualExecutorWiringReceipt({
    contract,
    plan: approvedPlan(),
    proof: {
      realSourceDiff: true,
      proposalPullRequest: true,
      approvedReviewArtifact: true,
      approvedExecutorPlan: true,
      targetBranchVisible: true,
    },
  });
  assert.equal(receipt.status, 'eligible_for_manual_apply_only');
  assert.equal(receipt.manualApplyIntent.kind, 'pull_request_merge_intent');
});

test('actual executor wiring receipt blocks incomplete proof chain', () => {
  const receipt = buildActualExecutorWiringReceipt({
    contract,
    plan: approvedPlan(),
    proof: {
      realSourceDiff: false,
      proposalPullRequest: false,
      approvedReviewArtifact: true,
      approvedExecutorPlan: true,
      targetBranchVisible: false,
    },
  });
  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.gates.filter((gate) => !gate.passed).length, 3);
});
