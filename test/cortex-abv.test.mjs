import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createAutonomousApplyReceipt, createObservedEventBatch, createProjectCopySyncProposal, renderEvidenceReceipt, validatePublicPolicy } from '../scripts/cortex-abv-lib.mjs';
import { validateAutonomousPublicSyncProfile } from '../scripts/project-description-sync-lib.mjs';

const policy = {
  schemaVersion: 1,
  name: 'CortexABV public-site adapter',
  mode: 'proposal_only',
  approvedSources: ['site_content'],
  allowedProposalActions: ['project_copy_sync'],
  automaticActions: [],
  forbiddenActions: ['publish_external_post', 'send_message', 'send_email', 'change_identity_fields', 'store_private_profile'],
};

test('keeps the public-site adapter proposal-only', () => {
  assert.deepEqual(validatePublicPolicy(policy).allowedActions, ['project_copy_sync']);
  assert.throws(() => validatePublicPolicy({ ...policy, automaticActions: ['publish_external_post'] }), /automaticActions must be empty/);
});

test('tracks the approved ABVXsite direct-write targets', () => {
  const profile = JSON.parse(readFileSync(path.join(process.cwd(), 'cortex-abv/autonomous-public-sync.v1.json'), 'utf8'));
  assert.equal(profile.authority, 'write');
  assert.deepEqual(profile.targets.filter((target) => target.enabled).map((target) => target.slug), ['mn7r', 'cropto', 'spike-spot-commodity-index-ukraine']);
  assert.deepEqual(profile.targets.find((target) => target.slug === 'abvx-lab'), {
    slug: 'abvx-lab', enabled: false, target: 'markoblogo/lab.abvx/main', reason: 'pending_LAB_REPO_TOKEN_with_contents_write',
  });
  assert.deepEqual(profile.rollback, { strategy: 'git_revert', automatic: false });
});

