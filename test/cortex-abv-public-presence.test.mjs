import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPublicPresenceIndex, parseRssItems } from '../scripts/cortex-abv-public-presence-lib.mjs';

const config = {
  schemaVersion: 1,
  kind: 'CortexABVPublicPresenceSources',
  person: { id: 'person:anton-biletskyi-volokh', name: 'Anton Biletskyi-Volokh', canonicalUrl: 'https://abvx.xyz/about' },
  site: { id: 'site:abvx', name: 'ABVX', canonicalUrl: 'https://abvx.xyz/' },
  lab: { id: 'lab:abvx', name: 'ABVX Lab', canonicalUrl: 'https://abvx.xyz/systems' },
  writingFeeds: [{ id: 'writing:medium', name: 'Medium', feedUrl: 'https://example.com/feed', archiveUrl: 'https://abvx.xyz/writing' }],
};

test('builds a public, read-only entity index with provenance and graph relations', () => {
  const index = buildPublicPresenceIndex({
    config,
    generatedAt: '2026-07-16T00:00:00.000Z',
    contentItems: [
      {
        folder: 'work',
        filePath: 'content/work/alpha.md',
        data: {
          slug: 'alpha', title: 'Alpha', summary: 'A public system.', status: 'live', visibility: 'public',
          primarySection: 'systems', appearsIn: ['systems'], tags: ['systems'], links: [{ type: 'site', label: 'Site', url: 'https://alpha.example' }],
        },
      },
      {
        folder: 'work',
        filePath: 'content/work/private.md',
        data: { slug: 'private', title: 'Private', summary: 'Must not appear.', visibility: 'private' },
      },
    ],
    feedItemsBySource: {
      'writing:medium': [{ title: 'A public essay', url: 'https://example.com/essay', publishedAt: '2026-07-15T00:00:00.000Z', excerpt: 'Short public excerpt.' }],
    },
  });

  assert.equal(index.kind, 'CortexABVPublicPresenceIndex');
  assert.equal(index.authority, 'read');
  assert.equal(index.externalSideEffects, false);
  assert.equal(index.entities.some((entity) => entity.id === 'project:alpha'), true);
  assert.equal(index.entities.some((entity) => entity.id === 'project:private'), false);
  assert.equal(index.entities.find((entity) => entity.id === 'project:alpha').provenance[0].path, 'content/work/alpha.md');
  assert.equal(index.entities.some((entity) => entity.id === 'writing-item:medium:a-public-essay'), true);
  assert.equal(index.relations.some((relation) => relation.from === 'lab:abvx' && relation.to === 'project:alpha'), true);
  assert.match(index.sourceDigest, /^[a-f0-9]{64}$/);
});

test('keeps RSS retrieval as public data rather than executable instructions', () => {
  const items = parseRssItems('<rss><channel><item><title><![CDATA[Public note]]></title><link>https://example.com/note</link><pubDate>Tue, 15 Jul 2026 00:00:00 GMT</pubDate></item></channel></rss>');
  assert.deepEqual(items, [{ title: 'Public note', url: 'https://example.com/note', publishedAt: 'Tue, 15 Jul 2026 00:00:00 GMT' }]);
});
