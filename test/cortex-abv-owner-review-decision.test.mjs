import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildArtifact } from '../scripts/cortex-abv-write-side-review-artifact.mjs';
import { buildOwnerReviewDecisionArtifacts } from '../scripts/cortex-abv-owner-review-decision.mjs';

const observedBatch = {
  schemaVersion: 1,
  kind: 'CortexABVObservedEventBatch',
  authority: 'read',
  observedAt: '2026-07-29T08:17:00.000Z',
  targetCount: 1,
  shouldRunCopySync: true,
  proposals: [
    {
      schemaVersion: 1,
      kind: 'CortexABVProposal',
      id: 'project-copy-sync:spike-spot-commodity-index-ukraine:c25a7b0a1e80f0bfee46253ffca512748a305430',
      status: 'pending_review',
      authority: 'proposal',
      action: 'project_copy_sync',
      target: { slug: 'spike-spot-commodity-index-ukraine', repository: 'markoblogo/index', ref: 'main' },
      evidence: [{ repository: 'markoblogo/index', ref: 'main', path: 'README.md', commit: 'c25a7b0a1e80f0bfee46253ffca512748a305430' }],
      allowedPatchFields: ['summary', 'body', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'],
      externalSideEffects: false,
      decisionTrace: {
        policySource: 'source_specific_override',
        reason: 'index/spike public-safe profile is applied',
        basePolicy: { allowedPatchFields: ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'] },
        sourceOverride: { allowedPatchFields: ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'] },
        sourceKind: 'owned_project_ecosystem',
        sourceId: 'index/spike',
      },
      createdAt: '2026-07-29T08:17:00.000Z',
    },
  ],
};

const validCopyProposal = {
  schemaVersion: 1,
  kind: 'CortexABVCopyProposal',
  slug: 'spike-spot-commodity-index-ukraine',
  sourceCommit: 'c25a7b0a1e80f0bfee46253ffca512748a305430',
  summary: 'Updated SPIKE public summary.',
  bodyAppendix: 'One bounded appended public paragraph for the Index spike surface.',
  claims: [
    { field: 'summary', evidencePath: 'README.md', lineStart: 10, lineEnd: 12 },
    { field: 'bodyAppendix', evidencePath: 'README.md', lineStart: 13, lineEnd: 15 },
  ],
};

test('approved owner review builds an executor plan for index/spike candidate chain', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cortex-abv-owner-review-'));
  const batchPath = `${tempDir}/batch.json`;
  const claimsDir = `${tempDir}/claims`;
  const pendingPath = `${tempDir}/pending.json`;
  const approvedPath = `${tempDir}/approved.json`;
  const planPath = `${tempDir}/plan.json`;
  const boundaryPath = join(process.cwd(), 'cortex-abv/executor-wiring-boundary.v1.json');
  mkdirSync(claimsDir, { recursive: true });
  writeFileSync(batchPath, `${JSON.stringify(observedBatch, null, 2)}\n`);
  writeFileSync(`${claimsDir}/spike.json`, `${JSON.stringify(validCopyProposal, null, 2)}\n`);
  writeFileSync(pendingPath, `${JSON.stringify(buildArtifact({ batchPath, claimsDirectory: claimsDir }), null, 2)}\n`);

  const { reviewArtifact, plan } = buildOwnerReviewDecisionArtifacts({
    inputPath: pendingPath,
    status: 'approved',
    ownerDecision: 'Approved after owner review for SPIKE public-safe copy update.',
    outputPath: approvedPath,
    planOutputPath: planPath,
    boundaryPath,
  });

  assert.equal(reviewArtifact.ownerReview.status, 'approved');
  assert.equal(reviewArtifact.ownerReview.approved, true);
  assert.equal(plan.status, 'ready_for_owner_merge');
  assert.equal(plan.mappedAction, 'owner_merge_pull_request');
  assert.equal(JSON.parse(readFileSync(planPath, 'utf8')).targetSurfaceId, 'abvxsite-project-copy');
});

test('rejected owner review does not build an executor plan', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cortex-abv-owner-review-'));
  const batchPath = `${tempDir}/batch.json`;
  const claimsDir = `${tempDir}/claims`;
  const pendingPath = `${tempDir}/pending.json`;
  const rejectedPath = `${tempDir}/rejected.json`;
  const boundaryPath = join(process.cwd(), 'cortex-abv/executor-wiring-boundary.v1.json');
  mkdirSync(claimsDir, { recursive: true });
  writeFileSync(batchPath, `${JSON.stringify(observedBatch, null, 2)}\n`);
  writeFileSync(`${claimsDir}/spike.json`, `${JSON.stringify(validCopyProposal, null, 2)}\n`);
  writeFileSync(pendingPath, `${JSON.stringify(buildArtifact({ batchPath, claimsDirectory: claimsDir }), null, 2)}\n`);

  const { reviewArtifact, plan } = buildOwnerReviewDecisionArtifacts({
    inputPath: pendingPath,
    status: 'rejected',
    ownerDecision: 'Rejected because this public diff should be narrowed further.',
    outputPath: rejectedPath,
    boundaryPath,
  });

  assert.equal(reviewArtifact.ownerReview.status, 'rejected');
  assert.equal(reviewArtifact.ownerReview.rejected, true);
  assert.equal(plan, null);
});
