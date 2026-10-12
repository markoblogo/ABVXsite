import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, cpSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { serializeFrontmatter } from '../scripts/content-lib.mjs';
import { serializeJsonLd } from '../src/lib/json-ld.mjs';
import { automaticVideoItems, videoPageJsonLd, findVideoCompanion, publishedWritingItems, videoCompanionSnapshot, videoRedirectSnapshot } from '../src/lib/youtube-pages.mjs';
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


test('inactive native cards do not suppress automatic pages in Writing or homepage feeds', () => {
  const now = Date.parse('2026-10-11T12:00:00Z');
  const native = { ...video, url: '/writing/inactive-companion', videoUrl: video.url, slug: 'inactive-companion', visibility: 'public' };
  for (const status of ['archive', 'building', 'draft']) {
    const inactive = { ...native, status };
    assert.deepEqual(videoCompanionSnapshot([inactive], now), {});
    assert.deepEqual(mergeWritingItems([inactive], { items: [video] }, now).map(item => item.url), ['/writing/videos/NewVideo001']);
    assert.equal(findVideoCompanion([inactive], 'NewVideo001', now), undefined);
  }
});

test('a scheduled companion activates only with regenerated discovery, not the runtime clock', () => {
  const before = Date.parse('2026-10-11T12:00:00Z');
  const after = Date.parse('2026-10-12T12:00:00Z');
  const companion = { ...video, url: '/writing/scheduled', videoUrl: video.url, slug: 'scheduled', publishedAt: '2026-10-12T10:00:00Z', visibility: 'public', status: 'live' };
  const registry = { items: [video] };
  const snapshot = videoCompanionSnapshot([companion], before);
  assert.deepEqual(snapshot, {});
  for (const time of [before, after]) {
    const available = publishedWritingItems([companion], time, snapshot);
    assert.deepEqual(available, []);
    assert.equal(findVideoCompanion(available, 'NewVideo001', time), undefined);
    assert.deepEqual(automaticVideoItems(registry, available, time).map(item => item.url), ['/writing/videos/NewVideo001']);
    assert.deepEqual(mergeWritingItems(available, registry, time).map(item => item.url), ['/writing/videos/NewVideo001']);
  }
  const refreshed = videoCompanionSnapshot([companion], after);
  assert.deepEqual(refreshed, { NewVideo001: ['scheduled'] });
  const released = publishedWritingItems([companion], after, refreshed);
  assert.equal(findVideoCompanion(released, 'NewVideo001', after), companion);
  assert.deepEqual(automaticVideoItems(registry, released, after), []);
  assert.deepEqual(mergeWritingItems(released, registry, after).map(item => item.url), ['/writing/scheduled']);
});

test('a stale or mismatched snapshot cannot revive an inactive companion', () => {
  const now = Date.parse('2026-10-12T12:00:00Z');
  const companion = { videoUrl: video.url, slug: 'released', publishedAt: video.publishedAt, status: 'live', visibility: 'public' };
  for (const item of [{ ...companion, status: 'archive' }, { ...companion, visibility: 'private' }, { ...companion, slug: 'unreleased' }]) {
    assert.deepEqual(publishedWritingItems([item], now, { NewVideo001: 'released' }), []);
  }
});


test('all released translations of one video remain discoverable', () => {
  const now = Date.parse('2026-10-12T12:00:00Z');
  const companion = { ...video, videoUrl: video.url, status: 'live', slug: 'notes', url: '/writing/notes' };
  const translation = { ...companion, slug: 'notes-fr', url: '/writing/notes-fr', language: 'fr' };
  const snapshot = videoCompanionSnapshot([translation, companion], now);
  assert.deepEqual(snapshot, { NewVideo001: ['notes', 'notes-fr'] });
  const available = publishedWritingItems([companion, translation], now, snapshot);
  assert.deepEqual(available, [companion, translation]);
  assert.deepEqual(automaticVideoItems({ items: [video] }, available, now), []);
  assert.deepEqual(new Set(mergeWritingItems(available, { items: [video] }, now).map(item => item.url)), new Set(['/writing/notes', '/writing/notes-fr']));
});

