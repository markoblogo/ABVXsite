import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRepositoryObservationSnapshot } from '../scripts/cortex-abv-repository-observer-lib.mjs';

const registry = {
  schemaVersion: 1,
  kind: 'CortexABVPublicProjectRegistry',
  sourceDigest: 'a'.repeat(64),
  entries: [
    {
      id: 'repository:github:markoblogo/alpha',
      repository: { provider: 'github', fullName: 'markoblogo/alpha', url: 'https://github.com/markoblogo/alpha' },
      project: { id: 'project:alpha', canonicalUrl: 'https://abvx.xyz/work/alpha' },
      landing: { canonicalUrl: 'https://abvx.xyz/work/alpha' },
      lab: { catalogued: true, canonicalUrl: 'https://abvx.xyz/systems' },
      publicChannels: [],
      provenance: [{ kind: 'content_frontmatter', path: 'content/work/alpha.md', digest: 'b'.repeat(64) }],
    },
  ],
};

test('records public repository metadata and head SHA only for registry allowlist entries', () => {
  const snapshot = buildRepositoryObservationSnapshot({
    registry,
    observedAt: '2026-07-16T00:00:00.000Z',
    observations: [{
      id: 'repository:github:markoblogo/alpha',
      status: 'observed',
      metadata: {
        defaultBranch: 'main',
        headSha: 'c'.repeat(40),
        pushedAt: '2026-07-15T12:00:00Z',
        updatedAt: '2026-07-15T12:01:00Z',
        visibility: 'public',
      },
    }],
  });

  assert.equal(snapshot.kind, 'CortexABVRepositoryObservationSnapshot');
  assert.equal(snapshot.authority, 'read');
  assert.equal(snapshot.externalSideEffects, false);
  assert.equal(snapshot.coverage.registeredRepositories, 1);
  assert.equal(snapshot.coverage.observerEligibleRepositories, 1);
  assert.equal(snapshot.coverage.observedRepositories, 1);
  assert.deepEqual(snapshot.observations, [{
    id: 'repository:github:markoblogo/alpha',
    repository: registry.entries[0].repository,
    project: registry.entries[0].project,
    landing: registry.entries[0].landing,
    status: 'observed',
    metadata: {
      defaultBranch: 'main',
      headSha: 'c'.repeat(40),
      pushedAt: '2026-07-15T12:00:00Z',
      updatedAt: '2026-07-15T12:01:00Z',
      visibility: 'public',
    },
    provenance: registry.entries[0].provenance,
  }]);
  assert.match(snapshot.sourceDigest, /^[a-f0-9]{64}$/);
});

test('retains unavailable allowlisted repositories as evidence instead of inventing a result', () => {
  const snapshot = buildRepositoryObservationSnapshot({
    registry,
    observedAt: '2026-07-16T00:00:00.000Z',
    observations: [{ id: 'repository:github:markoblogo/alpha', status: 'unavailable', reason: 'GitHub 404' }],
  });

  assert.equal(snapshot.coverage.observedRepositories, 0);
  assert.deepEqual(snapshot.observations[0], {
    id: 'repository:github:markoblogo/alpha',
    repository: registry.entries[0].repository,
    project: registry.entries[0].project,
    landing: registry.entries[0].landing,
    status: 'unavailable',
    reason: 'GitHub 404',
    provenance: registry.entries[0].provenance,
  });
});

test('rejects an observation outside the registry allowlist', () => {
  assert.throws(() => buildRepositoryObservationSnapshot({
    registry,
    observedAt: '2026-07-16T00:00:00.000Z',
    observations: [{ id: 'repository:github:markoblogo/not-registered', status: 'unavailable', reason: 'GitHub 404' }],
  }), /not allowlisted/);
});

test('does not require a public-read observation for a registry entry explicitly marked private', () => {
  const privateRegistry = {
    ...registry,
    entries: [{ ...registry.entries[0], observer: { enabled: false, reason: 'private_repository' } }],
  };
  const snapshot = buildRepositoryObservationSnapshot({ registry: privateRegistry, observedAt: '2026-07-16T00:00:00.000Z', observations: [] });

  assert.deepEqual(snapshot.coverage, {
    registeredRepositories: 1,
    observerEligibleRepositories: 0,
    observedRepositories: 0,
    unavailableRepositories: 0,
    excludedRepositories: 1,
  });
  assert.deepEqual(snapshot.excluded, [{
    id: 'repository:github:markoblogo/alpha',
    repository: registry.entries[0].repository,
    reason: 'private_repository',
  }]);
});
