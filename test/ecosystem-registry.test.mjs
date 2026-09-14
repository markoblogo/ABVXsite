import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEcosystemRegistry,
  buildImpactPlan,
  renderReadmeBlock,
  upsertManagedReadmeBlock,
  applyRepositoryObservations,
} from '../scripts/ecosystem-registry-lib.mjs';

const graph = {
  schemaVersion: 1,
  kind: 'ABVXEcosystemGraph',
  nodes: [
    {
      id: 'skills',
      name: 'Skills',
      repository: 'markoblogo/skills',
      visibility: 'public',
      lifecycle: 'active',
      summary: 'Shared capability layer.',
      canonicalUrl: 'https://example.test/skills',
      propagation: { website: true, readme: true, releaseSocial: true, shortLinks: 'campaigns_only' },
    },
    {
      id: 'app',
      name: 'App',
      repository: 'markoblogo/app',
      visibility: 'public',
      lifecycle: 'active',
      summary: 'Example consumer.',
      canonicalUrl: 'https://example.test/app',
      propagation: { website: true, readme: true, releaseSocial: false, shortLinks: 'disabled' },
    },
  ],
  relations: [
    {
      from: 'app',
      type: 'uses',
      to: 'skills',
      status: 'active',
      summary: 'Uses reviewable skills during development.',
      propagation: { watch: ['release', 'summary', 'canonicalUrl'], surfaces: ['readme', 'website'], compatibility: 'docs' },
    },
  ],
};

test('builds a deterministic, read-only ecosystem registry', () => {
  const registry = buildEcosystemRegistry({ graph, generatedAt: '2026-09-14T00:00:00.000Z' });
  assert.equal(registry.kind, 'ABVXEcosystemRegistry');
  assert.equal(registry.authority, 'read');
  assert.equal(registry.externalSideEffects, false);
  assert.match(registry.sourceDigest, /^[a-f0-9]{64}$/);
  assert.deepEqual(registry.nodes.map(({ id }) => id), ['app', 'skills']);
});

test('applies observed descriptions and releases and reports propagation fields', () => {
  const result = applyRepositoryObservations({
    graph,
    observedAt: '2026-09-14T01:00:00.000Z',
    observations: [{
      repository: 'markoblogo/skills',
      description: 'Updated capability layer.',
      homepageUrl: 'https://example.test/skills',
      latestRelease: { tag: 'v1.2.0', url: 'https://example.test/release/v1.2.0', publishedAt: '2026-09-14T00:30:00Z' },
    }],
  });
  assert.deepEqual(result.changes, [{ nodeId: 'skills', changedFields: ['summary', 'canonicalUrl', 'release'] }]);
  assert.equal(result.graph.nodes[0].release.tag, 'v1.2.0');
  assert.equal(result.graph.updatedAt, '2026-09-14T01:00:00.000Z');
});

test('rejects dangling relations and unsafe private social publication', () => {
  assert.throws(() => buildEcosystemRegistry({
    graph: { ...graph, relations: [{ ...graph.relations[0], to: 'missing' }] },
    generatedAt: '2026-09-14T00:00:00.000Z',
  }), /unknown node/);

  assert.throws(() => buildEcosystemRegistry({
    graph: {
      ...graph,
      nodes: graph.nodes.map((node) => node.id === 'app'
        ? { ...node, visibility: 'private', propagation: { ...node.propagation, releaseSocial: true } }
        : node),
    },
    generatedAt: '2026-09-14T00:00:00.000Z',
  }), /private node.*releaseSocial/);
});

test('plans only declared downstream updates for a provider change', () => {
  const registry = buildEcosystemRegistry({ graph, generatedAt: '2026-09-14T00:00:00.000Z' });
  const plan = buildImpactPlan({ registry, changedNode: 'skills', changedFields: ['release', 'summary'] });
  assert.deepEqual(plan.impacts, [{
    consumer: 'app',
    provider: 'skills',
    relation: 'uses',
    changedFields: ['release', 'summary'],
    surfaces: ['readme', 'website'],
    compatibility: 'docs',
  }]);
});

test('renders a stable managed README block with active companions only', () => {
  const registry = buildEcosystemRegistry({ graph, generatedAt: '2026-09-14T00:00:00.000Z' });
  const block = renderReadmeBlock({ registry, nodeId: 'app' });
  assert.match(block, /<!-- ABVX:ECOSYSTEM:BEGIN -->/);
  assert.match(block, /\[Skills\]\(https:\/\/example\.test\/skills\)/);
  assert.match(block, /Uses reviewable skills during development\./);
  assert.match(block, /<!-- ABVX:ECOSYSTEM:END -->/);
});

test('adds and replaces only the managed README block', () => {
  const first = upsertManagedReadmeBlock({ readme: '# App\n\nOwner text.\n', block: '<!-- ABVX:ECOSYSTEM:BEGIN -->\nold\n<!-- ABVX:ECOSYSTEM:END -->\n' });
  const second = upsertManagedReadmeBlock({ readme: first, block: '<!-- ABVX:ECOSYSTEM:BEGIN -->\nnew\n<!-- ABVX:ECOSYSTEM:END -->\n' });
  assert.match(second, /^# App\n\nOwner text\./);
  assert.doesNotMatch(second, /\nold\n/);
  assert.match(second, /\nnew\n/);
  assert.throws(() => upsertManagedReadmeBlock({ readme: '# App\n<!-- ABVX:ECOSYSTEM:BEGIN -->', block: 'x' }), /incomplete/);
});