test('creates an evidence-bound project copy proposal without external side effects', () => {
  const proposal = createProjectCopySyncProposal({
    slug: 'mn7r',
    repository: 'markoblogo/mn7r',
    ref: 'main',
    paths: ['README.md'],
    sourceCommit: 'abc123def456',
    createdAt: '2026-07-16T12:00:00.000Z',
  });

  assert.equal(proposal.status, 'pending_review');
  assert.equal(proposal.authority, 'proposal');
  assert.equal(proposal.externalSideEffects, false);
  assert.deepEqual(proposal.allowedPatchFields, ['summary', 'body', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt']);
  assert.deepEqual(proposal.evidence, [{ repository: 'markoblogo/mn7r', ref: 'main', path: 'README.md', commit: 'abc123def456' }]);
  assert.equal(proposal.decisionTrace.policySource, 'base');
  assert.equal(proposal.decisionTrace.basePolicy.allowedPatchFields[0], 'summary');
  assert.equal(proposal.decisionTrace.sourceOverride, null);
});

test('creates proposal with explicit source-specific decision trace', () => {
  const proposal = createProjectCopySyncProposal({
    slug: 'mn7r',
    repository: 'markoblogo/mn7r',
    ref: 'main',
    paths: ['README.md'],
    sourceCommit: 'abc123def456',
    createdAt: '2026-07-16T12:00:00.000Z',
    decisionTrace: {
      policySource: 'source_specific_override',
      reason: 'monitor adapter applies stricter public patching',
      sourceKind: 'owned_project_ecosystem',
      sourceId: 'monitor',
      sourceOverride: {
        allowedPatchFields: ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'],
      },
    },
  });

  assert.equal(proposal.decisionTrace.policySource, 'source_specific_override');
  assert.equal(proposal.decisionTrace.sourceKind, 'owned_project_ecosystem');
  assert.equal(proposal.decisionTrace.sourceId, 'monitor');
});

test('observes only source commits that differ from last applied provenance', () => {
  const batch = createObservedEventBatch({
    observedAt: '2026-07-16T12:00:00.000Z',
    targets: [
      {
        slug: 'mn7r',
        sync: { repository: 'markoblogo/mn7r', ref: 'main', paths: ['README.md'], lastAppliedCommit: 'already-applied' },
        sourceCommit: 'new-commit',
      },
      {
        slug: 'cropto',
        sync: { repository: 'markoblogo/cropto-v0', ref: 'main', paths: ['README.md'], lastAppliedCommit: 'same-commit' },
        sourceCommit: 'same-commit',
      },
    ],
  });

  assert.equal(batch.kind, 'CortexABVObservedEventBatch');
  assert.equal(batch.shouldRunCopySync, true);
  assert.equal(batch.proposals.length, 1);
  assert.equal(batch.proposals[0].target.slug, 'mn7r');
  assert.equal(batch.proposals[0].externalSideEffects, false);
  assert.equal(batch.proposals[0].decisionTrace.policySource, 'base');
});

test('propagates source-specific decision trace from observed target metadata', () => {
  const batch = createObservedEventBatch({
    observedAt: '2026-07-16T12:00:00.000Z',
    targets: [{
      slug: 'mn7r',
      sync: { repository: 'markoblogo/mn7r', ref: 'main', paths: ['README.md'], lastAppliedCommit: 'already-applied' },
      sourceCommit: 'new-commit',
      decisionTrace: {
        policySource: 'source_specific_override',
        reason: 'monitor adapter applies stricter public patching',
        sourceKind: 'owned_project_ecosystem',
        sourceId: 'monitor',
      },
    }],
  });

  assert.equal(batch.proposals.length, 1);
  assert.equal(batch.proposals[0].decisionTrace.policySource, 'source_specific_override');
  assert.equal(batch.proposals[0].decisionTrace.sourceKind, 'owned_project_ecosystem');
  assert.equal(batch.proposals[0].decisionTrace.sourceId, 'monitor');
});

test('does not invoke copy sync when every observed commit is already applied', () => {
  const batch = createObservedEventBatch({
    observedAt: '2026-07-16T12:00:00.000Z',
    targets: [{
      slug: 'mn7r',
      sync: { repository: 'markoblogo/mn7r', ref: 'main', paths: ['README.md'], lastAppliedCommit: 'same-commit' },
      sourceCommit: 'same-commit',
    }],
  });

  assert.equal(batch.shouldRunCopySync, false);
  assert.deepEqual(batch.proposals, []);
});

test('rejects an event target whose slug cannot safely identify a project', () => {
  assert.throws(() => createObservedEventBatch({
    observedAt: '2026-07-16T12:00:00.000Z',
    targets: [{
      slug: 'mn7r; send-message',
      sync: { repository: 'markoblogo/mn7r', ref: 'main', paths: ['README.md'] },
      sourceCommit: 'new-commit',
    }],
  }), /normalized project slug/);
});

test('renders a pending-review PR receipt from observed evidence only', () => {
  const batch = createObservedEventBatch({
    observedAt: '2026-07-16T12:00:00.000Z',
    targets: [{
      slug: 'mn7r',
      sync: { repository: 'markoblogo/mn7r', ref: 'main', paths: ['README.md', 'docs/product.md'] },
      sourceCommit: 'abc123def456',
    }],
  });

  const receipt = renderEvidenceReceipt(batch);
  assert.match(receipt, /Status: `pending_review`/);
  assert.match(receipt, /`markoblogo\/mn7r@abc123def456`/);
  assert.match(receipt, /`README\.md`/);
  assert.match(receipt, /- \[ \] Approve this bounded copy proposal/);
  assert.match(receipt, /- \[ \] Reject it and record the reason in the PR/);
  assert.doesNotMatch(receipt, /publish_external_post|send_message/);
});

test('renders claim-level source anchors without copying source text into the public receipt', () => {
  const batch = createObservedEventBatch({
    observedAt: '2026-07-16T12:00:00.000Z',
    targets: [{
      slug: 'mn7r',
      sync: { repository: 'markoblogo/mn7r', ref: 'main', paths: ['README.md'] },
      sourceCommit: 'abc123def456',
    }],
  });
  const receipt = renderEvidenceReceipt(batch, [{
    schemaVersion: 1,
    kind: 'CortexABVCopyProposal',
    slug: 'mn7r',
    sourceCommit: 'abc123def456',
    claims: [
      { field: 'summary', text: 'Public summary.', evidencePath: 'README.md', lineStart: 3, lineEnd: 5 },
      { field: 'bodyAppendix', text: 'Public body.', evidencePath: 'README.md', lineStart: 8, lineEnd: 10 },
    ],
  }]);

  assert.match(receipt, /Claim-to-source anchors/);
  assert.match(receipt, /`summary` → `README\.md:L3-L5`/);
  assert.match(receipt, /`bodyAppendix` → `README\.md:L8-L10`/);
  assert.doesNotMatch(receipt, /Public summary\.|Public body\./);
});

test('allows direct application only through an explicit per-target autonomous profile', () => {
  assert.deepEqual(validateAutonomousPublicSyncProfile({
    enabled: true,
    mode: 'direct_main',
    target: 'abvxsite',
    allowedPatchFields: ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'],
  }), {
    enabled: true,
    mode: 'direct_main',
    target: 'abvxsite',
    allowedPatchFields: ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'],
    decisionTrace: {
      policySource: 'base',
      reason: 'base public-sync profile policy is applied',
      basePolicy: { allowedPatchFields: ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'] },
      sourceOverride: null,
      sourceKind: null,
      sourceId: null,
    },
  });
  assert.deepEqual(validateAutonomousPublicSyncProfile({
    enabled: true,
    mode: 'direct_main',
    target: 'abvxsite',
    allowedPatchFields: ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'],
    decisionTrace: {
      policySource: 'source_specific_override',
      reason: 'monitor adapter route uses source policy',
      sourceKind: 'owned_project_ecosystem',
      sourceId: 'monitor',
    },
  }).decisionTrace, {
    policySource: 'source_specific_override',
    reason: 'monitor adapter route uses source policy',
    basePolicy: { allowedPatchFields: ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'] },
    sourceOverride: { allowedPatchFields: ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'] },
    sourceKind: 'owned_project_ecosystem',
    sourceId: 'monitor',
  });
  assert.throws(() => validateAutonomousPublicSyncProfile({ enabled: true, mode: 'direct_main', target: 'lab' }), /target must be abvxsite/);
});

test('records autonomous application evidence with a reversible target commit', () => {
  const batch = createObservedEventBatch({
    observedAt: '2026-07-16T12:00:00.000Z',
    targets: [{ slug: 'mn7r', sync: { repository: 'markoblogo/mn7r', ref: 'main', paths: ['README.md'] }, sourceCommit: 'source-commit' }],
  });
  const receipt = createAutonomousApplyReceipt({
    batch,
    copyProposals: [{
      schemaVersion: 1,
      kind: 'CortexABVCopyProposal',
      slug: 'mn7r',
      sourceCommit: 'source-commit',
      claims: [{ field: 'summary', text: 'Safe public summary.', evidencePath: 'README.md', lineStart: 2, lineEnd: 4 }],
    }],
    targetRepository: 'markoblogo/ABVXsite',
    targetBranch: 'main',
    previousCommit: 'previous-target-commit',
    appliedCommit: 'applied-target-commit',
    appliedAt: '2026-07-16T12:05:00.000Z',
  });
  assert.equal(receipt.authority, 'write');
  assert.equal(receipt.externalSideEffects, true);
  assert.equal(receipt.rollback.revertCommit, 'applied-target-commit');
  assert.deepEqual(receipt.claimAnchors, [{ slug: 'mn7r', field: 'summary', evidencePath: 'README.md', lineStart: 2, lineEnd: 4 }]);
  assert.doesNotMatch(JSON.stringify(receipt), /Safe public summary\./);
});

test('records source-specific admission trace in autonomous write receipt', () => {
  const batch = createObservedEventBatch({
    observedAt: '2026-07-16T12:00:00.000Z',
    targets: [{
      slug: 'mn7r',
      sync: { repository: 'markoblogo/mn7r', ref: 'main', paths: ['README.md'], lastAppliedCommit: 'applied-before' },
      sourceCommit: 'source-commit',
      decisionTrace: {
        policySource: 'source_specific_override',
        reason: 'monitor adapter applies stricter public patching',
        sourceKind: 'owned_project_ecosystem',
        sourceId: 'monitor',
      },
    }],
  });

  const receipt = createAutonomousApplyReceipt({
    batch,
    copyProposals: [{
      schemaVersion: 1,
      kind: 'CortexABVCopyProposal',
      slug: 'mn7r',
      sourceCommit: 'source-commit',
      claims: [{ field: 'summary', text: 'Safe public summary.', evidencePath: 'README.md', lineStart: 2, lineEnd: 4 }],
    }],
    targetRepository: 'markoblogo/ABVXsite',
    targetBranch: 'main',
    previousCommit: 'previous-target-commit',
    appliedCommit: 'applied-target-commit',
    appliedAt: '2026-07-16T12:05:00.000Z',
  });

  assert.equal(receipt.sources[0].decisionTrace.policySource, 'source_specific_override');
  assert.equal(receipt.sources[0].decisionTrace.sourceKind, 'owned_project_ecosystem');
  assert.equal(receipt.sources[0].decisionTrace.sourceId, 'monitor');
  assert.deepEqual(receipt.sources[0].decisionTrace.sourceOverride, { allowedPatchFields: [
    'summary',
    'bodyAppendix',
    'updatedAt',
    'sync.lastAppliedCommit',
    'sync.lastAppliedAt',
  ] });
});