test('index generator honors default public visibility and records every released companion', () => {
  const repo = path.resolve(new URL('..', import.meta.url).pathname);
  const root = mkdtempSync(path.join(os.tmpdir(), 'abvx-video-index-'));
  try {
    cpSync(path.join(repo, 'content'), path.join(root, 'content'), { recursive: true });
    mkdirSync(path.join(root, 'public'));
    const data = { type: 'note', status: 'live', publishedAt: '2020-01-01T00:00:00Z', title: 'Fixture video companion', summary: 'Fixture summary', videoUrl: video.url, videoUploadedAt: '2020-01-01T00:00:00Z' };
    for (const [slug, patch] of [['fixture-video', {}], ['fixture-video-fr', { language: 'fr' }], ['fixture-future', { publishedAt: '2099-01-01T00:00:00Z' }], ['fixture-inactive', { status: 'archive' }], ['fixture-default-status', { status: undefined }]]) {
      writeFileSync(path.join(root, 'content/writing', slug + '.md'), serializeFrontmatter({ ...data, slug, ...patch }, 'Owner fixture text.'));
    }
    const sync = () => execFileSync(process.execPath, [path.join(repo, 'scripts/sync-writing-feed.mjs')], { cwd: root, stdio: 'pipe' });
    sync();
    const registered = JSON.parse(readFileSync(path.join(root, 'content/writing-discovery.json')));
    const firstAdded = registered.items.find(item => item.url === '/writing/fixture-video')?.addedAt;
    assert.ok(firstAdded, 'default-public companion must register its immutable addedAt');
    sync();
    assert.equal(JSON.parse(readFileSync(path.join(root, 'content/writing-discovery.json'))).items.find(item => item.url === '/writing/fixture-video').addedAt, firstAdded);
    for (const slug of ['fixture-future', 'fixture-inactive', 'fixture-default-status']) assert.ok(!registered.items.some(item => item.url === '/writing/' + slug));
    execFileSync(process.execPath, [path.join(repo, 'scripts/generate-llm-index.mjs')], { cwd: root, stdio: 'pipe' });
    const index = JSON.parse(readFileSync(path.join(root, 'public/content-index.json')));
    assert.deepEqual(index.videoCompanions.NewVideo001, ['fixture-video', 'fixture-video-fr']);
    assert.equal(index.videoRedirects.NewVideo001, 'fixture-video');
    const urls = new Set(index.items.map(item => item.canonicalUrl));
    for (const slug of ['fixture-video', 'fixture-video-fr']) assert.ok(urls.has('https://abvx.xyz/writing/' + slug));
    for (const slug of ['fixture-future', 'fixture-inactive', 'fixture-default-status']) assert.ok(!urls.has('https://abvx.xyz/writing/' + slug));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('video permanent redirects keep the first-added companion when translations reorder or backdate', () => {
  const now = Date.parse('2026-10-12T12:00:00Z');
  const original = { videoUrl: video.url, slug: 'original', status: 'live', publishedAt: '2026-10-10T10:00:00Z' };
  const translated = { ...original, slug: 'translated', language: 'fr', publishedAt: '2020-01-01T00:00:00Z' };
  const registry = { items: [
    { url: '/writing/original', addedAt: '2026-10-10T12:00:00.000Z' },
    { url: '/writing/translated', addedAt: '2026-10-12T11:00:00.000Z' },
  ] };
  for (const native of [[translated, original], [original, translated]]) {
    const redirects = videoRedirectSnapshot(native, registry, now);
    assert.deepEqual(redirects, { NewVideo001: 'original' });
    assert.equal(findVideoCompanion(native, 'NewVideo001', now, redirects), original);
    assert.equal(publishedWritingItems(native, now, videoCompanionSnapshot(native, now)).length, 2);
  }
  assert.equal(findVideoCompanion([translated], 'NewVideo001', now, { NewVideo001: 'original' }), undefined);
});
