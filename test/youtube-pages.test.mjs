import assert from 'node:assert/strict';
import test from 'node:test';
import { serializeJsonLd } from '../src/lib/json-ld.mjs';
import { automaticVideoItems, videoPageJsonLd, findVideoCompanion } from '../src/lib/youtube-pages.mjs';
import { mergeWritingItems, registerWritingItems } from '../src/lib/writing-chronology.mjs';
const video = { source: 'youtube', title: 'My video', url: 'https://www.youtube.com/watch?v=NewVideo001', publishedAt: '2026-10-10T10:00:00.000Z', addedAt: '2026-10-10T11:00:00.000Z', addedAtBasis: 'observed', excerpt: 'Short', videoDescription: 'Full description\nSecond paragraph' };
test('feed video opens its stable watch page, preserves description and first-added time', () => {
  const registry = { version: 1, items: [video] };
  const pages = automaticVideoItems(registry);
  assert.equal(pages[0].url, '/writing/videos/NewVideo001');
  assert.equal(pages[0].videoUrl, video.url);
  assert.equal(pages[0].addedAt, video.addedAt);
  assert.deepEqual(mergeWritingItems([], registry), pages);
  const registered = registerWritingItems(registry, [{ ...video, videoDescription: undefined }]);
  assert.equal(registered.items[0].videoDescription, video.videoDescription);
  const jsonLd = videoPageJsonLd(pages[0]);
  assert.equal(jsonLd.description, video.videoDescription);
  assert.equal(jsonLd.uploadDate, video.publishedAt);
  assert.equal(jsonLd.mainEntityOfPage, 'https://abvx.xyz/writing/videos/NewVideo001');
});
test('authored companion wins without duplicate or future/unsafe watch pages', () => {
  const native = { ...video, url: '/writing/my-video-notes', videoUrl: video.url };
  assert.deepEqual(automaticVideoItems({ items: [video] }, [native]), []);
  assert.deepEqual(mergeWritingItems([native], { items: [video] }).map(item => item.url), [native.url]);
  assert.deepEqual(automaticVideoItems({ items: [{ ...video, publishedAt: '2099-01-01' }, { ...video, url: 'https://evil.example/watch?v=NewVideo001' }] }), []);
});

// All consumers must agree before a scheduled companion replaces a watch page.
test('future, private and inactive companions leave the automatic watch page available', () => {
  const now = Date.parse('2026-10-11T12:00:00.000Z');
  const companion = { videoUrl: video.url, publishedAt: '2026-10-12T10:00:00.000Z', visibility: 'public', status: 'live', slug: 'scheduled' };
  for (const item of [companion, { ...companion, publishedAt: video.publishedAt, visibility: 'private' }, { ...companion, publishedAt: video.publishedAt, status: 'draft' }, { ...companion, publishedAt: 'invalid' }]) {
    assert.equal(automaticVideoItems({ items: [video] }, [item], now).length, 1);
    assert.equal(findVideoCompanion([item], 'NewVideo001', now), undefined);
  }
  const ready = { ...companion, publishedAt: new Date(now).toISOString() };
  assert.equal(findVideoCompanion([ready], 'NewVideo001', now), ready);
  assert.deepEqual(automaticVideoItems({ items: [video] }, [ready], now), []);
});

test('feed descriptions cannot end a JSON-LD script or insert HTML', () => {
  const description = 'Code example: </script><img src=x onerror=alert(1)> and <SCRIPT>text</SCRIPT>';
  const data = videoPageJsonLd(automaticVideoItems({ items: [{ ...video, videoDescription: description }] })[0]);
  const serialized = serializeJsonLd(data);
  assert.ok(!serialized.includes('<'));
  assert.equal(JSON.parse(serialized).description, description);
  assert.equal(serializeJsonLd(undefined), undefined);
});
