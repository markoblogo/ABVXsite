import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { planWorkingStory, applyWorkingStory } from '../scripts/publish-working-story.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const writingCommand = new URL('../scripts/publish-writing.mjs', import.meta.url).pathname;
const metadata = { title: 'A test story', slug: 'test-story', date: '2020-01-01', type: 'working-story',
  series: 'working-stories', story_id: 'ws-002', cluster: 'project-001', period: null,
  topics: [], book: { include: false, status: 'excluded' }, visibility: 'public', summary: 'Test.', language: 'en' };
const body = 'Exact **author prose**.\n\n## A choice\n\nAnother paragraph.';
function packet(data = metadata) {
  const source = `---\n${JSON.stringify(data, null, 2)}\n---\n\n${body}\n`;
  return { schema_version: 'v1', mode: 'REPORT_ONLY_HANDOFF', project: 'abvxsite', surface: 'working-stories',
    kind: 'working-story', title: data.title, slug: data.slug,
    consumer_operation: { id: 'abvx.publish-working-story', target_surface: 'abvx.working-story' },
    payload: { source_markdown: source, source_sha256: hash(source), body_lines: [body],
      language: 'en', date_published: data.date, media_assets: [] } };
}
function fixture(run) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'abvx-publication-test-'));
  try { run(root); } finally { rmSync(root, { recursive: true, force: true }); }
}
function withMedia(root) {
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7xkAAAAASUVORK5CYII=', 'base64');
  const source = path.join(root, 'approved.png');
  writeFileSync(source, bytes);
  const value = packet({ ...metadata, coverImage: { src: '/media/stories/cover.png', alt: 'Approved example', width: 1, height: 1 } });
  value.payload.media_assets = [{ source, target: '/media/stories/cover.png', sha256: hash(bytes) }];
  return value;
}

function nativePacket(data) {
  const source = `---\n${JSON.stringify(data, null, 2)}\n---\n\n${body}\n`;
  return { schema_version: 'v1', mode: 'REPORT_ONLY_HANDOFF', project: 'abvxsite', surface: 'writing',
    slug: data.slug, title: data.title, kind: data.type,
    consumer_operation: { id: 'abvx.publish-writing' },
    payload: { source_markdown: source, source_sha256: hash(source), body_lines: [body], language: 'en', date_published: data.publishedAt, media_assets: [] },
    enrichment: { meta_description: data.summary, tags: [] } };
}

test('signed native packets preserve exact metadata/media and require approved reused images', () => fixture(root => {
  const asset = withMedia(root).payload.media_assets[0];
  const value = nativePacket({ id: 'a-native-note', slug: 'a-native-note', title: 'A note', seoTitle: 'A search title',
    primarySection: 'writing', type: 'article', summary: 'Test.', status: 'live', visibility: 'public', publishedAt: '2020-01-01', language: 'en',
    media: { src: asset.target, alt: 'Approved image', width: 1, height: 1 } });
  const file = path.join(root, 'packet.json');
  const run = (packetValue, mode = '--dry-run') => {
    writeFileSync(file, JSON.stringify(packetValue));
    return execFileSync(process.execPath, [writingCommand, '--packet', file, mode], { cwd: root, stdio: 'pipe' });
  };
  mkdirSync(path.join(root, 'public/media/stories'), { recursive: true });
  writeFileSync(path.join(root, `public${asset.target}`), readFileSync(asset.source));
  assert.throws(() => run(value), /Missing approved media/);
  value.payload.media_assets = [asset];
  const bad = structuredClone(value);
  bad.payload.source_markdown += 'tampered';
  assert.throws(() => run(bad), /source hash/);
  const result = JSON.parse(run(value));
  assert.equal(result.media[0].reused, true);
  assert.equal(existsSync(path.join(root, 'content')), false);
  run(value, '--write');
  assert.equal(readFileSync(path.join(root, 'content/writing/a-native-note.md'), 'utf8'), value.payload.source_markdown);
}));

