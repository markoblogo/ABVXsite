import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRepositoryChangeProposal } from '../scripts/cortex-abv-repository-change-proposal-lib.mjs';

function snapshot({ observedAt, sourceDigest, headSha, updatedAt }) {
  return {
    schemaVersion: 1,
    kind: 'CortexABVRepositoryObservationSnapshot',
    sourceDigest,
    observedAt,
    sourceRegistry: { path: 'cortex-abv/public-project-registry.v1.json', sourceDigest: 'a'.repeat(64) },
    observations: [{
      id: 'repository:github:markoblogo/alpha',
      repository: { provider: 'github', fullName: 'markoblogo/alpha', url: 'https://github.com/markoblogo/alpha' },
      project: { id: 'project:alpha', canonicalUrl: 'https://abvx.xyz/work/alpha' },
      landing: { canonicalUrl: 'https://abvx.xyz/work/alpha' },
      status: 'observed',
      metadata: {
        defaultBranch: 'main',
        headSha,
        pushedAt: '2026-07-15T12:00:00Z',
        updatedAt,
        visibility: 'public',
      },
      provenance: [{ kind: 'content_frontmatter', path: 'content/work/alpha.md', digest: 'b'.repeat(64) }],
    }],
  };
}

test('creates a pending-review evidence receipt for SHA and metadata changes only', () => {
  const proposal = buildRepositoryChangeProposal({
    baseline: snapshot({ observedAt: '2026-07-15T00:00:00.000Z', sourceDigest: 'c'.repeat(64), headSha: 'd'.repeat(40), updatedAt: '2026-07-15T12:00:00Z' }),
    candidate: snapshot({ observedAt: '2026-07-16T00:00:00.000Z', sourceDigest: 'e'.repeat(64), headSha: 'f'.repeat(40), updatedAt: '2026-07-16T12:00:00Z' }),
    createdAt: '2026-07-16T01:00:00.000Z',
  });

  assert.equal(proposal.kind, 'CortexABVRepositoryChangeProposal');
  assert.equal(proposal.authority, 'proposal');
  assert.equal(proposal.externalSideEffects, false);
  assert.equal(proposal.reviewStatus, 'pending_review');
  assert.deepEqual(proposal.evidence, {
    baseline: { observedAt: '2026-07-15T00:00:00.000Z', sourceDigest: 'c'.repeat(64) },
    candidate: { observedAt: '2026-07-16T00:00:00.000Z', sourceDigest: 'e'.repeat(64) },
    registrySourceDigest: 'a'.repeat(64),
  });
  assert.deepEqual(proposal.changes, [{
    id: 'repository:github:markoblogo/alpha',
    repository: { provider: 'github', fullName: 'markoblogo/alpha', url: 'https://github.com/markoblogo/alpha' },
    project: { id: 'project:alpha', canonicalUrl: 'https://abvx.xyz/work/alpha' },
    landing: { canonicalUrl: 'https://abvx.xyz/work/alpha' },
    changedFields: ['headSha', 'updatedAt'],
    before: { status: 'observed', defaultBranch: 'main', headSha: 'd'.repeat(40), pushedAt: '2026-07-15T12:00:00Z', updatedAt: '2026-07-15T12:00:00Z', visibility: 'public' },
    after: { status: 'observed', defaultBranch: 'main', headSha: 'f'.repeat(40), pushedAt: '2026-07-15T12:00:00Z', updatedAt: '2026-07-16T12:00:00Z', visibility: 'public' },
    provenance: [{ kind: 'content_frontmatter', path: 'content/work/alpha.md', digest: 'b'.repeat(64) }],
  }]);
  assert.match(proposal.sourceDigest, /^[a-f0-9]{64}$/);
});

test('rejects snapshots generated from different registry allowlists', () => {
  const baseline = snapshot({ observedAt: '2026-07-15T00:00:00.000Z', sourceDigest: 'c'.repeat(64), headSha: 'd'.repeat(40), updatedAt: '2026-07-15T12:00:00Z' });
  const candidate = { ...snapshot({ observedAt: '2026-07-16T00:00:00.000Z', sourceDigest: 'e'.repeat(64), headSha: 'f'.repeat(40), updatedAt: '2026-07-16T12:00:00Z' }), sourceRegistry: { path: 'cortex-abv/public-project-registry.v1.json', sourceDigest: 'z'.repeat(64) } };
  assert.throws(() => buildRepositoryChangeProposal({ baseline, candidate, createdAt: '2026-07-16T01:00:00.000Z' }), /same registry source digest/);
});
