import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadFeedModule } from '../scripts/load-feed-modules.mjs';
import { fetchWritingSourceFallback } from '../scripts/writing-source-fallback.mjs';
import { registerWritingItems, mergeWritingItems, sortWritingItems, writingCardSource, validateWritingDiscovery, writingUrlKey } from '../src/lib/writing-chronology.mjs';

const now = '2026-10-12T10:00:00.000Z';
const post = (url, publishedAt, source = 'abvx') => ({ url, publishedAt, title: url, source });
const empty = { version: 1, items: [] };

test('older original content added later leads the same-day RSS posts', () => {
  const first = registerWritingItems(empty, [post('https://abvx.substack.com/p/first', '2026-10-12T09:00:00Z', 'substack')], { now: '2026-10-12T09:05:00.000Z' });
  const added = registerWritingItems(first, [post('/writing/new-case', '2026-10-10')], { now });
  assert.equal(sortWritingItems(added.items)[0].url, '/writing/new-case');
  assert.equal(added.items.find(i => i.source === 'abvx').publishedAt, '2026-10-10T00:00:00.000Z');
});

test('registration is idempotent and metadata edits, empty sources and retries retain the first time', () => {
  const item = post('https://abvx.substack.com/p/example?utm_source=rss', '2026-10-10', 'substack');
  const first = registerWritingItems(empty, [item], { now });
  assert.deepEqual(registerWritingItems(first, [item], { now: '2026-10-13T10:00:00.000Z' }), first);
  const changed = registerWritingItems(first, [{ ...item, title: 'Revised' }], { now: '2026-10-13T10:00:00.000Z' });
  assert.equal(changed.items[0].addedAt, now);
  assert.equal(changed.items[0].title, 'Revised');
  assert.deepEqual(registerWritingItems(first, [], { now }), first);
});

test('bootstrap preserves the archive instead of making every historic post new', () => {
  const initial = registerWritingItems(empty, [post('/writing/old', '2020-02-02')], { now, bootstrap: true });
  assert.equal(initial.items[0].addedAt, '2020-02-02T00:00:00.000Z');
  assert.equal(initial.items[0].addedAtBasis, 'legacy-source');
});

test('sorting compares actual instants across timezone offsets and has stable ties', () => {
  const early = post('/writing/early', '2026-10-11T02:00:00Z');
  const late = post('/writing/late', '2026-10-10T23:30:00-05:00');
  assert.deepEqual(sortWritingItems([early, late]).map(i => i.url), [late.url, early.url]);
  const a = { ...early, url: '/writing/a' }, b = { ...early, url: '/writing/b' };
  assert.deepEqual(sortWritingItems([b, a]), sortWritingItems([a, b]));
});

test('the shared RSS adapter also sorts timestamps numerically', () => {
  const { mergeFeeds } = loadFeedModule(path.resolve('src/lib/feeds.ts'));
  const early = post('/writing/early', '2026-10-11T02:00:00Z');
  const late = post('/writing/late', '2026-10-10T23:30:00-05:00');
  assert.deepEqual(mergeFeeds([early], [late]), [late, early]);
});

test('native companion replaces the feed video and a removed native record does not resurrect', () => {
  const video = post('https://www.youtube.com/watch?v=NewVideo001', '2026-10-10T10:00:00Z', 'youtube');
  const native = { ...post('/writing/video-notes', video.publishedAt, 'youtube'), videoUrl: video.url };
  const registry = registerWritingItems(empty, [video, native, post('/writing/private-now', '2026-10-10')], { now });
  const result = mergeWritingItems([native], registry);
  assert.equal(result.length, 1);
  assert.equal(result[0].url, native.url);
  assert.equal(result[0].addedAt, now);
  assert.equal(mergeWritingItems([], registry)[0].url, '/writing/videos/NewVideo001');
});

test('card labels describe the actual destination across four sources', () => {
  for (const [source, url, cta] of [
    ['abvx', '/writing/story', 'Read on ABVX'],
    ['medium', 'https://medium.com/@abvcreative/story', 'Read on Medium'],
    ['substack', 'https://abvx.substack.com/p/story', 'Read on Substack'],
    ['youtube', 'https://www.youtube.com/watch?v=NewVideo001', 'Watch on YouTube'],
  ]) assert.equal(writingCardSource(post(url, now, source)).cta, cta);
  assert.equal(writingCardSource({ ...post('/writing/video', now, 'youtube'), videoUrl: 'https://www.youtube.com/watch?v=NewVideo001' }).cta, 'Watch on ABVX');
});

test('invalid, future, duplicate and unsafe registry entries are rejected', () => {
  const valid = registerWritingItems(empty, [post('/writing/test', '2026-10-10')], { now });
  assert.deepEqual(validateWritingDiscovery(valid, Date.parse(now)), []);
  for (const change of [
    { addedAt: '2026-02-30T10:00:00.000Z' }, { addedAt: '2026-10-13T10:00:00.000Z' },
    { url: 'https://evil.example/story' }, { source: 'mn7r' }, { addedAtBasis: 'invented' },
  ]) assert.ok(validateWritingDiscovery({ ...valid, items: [{ ...valid.items[0], ...change }] }, Date.parse(now)).length);
  assert.ok(validateWritingDiscovery({ ...valid, items: [...valid.items, ...valid.items] }, Date.parse(now)).length);
  assert.equal(writingUrlKey('https://user:secret@abvx.substack.com/p/test'), '');
  assert.ok(validateWritingDiscovery({ version: 1, items: [null] }).length);
});

