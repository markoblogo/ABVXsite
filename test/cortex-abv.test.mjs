import assert from 'node:assert/strict';
import test from 'node:test';
import { createObservedEventBatch, createProjectCopySyncProposal, renderEvidenceReceipt, validatePublicPolicy } from '../scripts/cortex-abv-lib.mjs';

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
      { field: 'body', text: 'Public body.', evidencePath: 'README.md', lineStart: 8, lineEnd: 10 },
    ],
  }]);

  assert.match(receipt, /Claim-to-source anchors/);
  assert.match(receipt, /`summary` → `README\.md:L3-L5`/);
  assert.match(receipt, /`body` → `README\.md:L8-L10`/);
  assert.doesNotMatch(receipt, /Public summary\.|Public body\./);
});
