import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { validateYoutubeSettings } from '../scripts/youtube-settings-lib.mjs';

const require = createRequire(import.meta.url);
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const compiledModule = { exports: {} };
  modules.set(file, compiledModule);
  const output = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const localRequire = (name) => {
    if (!name.startsWith('.')) return require(name);
    const base = path.resolve(path.dirname(file), name);
    return load(['.ts', '.tsx'].map((extension) => `${base}${extension}`).find(existsSync));
  };
  new Function('require', 'module', 'exports', output)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const { parseYoutubeFeed, fetchYoutubeFeed, fetchYoutubeFeedWithStatus } = load(path.resolve('src/lib/youtube-feed.ts'));
const YouTubeEmbed = load(path.resolve('src/components/YouTubeEmbed.tsx')).default;
const RecentWritingCard = load(path.resolve('src/components/RecentWritingCard.tsx')).default;
const WritingArchiveRow = load(path.resolve('src/components/WritingArchiveRow.tsx')).default;
const FeaturedWritingCard = load(path.resolve('src/components/FeaturedWritingCard.tsx')).default;
const settings = { channelId: 'UCexample', publishedAfter: '2026-10-09T19:52:23Z', initialVideoId: 'RsxiDWDj2Rg' };
const now = Date.parse('2026-10-12T00:00:00Z');
function entry(id, published, { channel = 'UCexample', updated = published, title = 'AI &amp; tools' } = {}) {
  return `<entry><yt:videoId>${id}</yt:videoId><yt:channelId>${channel}</yt:channelId><title>${title}</title><published>${published}</published><updated>${updated}</updated><media:description>Useful &amp; practical.</media:description></entry>`;
}

test('imports only new publications plus the explicit initial demonstration', () => {
  const xml = entry('OldVideo001', '2026-10-08T10:00:00Z', { updated: '2026-10-11T00:00:00Z' })
    + entry('RsxiDWDj2Rg', '2026-10-09T11:31:00Z')
    + entry('NewVideo001', '2026-10-10T10:00:00Z')
    + entry('Boundary001', settings.publishedAfter);
  const items = parseYoutubeFeed(xml, settings, now);
  assert.deepEqual(items.map((i) => i.url), ['https://www.youtube.com/watch?v=NewVideo001', 'https://www.youtube.com/watch?v=RsxiDWDj2Rg']);
  assert.equal(items[0].title, 'AI & tools');
  assert.equal(items[0].excerpt, 'Useful & practical.');
  assert.equal(items[0].source, 'youtube');
});

test('rejects foreign channels, malformed IDs, invalid dates and future publications', () => {
  const xml = entry('Foreign0001', '2026-10-10T10:00:00Z', { channel: 'UCother' })
    + entry('../bad-code', '2026-10-10T10:00:00Z')
    + entry('Invalid0001', 'not-a-date')
    + entry('Future00001', '2026-10-13T10:00:00Z')
    + entry('EmptyTitle1', '2026-10-10T10:00:00Z', { title: '' });
  assert.deepEqual(parseYoutubeFeed(xml, settings, now), []);
  assert.deepEqual(parseYoutubeFeed(entry('NewVideo001', '2026-10-10T10:00:00Z'), { ...settings, publishedAfter: 'bad' }, now), []);
});

test('deduplicates videos and rejects untrusted thumbnail hosts', () => {
  const video = entry('NewVideo001', '2026-10-10T10:00:00Z').replace('</entry>', '<media:thumbnail url="https://evil.example/tracker"/></entry>');
  const items = parseYoutubeFeed(video + video, settings, now);
  assert.equal(items.length, 1);
  assert.equal(items[0].coverImage, 'https://i.ytimg.com/vi/NewVideo001/hqdefault.jpg');
});

test('feed failures return no videos and do not affect other sources', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('', { status: 503 });
  try {
    assert.deepEqual(await fetchYoutubeFeed('https://www.youtube.com/feeds/videos.xml?channel_id=UCexample', settings), []);
    assert.deepEqual(await fetchYoutubeFeed('https://evil.example/feed', settings), []);
  } finally { globalThis.fetch = original; }
});

test('renders a lazy privacy-enhanced embedded player and rejects arbitrary iframe URLs', () => {
  const html = renderToStaticMarkup(createElement(YouTubeEmbed, { href: 'https://www.youtube.com/watch?v=RsxiDWDj2Rg', title: 'AI & tools' }));
  assert.ok(html.includes('src="https://www.youtube-nocookie.com/embed/RsxiDWDj2Rg?rel=0&amp;playsinline=1"'));
  assert.ok(html.includes('loading="lazy"'));
  assert.ok(html.includes('title="AI &amp; tools"'));
  assert.equal(renderToStaticMarkup(createElement(YouTubeEmbed, { href: 'https://evil.example/watch?v=RsxiDWDj2Rg', title: 'bad' })), '');
});

