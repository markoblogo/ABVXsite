import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const compiledModule = { exports: {} };
  modules.set(file, compiledModule);
  const output = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const localRequire = (name) => name.startsWith('.') ? load(path.resolve(path.dirname(file), `${name}.ts`)) : require(name);
  new Function('require', 'module', 'exports', output)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const { parseYoutubeFeed, fetchYoutubeFeed } = load(path.resolve('src/lib/youtube-feed.ts'));
const YouTubeEmbed = load(path.resolve('src/components/YouTubeEmbed.tsx')).default;
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