test('signed video packets require a valid YouTube URL, upload date and matching thumbnail', () => fixture(root => {
  const data = { id: 'a-video', slug: 'a-video', title: 'A video', primarySection: 'writing', type: 'article', summary: 'Video notes.',
    status: 'live', visibility: 'public', publishedAt: '2020-01-01', language: 'en',
    videoUrl: 'https://www.youtube.com/watch?v=6q2JG0gCyDg', videoUploadedAt: '2020-01-01T10:00:00Z',
    media: { src: 'https://i.ytimg.com/vi/6q2JG0gCyDg/hqdefault.jpg', alt: 'Video', width: 480, height: 360 } };
  const file = path.join(root, 'packet.json');
  const run = (sourceData) => {
    writeFileSync(file, JSON.stringify(nativePacket(sourceData)));
    return execFileSync(process.execPath, [writingCommand, '--packet', file, '--dry-run'], { cwd: root, stdio: 'pipe' });
  };
  assert.throws(() => run({ ...data, videoUrl: 'https://example.com/video' }), /Invalid YouTube/);
  assert.throws(() => run({ ...data, videoUploadedAt: '2099-01-01T00:00:00Z' }), /Invalid YouTube/);
  assert.throws(() => run({ ...data, media: { ...data.media, src: 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg' } }), /matching YouTube thumbnail/);
  assert.equal(JSON.parse(run(data)).mode, 'DRY_RUN');
}));

test('dry-run makes no changes; apply preserves exact source and approved media bytes', () => fixture(root => {
  const value = withMedia(root);
  const plan = planWorkingStory(value, root);
  assert.equal(existsSync(path.join(root, 'content')), false);
  assert.equal(existsSync(path.join(root, 'public')), false);
  applyWorkingStory(plan);
  assert.equal(readFileSync(plan.targetFile, 'utf8'), value.payload.source_markdown);
  assert.deepEqual(readFileSync(plan.media[0].target), readFileSync(value.payload.media_assets[0].source));
  assert.throws(() => planWorkingStory(value, root), /already exists/);
}));

test('consumer CLI executes through a symlinked checkout/path and reports dry-run output', () => fixture(root => {
  const file = path.join(root, 'packet.json');
  writeFileSync(file, JSON.stringify(packet()));
  const link = path.join(root, 'publisher.mjs');
  symlinkSync(new URL('../scripts/publish-working-story.mjs', import.meta.url).pathname, link);
  const output = execFileSync(process.execPath, [link, '--packet', file, '--dry-run'], { cwd: root, stdio: 'pipe' });
  assert.equal(JSON.parse(output).mode, 'DRY_RUN');
  assert.equal(existsSync(path.join(root, 'content')), false);
}));

test('source changes, conflicting metadata, wrong surface and future/draft publication fail before writes', () => fixture(root => {
  const value = packet();
  value.payload.source_markdown += 'Tampered prose';
  assert.throws(() => planWorkingStory(value, root), /hash mismatch/);
  assert.throws(() => planWorkingStory({ ...packet(), title: 'Another title' }, root), /conflicts/);
  assert.throws(() => planWorkingStory({ ...packet(), surface: 'writing' }, root), /contract/);
  assert.throws(() => planWorkingStory(packet({ ...metadata, visibility: 'draft' }), root), /ready public/);
  assert.throws(() => planWorkingStory(packet({ ...metadata, date: '2099-01-01' }), root), /ready public/);
  assert.equal(existsSync(path.join(root, 'content')), false);
}));

test('duplicate ID with a different slug cannot enter the collection', () => fixture(root => {
  applyWorkingStory(planWorkingStory(packet(), root));
  assert.throws(() => planWorkingStory(packet({ ...metadata, slug: 'different-slug' }), root), /already exists/);
}));

test('missing, unapproved or conflicting assets fail without writing the story', () => fixture(root => {
  const value = withMedia(root);
  const bad = structuredClone(value);
  bad.payload.media_assets[0].sha256 = '0'.repeat(64);
  assert.throws(() => planWorkingStory(bad, root), /media hash/);
  bad.payload.media_assets = [];
  assert.throws(() => planWorkingStory(bad, root), /Missing approved media/);
  bad.payload.media_assets = [{ ...value.payload.media_assets[0], target: '/media/../outside.png' }];
  assert.throws(() => planWorkingStory(bad, root), /Unreferenced/);
  mkdirSync(path.join(root, 'public/media/stories'), { recursive: true });
  writeFileSync(path.join(root, 'public/media/stories/cover.png'), 'existing bytes');
  assert.throws(() => planWorkingStory(value, root), /different bytes/);
  assert.equal(existsSync(path.join(root, 'content')), false);
}));

test('symlink destinations cannot redirect publication outside the consumer checkout', () => fixture(root => {
  mkdirSync(path.join(root, 'outside'));
  symlinkSync(path.join(root, 'outside'), path.join(root, 'content'));
  assert.throws(() => planWorkingStory(packet(), root), /Symlink/);
}));

test('existing cover and illustration files still require individual approved descriptors', () => fixture(root => {
  const value = withMedia(root);
  const illustration = '/media/stories/illustration.png';
  const data = { ...metadata,
    coverImage: { src: '/media/stories/cover.png', alt: 'Cover', width: 1, height: 1 },
    illustrations: [{ src: illustration, alt: 'Example', caption: 'An approved example', width: 1, height: 1, afterHeading: 'A choice' }] };
  const story = packet(data);
  story.payload.media_assets = value.payload.media_assets;
  mkdirSync(path.join(root, 'public/media/stories'), { recursive: true });
  for (const src of [data.coverImage.src, illustration]) {
    writeFileSync(path.join(root, `public${src}`), readFileSync(value.payload.media_assets[0].source));
  }
  assert.throws(() => planWorkingStory(story, root), /Missing approved media/);
  story.payload.media_assets = [];
  assert.throws(() => planWorkingStory(story, root), /Missing approved media/);
  assert.equal(existsSync(path.join(root, 'content')), false);
}));

test('approved existing images are verified and reused; tampered or invalid bytes are refused', () => fixture(root => {
  const value = withMedia(root);
  const asset = value.payload.media_assets[0];
  const target = path.join(root, `public${asset.target}`);
  mkdirSync(path.dirname(target), { recursive: true });
  const approved = readFileSync(asset.source);
  writeFileSync(target, approved);
  asset.source = target;
  const plan = planWorkingStory(value, root);
  assert.equal(plan.media[0].reused, true);
  const bad = structuredClone(value);
  bad.payload.media_assets[0].sha256 = '0'.repeat(64);
  assert.throws(() => planWorkingStory(bad, root), /media hash/);
  writeFileSync(target, 'not an image');
  assert.throws(() => planWorkingStory(value, root), /media hash/);
  asset.sha256 = hash(readFileSync(target));
  assert.throws(() => planWorkingStory(value, root), /declared image type/);
  assert.equal(existsSync(path.join(root, 'content')), false);
  writeFileSync(target, approved);
  // Reused files are never overwritten during application.
  applyWorkingStory(plan);
  assert.deepEqual(readFileSync(target), approved);
  assert.equal(readFileSync(plan.targetFile, 'utf8'), value.payload.source_markdown);
}));

test('failed exclusive write rolls back newly copied assets and preserves existing content', () => fixture(root => {
  const plan = planWorkingStory(withMedia(root), root);
  mkdirSync(path.dirname(plan.targetFile), { recursive: true });
  writeFileSync(plan.targetFile, 'Existing content');
  assert.throws(() => applyWorkingStory(plan), /EEXIST/);
  assert.equal(readFileSync(plan.targetFile, 'utf8'), 'Existing content');
  assert.equal(existsSync(plan.media[0].target), false);
}));

test('native Writing packets preserve author body and language; unsafe or unsupported packets fail closed', () => fixture(root => {
  const value = { project: 'abvxsite', surface: 'writing', slug: 'a-native-note', title: 'A note', kind: 'note',
    consumer_operation: { id: 'abvx.publish-writing' },
    payload: { body_lines: [body], language: 'uk' },
    enrichment: { seo_title: 'A note for Search', meta_description: 'A test note.', tags: [], date_published: '2020-01-01', date_modified: '2020-01-01' } };
  const file = path.join(root, 'packet.json');
  const run = (packetValue, mode) => {
    writeFileSync(file, JSON.stringify(packetValue));
    return execFileSync(process.execPath, [writingCommand, '--packet', file, mode], { cwd: root, stdio: 'pipe' });
  };
  assert.throws(() => run({ ...value, slug: '../unsafe' }, '--dry-run'));
  assert.throws(() => run({ ...value, payload: { ...value.payload, video_url: 'https://example.com' } }, '--dry-run'));
  run(value, '--dry-run');
  assert.equal(existsSync(path.join(root, 'content')), false);
  run(value, '--write');
  const output = readFileSync(path.join(root, 'content/writing/a-native-note.md'), 'utf8');
  assert.ok(output.includes('"language": "uk"'));
  assert.ok(output.includes('"seoTitle": "A note for Search"'));
  assert.ok(output.endsWith(`${body}\n`));
  assert.throws(() => run(value, '--dry-run'));
}));
