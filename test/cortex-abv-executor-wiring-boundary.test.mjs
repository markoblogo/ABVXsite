import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  mapApprovedReviewArtifactToPrAction,
  validateApprovedReviewArtifactForWiring,
  validateExecutorWiringBoundary,
} from '../scripts/cortex-abv-executor-wiring-boundary-lib.mjs';

const boundary = JSON.parse(readFileSync(new URL('../cortex-abv/executor-wiring-boundary.v1.json', import.meta.url), 'utf8'));

function approvedArtifact(overrides = {}) {
  return {
    schemaVersion: 1,
    kind: 'CortexABVWriteExecutorReviewArtifact',
    version: 'v1',
    authority: 'write',
    externalSideEffects: false,
    status: 'pending_review',
    ownerReview: {
      status: 'approved',
      approved: true,
      rejected: false,
      ownerDecision: 'Approved for PR-first merge only.',
    },
    policy: {
      kind: 'CortexABVWriteSidePolicy',
      version: 'v1',
    },
    observedSources: [
      {
        slug: 'mn7r',
        repository: 'markoblogo/mn7r',
        commit: 'abc123',
        paths: ['README.md'],
        claimCount: 1,
      },
    ],
    ...overrides,
  };
}

test('executor wiring boundary validates ABVXsite-only approved-review PR-first scope', () => {
  const validated = validateExecutorWiringBoundary(boundary);
  assert.equal(validated.mode, 'approved_review_pr_first_only');
  assert.equal(validated.activeSurface.id, 'abvxsite-project-copy');
});

test('approved review artifact maps to owner_merge_pull_request plan only', () => {
  const artifact = approvedArtifact();
  assert.doesNotThrow(() => validateApprovedReviewArtifactForWiring(artifact));
  const plan = mapApprovedReviewArtifactToPrAction({ artifact, boundary });
  assert.equal(plan.status, 'ready_for_owner_merge');
  assert.equal(plan.mappedAction, 'owner_merge_pull_request');
  assert.equal(plan.autopublish, false);
  assert.equal(plan.externalDirectExecution, false);
});

test('wiring boundary rejects non-approved review artifacts', () => {
  assert.throws(
    () => validateApprovedReviewArtifactForWiring(approvedArtifact({
      ownerReview: {
        status: 'pending_review',
        approved: false,
        rejected: false,
        ownerDecision: null,
      },
    })),
    /ownerReview.status must be approved/,
  );
});

test('wiring boundary rejects if autopublish guard is removed', () => {
  assert.throws(
    () => validateExecutorWiringBoundary({
      ...boundary,
      forbiddenBehaviors: boundary.forbiddenBehaviors.filter((item) => item !== 'autopublish'),
    }),
    /must include autopublish/,
  );
});