const videoCard = {
  title: 'AI & tools', excerpt: 'A practical video demonstration.',
  href: 'https://www.youtube.com/watch?v=RsxiDWDj2Rg', source: 'youtube', date: 'Oct 09, 2026',
  image: { src: 'https://i.ytimg.com/vi/RsxiDWDj2Rg/hqdefault.jpg', alt: 'AI & tools' },
};

test('recent videos render a compact play preview without loading a player before interaction', () => {
  const html = renderToStaticMarkup(createElement(RecentWritingCard, videoCard));
  assert.ok(html.includes('aria-label="Play AI &amp; tools"'));
  assert.ok(html.includes('aria-haspopup="dialog"'));
  assert.ok(html.includes('<img'));
  assert.ok(html.includes('Watch on YouTube'));
  assert.ok(!html.includes('<iframe'));
  assert.ok(!html.includes('recent-writing-card--video'));
});

test('archived videos retain only their text and secure outbound watch link', () => {
  const html = renderToStaticMarkup(createElement(WritingArchiveRow, videoCard));
  assert.ok(html.includes('A practical video demonstration.'));
  assert.ok(html.includes('aria-label="Watch AI &amp; tools"'));
  assert.ok(html.includes('target="_blank" rel="noopener noreferrer"'));
  assert.ok(!/<iframe|<img|<dialog|<button/.test(html));
});

test('featured videos keep their inline embedded player', () => {
  const html = renderToStaticMarkup(createElement(FeaturedWritingCard, videoCard));
  assert.ok(html.includes('<iframe'));
  assert.ok(html.includes('https://www.youtube-nocookie.com/embed/RsxiDWDj2Rg'));
  assert.ok(!html.includes('youtube-preview'));
});

const configuredSettings = JSON.parse(readFileSync('content/youtube.json', 'utf8'));
test('keeps the initial video when it leaves the channel feed, without duplicating it', () => {
  const pinned = { ...settings, initialVideo: configuredSettings.initialVideo };
  const missing = parseYoutubeFeed(entry('NewVideo001', '2026-10-10T10:00:00Z'), pinned, now);
  assert.equal(missing.length, 2);
  assert.equal(missing[1].title, configuredSettings.initialVideo.title);
  assert.equal(missing[1].publishedAt, '2026-10-09T11:31:00.000Z');
  assert.equal(parseYoutubeFeed(entry('RsxiDWDj2Rg', '2026-10-09T11:31:00Z'), pinned, now).length, 1);
  assert.equal(parseYoutubeFeed('', { ...pinned, initialVideo: { ...pinned.initialVideo, publishedAt: 'bad' } }, now).length, 0);
});

test('retains pinned metadata when YouTube is unavailable', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('', { status: 503 });
  try {
    const videos = await fetchYoutubeFeed(configuredSettings.feedUrl, configuredSettings);
    assert.equal(videos.length, 1);
    assert.equal(videos[0].url, 'https://www.youtube.com/watch?v=RsxiDWDj2Rg');
  } finally { globalThis.fetch = original; }
});

test('distinguishes a failed upstream from a valid feed containing only the pinned video', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('', { status: 503 });
    const missing = await fetchYoutubeFeedWithStatus(configuredSettings.feedUrl, configuredSettings);
    assert.equal(missing.items.length, 1);
    assert.equal(missing.upstreamAvailable, false);
    globalThis.fetch = async () => new Response(`<feed><yt:channelId>${configuredSettings.channelId}</yt:channelId></feed>`);
    const available = await fetchYoutubeFeedWithStatus(configuredSettings.feedUrl, configuredSettings);
    assert.equal(available.items.length, 1);
    assert.equal(available.upstreamAvailable, true);
    globalThis.fetch = async () => new Response('<html>Access denied</html>');
    assert.equal((await fetchYoutubeFeedWithStatus(configuredSettings.feedUrl, configuredSettings)).upstreamAvailable, false);
  } finally { globalThis.fetch = original; }
});

test('validates channel/feed URLs, IDs, timestamps and pinned metadata', () => {
  assert.deepEqual(validateYoutubeSettings(configuredSettings), []);
  for (const patch of [
    { publishedAfter: 'not-a-date' },
    { publishedAfter: '2026-02-30T12:00:00Z' },
    { channelId: 'UCinvalid' },
    { feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCother' },
    { feedUrl: `${configuredSettings.feedUrl}&channel_id=${configuredSettings.channelId}` },
    { feedUrl: configuredSettings.feedUrl.replace('https:', 'http:') },
    { channelUrl: 'https://evil.example/@ABV_Creative' },
    { channelUrl: 'https://user:secret@www.youtube.com/@ABV_Creative' },
    { channelUrl: 'https://www.youtube.com/channel/UCother' },
    { initialVideoId: '../invalid' },
    { initialVideo: undefined },
    { initialVideo: { ...configuredSettings.initialVideo, publishedAt: '2026-10-10T12:00:00Z' } },
    { initialVideo: { ...configuredSettings.initialVideo, title: '' } },
  ]) assert.ok(validateYoutubeSettings({ ...configuredSettings, ...patch }).length > 0, JSON.stringify(patch));
  assert.ok(validateYoutubeSettings(null).length > 0);
});