test('homepage and Writing share the same feed without adding homepage slots', () => {
  const home = readFileSync('src/app/page.tsx', 'utf8');
  const writing = readFileSync('src/app/writing/page.tsx', 'utf8');
  assert.ok(home.includes('(await getWritingFeed()).slice(0, 3)'));
  assert.ok(home.includes('[0, 1, 2].map'));
  assert.ok(writing.includes('const allPosts = await getWritingFeed()'));
  assert.ok(!home.includes('mediumLatest'));
});

test('public fallback accepts only recognized source metadata and survives endpoint failures', async () => {
  const item = post('https://abvx.substack.com/p/test', '2026-10-10', 'substack');
  const calls = [];
  const fetcher = async url => {
    calls.push(url);
    return Response.json([item, { ...item, source: 'medium' }, { ...item, url: 'https://evil.example/test' }]);
  };
  assert.deepEqual(await fetchWritingSourceFallback('substack', fetcher), [item]);
  assert.deepEqual(calls, ['https://abvx.xyz/api/writing/feed/substack']);
  assert.deepEqual(await fetchWritingSourceFallback('../private', fetcher), []);
  assert.equal(calls.length, 1);
  assert.deepEqual(await fetchWritingSourceFallback('substack', async () => new Response('', { status: 503 })), []);
  assert.deepEqual(await fetchWritingSourceFallback('substack', async () => { throw new Error('Offline'); }), []);
});

test('Writing feed polls bypass the data cache and see newly published entries', async (t) => {
  const { fetchAllowedText } = loadFeedModule(path.resolve('src/lib/feed-http.ts'));
  const stored = new Map();
  let upstream = 'previous feed';
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    if (init.cache === 'no-store') return new Response(upstream);
    if (!stored.has(url)) stored.set(url, upstream);
    return new Response(stored.get(url));
  });
  for (const [source, url] of [
    ['substack', 'https://abvx.substack.com/feed'],
    ['medium', 'https://abvcreative.medium.com/feed'],
    ['youtube', 'https://www.youtube.com/feeds/videos.xml?channel_id=UCexample'],
  ]) {
    upstream = 'previous feed';
    assert.equal(await fetchAllowedText(url, source, 'feed'), 'previous feed');
    upstream = 'newly published entry';
    assert.equal(await fetchAllowedText(url, source, 'feed'), upstream, source);
  }
});

test('MN7R render-time feeds preserve ISR caching while Writing articles keep their cache', async (t) => {
  const { fetchAllowedText } = loadFeedModule(path.resolve('src/lib/feed-http.ts'));
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url, init });
    return new Response('feed or article');
  });
  for (const [source, url, kind] of [
    ['mn7r', 'https://mn7r.com/feed', 'feed'],
    ['mn7r', 'https://mn7r.com/post', 'article'],
    ['substack', 'https://abvx.substack.com/p/post', 'article'],
    ['medium', 'https://abvcreative.medium.com/post', 'article'],
    ['youtube', 'https://www.youtube.com/watch?v=Example0001', 'article'],
  ]) {
    assert.equal(await fetchAllowedText(url, source, kind), 'feed or article');
    const init = calls.at(-1).init;
    assert.equal(init.cache, undefined, `${source}/${kind} must not disable ISR`);
    assert.equal(init.next?.revalidate, 900, `${source}/${kind}`);
  }
});
test('runtime first-addition ordering is used when no immutable discovery entry exists',()=>{
 const runtime={...post('/writing/imported-old','2020-01-01'),addedAt:'2026-10-26T14:00:00.000Z'};
 const recent=post('/writing/recent','2026-10-20');
 const merged=mergeWritingItems([runtime,recent],{version:1,items:[]},Date.parse('2026-10-27'));
 assert.equal(merged[0].url,runtime.url);assert.equal(merged[0].addedAt,runtime.addedAt);
});

test('confirmed removed videos stay out of the feed through RSS refresh and return after restoration', () => {
  const video = post('https://www.youtube.com/watch?v=NewVideo001', '2026-10-10', 'youtube');
  const first = registerWritingItems(empty, [video], { now });
  first.items[0].youtubeAvailability = 'removed';
  const refreshed = registerWritingItems(first, [video], { now });
  assert.equal(mergeWritingItems([], refreshed).length, 0);
  const companion = { ...post('/writing/video-notes', video.publishedAt, 'youtube'), videoUrl: video.url };
  assert.equal(mergeWritingItems([companion], refreshed).length, 0);
  assert.equal(refreshed.items[0].addedAt, now);
  refreshed.items[0].youtubeAvailability = 'available';
  assert.equal(mergeWritingItems([], refreshed).length, 1);
});
