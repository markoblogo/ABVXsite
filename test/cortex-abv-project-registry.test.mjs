import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPublicProjectRegistry } from '../scripts/cortex-abv-project-registry-lib.mjs';

const presenceIndex = {
  schemaVersion: 1,
  kind: 'CortexABVPublicPresenceIndex',
  sourceDigest: 'a'.repeat(64),
  entities: [
    { id: 'site:abvx', kind: 'site', canonicalUrl: 'https://abvx.xyz/' },
    { id: 'lab:abvx', kind: 'lab', canonicalUrl: 'https://abvx.xyz/systems' },
    {
      id: 'project:alpha', kind: 'project', name: 'Alpha', canonicalUrl: 'https://abvx.xyz/work/alpha', summary: 'Public Alpha.',
      attributes: {
        section: 'systems',
        links: [
          { type: 'github', label: 'GitHub', url: 'https://github.com/markoblogo/alpha' },
          { type: 'site', label: 'Site', url: 'https://alpha.example' },
          { type: 'bluesky', label: 'Bluesky', url: 'https://bsky.app/profile/alpha.example' },
        ],
      },
      provenance: [{ kind: 'content_frontmatter', path: 'content/work/alpha.md', digest: 'b'.repeat(64) }],
    },
    { id: 'project:no-repo', kind: 'project', name: 'No repo', canonicalUrl: 'https://abvx.xyz/work/no-repo', attributes: { links: [] }, provenance: [] },
  ],
  relations: [{ from: 'lab:abvx', type: 'catalogues', to: 'project:alpha' }],
};

test('maps only explicit public GitHub repositories to projects, landings, Lab and channels', () => {
  const registry = buildPublicProjectRegistry({ presenceIndex, generatedAt: '2026-07-16T00:00:00.000Z' });
  assert.equal(registry.kind, 'CortexABVPublicProjectRegistry');
  assert.equal(registry.authority, 'read');
  assert.equal(registry.externalSideEffects, false);
  assert.equal(registry.entries.length, 1);
  assert.deepEqual(registry.entries[0], {
    id: 'repository:github:markoblogo/alpha',
    repository: { provider: 'github', fullName: 'markoblogo/alpha', url: 'https://github.com/markoblogo/alpha' },
    project: { id: 'project:alpha', name: 'Alpha', canonicalUrl: 'https://abvx.xyz/work/alpha', summary: 'Public Alpha.' },
    landing: { canonicalUrl: 'https://abvx.xyz/work/alpha', host: 'abvx.xyz' },
    lab: { catalogued: true, canonicalUrl: 'https://abvx.xyz/systems' },
    publicChannels: [
      { type: 'site', label: 'Site', url: 'https://alpha.example' },
      { type: 'bluesky', label: 'Bluesky', url: 'https://bsky.app/profile/alpha.example' },
    ],
    provenance: [{ kind: 'content_frontmatter', path: 'content/work/alpha.md', digest: 'b'.repeat(64) }],
  });
  assert.match(registry.sourceDigest, /^[a-f0-9]{64}$/);
});

test('keeps a private repository link in the registry but opts it out of public observation', () => {
  const privateRegistry = buildPublicProjectRegistry({
    presenceIndex: {
      ...presenceIndex,
      entities: presenceIndex.entities.map((entity) => entity.id === 'project:alpha'
        ? { ...entity, attributes: { ...entity.attributes, repositoryObserver: { enabled: false, reason: 'private_repository' } } }
        : entity),
    },
    generatedAt: '2026-07-16T00:00:00.000Z',
  });

  assert.deepEqual(privateRegistry.entries[0].observer, { enabled: false, reason: 'private_repository' });
});
