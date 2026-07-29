import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildArtifact } from '../scripts/cortex-abv-write-side-review-artifact.mjs';
import {
  createWriteSidePolicyContract,
  validateWriteSideCopyProposal,
  validateWriteSideReviewArtifact,
} from '../scripts/cortex-abv-write-side-policy-lib.mjs';

const observedBatch = {
  schemaVersion: 1,
  kind: 'CortexABVObservedEventBatch',
  authority: 'read',
  observedAt: '2026-07-28T20:00:00.000Z',
  targetCount: 1,
  shouldRunCopySync: true,
  proposals: [
    {
      schemaVersion: 1,
      kind: 'CortexABVProposal',
      id: 'project-copy-sync:cropto:abc123def456',
      status: 'pending_review',
      authority: 'proposal',
      action: 'project_copy_sync',
      target: { slug: 'cropto', repository: 'markoblogo/cropto', ref: 'main' },
      evidence: [{ repository: 'markoblogo/cropto', ref: 'main', path: 'README.md', commit: 'abc123def456' }],
      allowedPatchFields: ['summary', 'body', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'],
      externalSideEffects: false,
      decisionTrace: {
        policySource: 'base',
        reason: 'base public-sync profile policy is applied',
        basePolicy: { allowedPatchFields: ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'] },
        sourceOverride: null,
        sourceKind: null,
        sourceId: null,
      },
      createdAt: '2026-07-28T20:00:00.000Z',
    },
  ],
};

const validCopyProposal = {
  schemaVersion: 1,
  kind: 'CortexABVCopyProposal',
  slug: 'cropto',
  sourceCommit: 'abc123def456',
  summary: 'Updated public summary.',
  bodyAppendix: 'One bounded appended paragraph.',
  claims: [
    { field: 'summary', evidencePath: 'README.md', lineStart: 10, lineEnd: 12 },
    { field: 'bodyAppendix', evidencePath: 'README.md', lineStart: 13, lineEnd: 14 },
  ],
};

test('write-side policy contract preserves the bounded fields and actions', () => {
  const policy = createWriteSidePolicyContract();
  assert.equal(policy.mode, 'owner_review_pr_only');
  assert.deepEqual(policy.allowedPatchFields, ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt']);
  assert.deepEqual(policy.allowedActions, ['project_copy_sync']);
  assert.match(JSON.stringify(policy.blockedActions), /publish_external_post/);
});

test('write-side policy accepts only bounded copy proposal shapes', () => {
  const result = validateWriteSideCopyProposal(validCopyProposal, observedBatch.proposals[0]);
  assert.deepEqual(result.changedFields, ['summary', 'bodyAppendix']);
  assert.throws(
    () => validateWriteSideCopyProposal({
      ...validCopyProposal,
      bodyAppendix: 'First paragraph.\n\nSecond paragraph.',
    }, observedBatch.proposals[0]),
    /single appended body paragraph/,
  );
  assert.throws(
    () => validateWriteSideCopyProposal({
      ...validCopyProposal,
      bodyAppendix: '',
      claims: [{ field: 'status', evidencePath: 'README.md', lineStart: 1, lineEnd: 2 }],
    }, observedBatch.proposals[0]),
    /blocks claim field: status/,
  );
});

test('write-side review artifact embeds and validates the mandatory policy contract', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cortex-abv-write-side-'));
  const batchPath = `${tempDir}/batch.json`;
  const claimsDir = `${tempDir}/claims`;
  mkdirSync(claimsDir, { recursive: true });
  writeFileSync(batchPath, `${JSON.stringify(observedBatch, null, 2)}\n`);
  writeFileSync(`${claimsDir}/cropto.json`, `${JSON.stringify(validCopyProposal, null, 2)}\n`);

  const artifact = buildArtifact({ batchPath, claimsDirectory: claimsDir });
  assert.equal(artifact.policy.kind, 'CortexABVWriteSidePolicy');
  assert.equal(artifact.policy.mode, 'owner_review_pr_only');
  assert.equal(artifact.ownerReview.status, 'pending_review');
  assert.equal(validateWriteSideReviewArtifact(artifact), artifact);
});

test('write-side review artifact can target index/spike candidate chain', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cortex-abv-write-side-'));
  const batchPath = `${tempDir}/batch.json`;
  const claimsDir = `${tempDir}/claims`;
  mkdirSync(claimsDir, { recursive: true });

  const spikeBatch = {
    ...observedBatch,
    proposals: [
      {
        ...observedBatch.proposals[0],
        id: 'project-copy-sync:spike-spot-commodity-index-ukraine:c25a7b0a1e80f0bfee46253ffca512748a305430',
        target: { slug: 'spike-spot-commodity-index-ukraine', repository: 'markoblogo/index', ref: 'main' },
        evidence: [{ repository: 'markoblogo/index', ref: 'main', path: 'README.md', commit: 'c25a7b0a1e80f0bfee46253ffca512748a305430' }],
        decisionTrace: {
          policySource: 'source_specific_override',
          reason: 'index/spike public-safe profile is applied',
          basePolicy: { allowedPatchFields: ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'] },
          sourceOverride: { allowedPatchFields: ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'] },
          sourceKind: 'owned_project_ecosystem',
          sourceId: 'index/spike',
        },
      },
    ],
  };

  const spikeCopyProposal = {
    ...validCopyProposal,
    slug: 'spike-spot-commodity-index-ukraine',
    sourceCommit: 'c25a7b0a1e80f0bfee46253ffca512748a305430',
    summary: 'Updated SPIKE public summary.',
    bodyAppendix: 'One bounded appended paragraph for the SPIKE project page.',
  };

  writeFileSync(batchPath, `${JSON.stringify(spikeBatch, null, 2)}\n`);
  writeFileSync(`${claimsDir}/spike.json`, `${JSON.stringify(spikeCopyProposal, null, 2)}\n`);

  const artifact = buildArtifact({ batchPath, claimsDirectory: claimsDir });
  assert.equal(artifact.observedSources[0].slug, 'spike-spot-commodity-index-ukraine');
  assert.equal(artifact.observedSources[0].repository, 'markoblogo/index');
  assert.equal(artifact.observedSources[0].decisionTrace.sourceId, 'index/spike');
});
