import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { serializeFrontmatter } from '../scripts/content-lib.mjs';
import * as lib from '../src/content/working-stories-lib.mjs';

const repo = path.resolve(new URL('..', import.meta.url).pathname);
const require = createRequire(import.meta.url);
const body = 'Original *story* text.\n\n## A decision\n\nStill **original**.';
function metadata(patch = {}) {
  return { title: 'A test-only professional story', slug: 'test-only-story', date: '2020-10-10', type: 'working-story', series: 'working-stories', story_id: 'ws-001', cluster: 'project-001', period: '2010s', topics: ['design', 'experiments'], visibility: 'public', book: { status: 'draft' }, ...patch };
}
function fixture(run) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'abvx-working-stories-test-'));
  const dir = path.join(root, 'content', 'working-stories');
  mkdirSync(dir, { recursive: true });
  const write = (name, data, text = body) => writeFileSync(path.join(dir, name), serializeFrontmatter(data, text));
  try { return run({ root, dir, write }); } finally { rmSync(root, { recursive: true, force: true }); }
}
function compile(relative, imports = {}) {
  const compiled = ts.transpileModule(readFileSync(path.join(repo, relative), 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const compiledModule = { exports: {} };
  new Function('require', 'module', 'exports', compiled)((name) => Object.hasOwn(imports, name) ? imports[name] : require(name), compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const normalized = (patch = {}) => ({ ...metadata(), summary: 'Public summary', language: 'en', source: 'ws-001.md', body, book: { include: true, status: 'draft' }, ...patch });
const releaseIndex = (stories) => ({ items: stories.map((story) => lib.publicWorkingStory(story, stories)) });

test('runtime publication remains frozen to the generated index when a future date passes', () => {
  const current = normalized();
  const future = normalized({ date: '2027-01-01', slug: 'future-story', story_id: 'ws-002' });
  const index = releaseIndex(lib.publishedWorkingStories([current, future], Date.parse('2026-10-10')));
  assert.deepEqual(lib.indexedWorkingStories([current, future], index).map(s => s.story_id), ['ws-001']);
  const nextRelease = releaseIndex(lib.publishedWorkingStories([current, future], Date.parse('2027-01-02')));
  assert.deepEqual(lib.indexedWorkingStories([current, future], nextRelease).map(s => s.story_id), ['ws-002', 'ws-001']);
  assert.deepEqual(lib.indexedWorkingStories([{ ...current, visibility: 'private' }], index), []);
});

test('optional story media validates local paths, alt text, dimensions and existing placement headings', () => {
  const image = { src: '/media/stories/test.webp', alt: 'A visual concept', width: 1200, height: 674 };
  const illustration = { ...image, caption: 'Concept illustration.', afterHeading: 'A decision' };
  assert.deepEqual(lib.validateWorkingStory(metadata({ coverImage: image, illustrations: [illustration], caseStudy: { label: 'View case', url: 'https://www.behance.net/gallery/1/case' } }), body), []);
  for (const patch of [{ coverImage: { ...image, src: '/media/../private.png' } }, { coverImage: { ...image, alt: '' } }, { coverImage: { ...image, width: 0 } }, { illustrations: [{ ...illustration, afterHeading: 'Missing heading' }] }, { caseStudy: { label: 'Case', url: 'javascript:alert(1)' } }]) assert.ok(lib.validateWorkingStory(metadata(patch), body).length);
  const story = normalized({ coverImage: image, illustrations: [illustration], caseStudy: { label: 'View case', url: 'https://www.behance.net/gallery/1/case' } });
  const index = lib.publicWorkingStory(story, [story]);
  assert.equal(index.image, 'https://abvx.xyz/media/stories/test.webp');
  assert.equal(index.links[1].url, story.caseStudy.url);
  assert.ok(!lib.workingStoriesExport([story]).manuscript.includes('https://www.behance.net'));
});

test('loads dedicated stories with stable IDs, defaults and preserved Markdown', () => fixture(({ dir, write }) => {
  write('ws-001.md', metadata({ visibility: undefined }));
  const [story] = lib.readWorkingStories(dir);
  assert.equal(story.type, 'working-story');
  assert.equal(story.story_id, 'ws-001');
  assert.equal(story.book.include, true);
  assert.equal(story.visibility, 'draft');
  assert.equal(story.source, 'ws-001.md');
  assert.equal(story.body, body);
}));

test('accepts unknown periods, flexible topics, all book statuses and neutral source sessions', () => {
  for (const status of ['draft', 'selected', 'edited', 'final', 'excluded']) {
    assert.deepEqual(lib.validateWorkingStory(metadata({ period: null, topics: ['a-new-topic'], source_session: 'session-123', book: { include: true, status } }), body), []);
  }
});

test('rejects invalid metadata and confidential-name fields', () => {
  for (const patch of [
    { title: '' }, { slug: '../unsafe' }, { date: '2026-02-30' }, { type: 'writing' }, { series: 'other' },
    { story_id: 'title-based' }, { cluster: 'real-client' }, { period: undefined }, { topics: [42] },
    { book: { include: 'true', status: 'draft' } }, { book: { status: 'unknown' } },
    { client: 'Confidential' }, { person: 'Confidential' }, { book: { status: 'draft', client: 'Confidential' } },
    { visibility: 'unknown' }, { language: 'unknown' }, { updatedAt: '2010-01-01' }, { source_session: 'personal-name' },
  ]) assert.ok(lib.validateWorkingStory(metadata(patch), body).length, JSON.stringify(patch));
  assert.ok(lib.validateWorkingStory(metadata(), '').length);
  assert.ok(lib.validateWorkingStory(null, body).length);
});

test('rejects duplicate IDs and slugs without deriving IDs from filenames', () => fixture(({ dir, write }) => {
  write('different-filename.md', metadata());
  write('second.md', metadata({ slug: 'second' }));
  assert.throws(() => lib.readWorkingStories(dir), /duplicate story_id/);
  write('second.md', metadata({ story_id: 'ws-002' }));
  assert.throws(() => lib.readWorkingStories(dir), /duplicate story slug/);
  write('second.md', metadata({ slug: 'second', story_id: 'ws-002' }));
  assert.equal(lib.readWorkingStories(dir).length, 2);
}));

test('publication is independent of book selection and excludes drafts, private and future stories', () => {
  const stories = [normalized({ book: { include: false, status: 'excluded' } }), normalized({ story_id: 'ws-002', visibility: 'draft' }), normalized({ story_id: 'ws-003', visibility: 'private' }), normalized({ story_id: 'ws-004', date: '2099-01-01' })];
  assert.deepEqual(lib.publishedWorkingStories(stories, Date.parse('2026-10-10')).map((story) => story.story_id), ['ws-001']);
});

test('cluster, topic and source-session queries support several stories from one session', () => {
  const stories = [normalized({ source_session: 'session-001' }), normalized({ story_id: 'ws-002', cluster: 'project-002', source_session: 'session-001' })];
  assert.equal(lib.queryWorkingStories(stories, { sourceSession: 'session-001' }).length, 2);
  assert.equal(lib.queryWorkingStories(stories, { topic: 'design', cluster: 'project-002' })[0].story_id, 'ws-002');
  assert.equal(lib.queryWorkingStories(stories, { topic: 'absent' }).length, 0);
});

test('related stories only link other published stories in the same cluster, newest first', () => {
  const story = normalized();
  const all = [story, normalized({ story_id: 'ws-002', date: '2021-01-01' }), normalized({ story_id: 'ws-003', date: '2022-01-01' }), normalized({ story_id: 'ws-004', visibility: 'private' }), normalized({ story_id: 'ws-005', cluster: 'project-002' })];
  assert.deepEqual(lib.relatedWorkingStories(story, lib.publishedWorkingStories(all)).map((s) => s.story_id), ['ws-003', 'ws-002']);
  assert.deepEqual(lib.relatedWorkingStories(story, [story]), []);
});

test('public discovery exposes topics and related titles without internal book/project/session metadata', () => {
  const story = normalized({ source_session: 'session-001' });
  const indexed = lib.publicWorkingStory(story, [story, normalized({ story_id: 'ws-002', slug: 'second' })]);
  assert.equal(indexed.canonicalUrl, 'https://abvx.xyz/writing/working-stories/test-only-story');
  assert.deepEqual(indexed.tags, ['design', 'experiments']);
  assert.equal(indexed.related[0].canonicalUrl, 'https://abvx.xyz/writing/working-stories/second');
  const serialized = JSON.stringify(indexed);
  for (const internal of ['story_id', 'cluster', 'period', 'book_status', 'source_session', 'project-001', 'ws-001', '"draft"']) assert.ok(!serialized.includes(internal), internal);
});

test('book export selects only eligible typed stories, sorts date then ID, and preserves authored Markdown', () => {
  const stories = [normalized({ story_id: 'ws-003', title: 'Third', visibility: 'private' }), normalized({ story_id: 'ws-002', title: 'Second' }), normalized({ story_id: 'ws-001', title: 'First', date: '2019-01-01', source_session: 'session-001' }), normalized({ type: 'writing', title: 'Ordinary' }), normalized({ title: 'Not included', book: { include: false, status: 'final' } }), normalized({ title: 'Excluded', book: { include: true, status: 'excluded' } })];
  const output = lib.workingStoriesExport(stories);
  assert.deepEqual(output.manifest.map((s) => s.story_id), ['ws-001', 'ws-002', 'ws-003']);
  assert.equal(output.manifest[0].source_session, 'session-001');
  assert.equal(output.manifest[2].book_status, 'draft');
  assert.ok(output.manuscript.includes('## First\n\n' + body));
  for (const absent of ['Ordinary', 'Not included', 'Excluded', 'book_status', 'More Working Stories', 'canonicalUrl', 'Public summary']) assert.ok(!output.manuscript.includes(absent), absent);
  assert.deepEqual(lib.workingStoriesExport([...stories].reverse()), output);
});

test('CLI exports valid deterministic files without changing source content or including ordinary posts', () => fixture(({ root, dir, write }) => {
  write('ws-001.md', metadata());
  write('ws-002.md', metadata({ story_id: 'ws-002', slug: 'not-in-book', book: { include: false, status: 'final' } }));
  mkdirSync(path.join(root, 'content/writing'));
  writeFileSync(path.join(root, 'content/writing/ordinary.md'), serializeFrontmatter({ type: 'writing', title: 'Ordinary' }, 'Ordinary body'));
  const original = readFileSync(path.join(dir, 'ws-001.md'));
  const run = () => execFileSync(process.execPath, [path.join(repo, 'scripts/export-working-stories.mjs')], { cwd: root });
  run();
  const manuscript = readFileSync(path.join(root, 'exports/working-stories-manuscript.md'), 'utf8');
  const manifest = readFileSync(path.join(root, 'exports/working-stories-manifest.json'), 'utf8');
  assert.equal(JSON.parse(manifest).length, 1);
  assert.ok(!manuscript.includes('Ordinary body'));
  run();
  assert.equal(readFileSync(path.join(root, 'exports/working-stories-manuscript.md'), 'utf8'), manuscript);
  assert.equal(readFileSync(path.join(root, 'exports/working-stories-manifest.json'), 'utf8'), manifest);
  assert.deepEqual(readFileSync(path.join(dir, 'ws-001.md')), original);
}));

test('empty collection exports a manuscript header and an empty manifest', () => fixture(({ root, dir }) => {
  assert.deepEqual(lib.readWorkingStories(dir), []);
  execFileSync(process.execPath, [path.join(repo, 'scripts/export-working-stories.mjs')], { cwd: root });
  assert.deepEqual(JSON.parse(readFileSync(path.join(root, 'exports/working-stories-manifest.json'), 'utf8')), []);
  assert.equal(readFileSync(path.join(root, 'exports/working-stories-manuscript.md'), 'utf8'), '# Working Stories\n\n');
}));

test('real public-index generator includes only published stories and the empty-capable series', () => fixture(({ root, write }) => {
  for (const relative of ['content/collaborations.json', 'content/youtube.json', 'content/working-stories.json', 'content/editorial/index.json']) {
    mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    cpSync(path.join(repo, relative), path.join(root, relative));
  }
  mkdirSync(path.join(root, 'public'));
  write('ws-001.md', metadata());
  write('private.md', metadata({ story_id: 'ws-002', slug: 'private-story', visibility: 'private' }));
  write('future.md', metadata({ story_id: 'ws-003', slug: 'future-story', date: '2099-01-01' }));
  execFileSync(process.execPath, [path.join(repo, 'scripts/generate-llm-index.mjs')], { cwd: root });
  const index = JSON.parse(readFileSync(path.join(root, 'public/content-index.json'), 'utf8'));
  const llms = readFileSync(path.join(root, 'public/llms.txt'), 'utf8');
  const entries = index.items.filter((item) => item.group === 'Working Stories');
  assert.equal(entries.length, 2);
  assert.ok(llms.includes('https://abvx.xyz/writing/working-stories/test-only-story'));
  assert.ok(!llms.includes('private-story'));
  assert.ok(!llms.includes('future-story'));
  assert.ok(!JSON.stringify(entries).includes('project-001'));
  assert.ok(!JSON.stringify(entries).includes('"book"'));
}));

test('story template reuses article typography, emits SEO and hides internal metadata and empty relationships', async () => {
  const component = compile('src/components/WorkingStoryArticle.tsx', {
    '@/content/working-stories': lib, '@/lib/seo': { SITE_URL: 'https://abvx.xyz' },
    './JsonLd': compile('src/components/JsonLd.tsx', { 'next/headers': { headers: async () => new Headers() } }),
    './MarkdownContent': compile('src/components/MarkdownContent.tsx'),
    './MediaPanel': compile('src/components/MediaPanel.tsx'),
    './PageHeader': compile('src/components/PageHeader.tsx'),
  }).default;
  const story = normalized();
  const render = async (related, currentStory = story) => new Response(await renderToReadableStream(createElement(component, { story: currentStory, related }))).text();
  const html = await render([]);
  assert.ok(html.includes('native-writing-article__body'));
  assert.ok(html.includes('<em>story</em>'));
  assert.ok(html.includes('datePublished'));
  assert.ok(html.includes('https://abvx.xyz/writing/working-stories#collection'));
  assert.ok(html.includes('design'));
  for (const absent of ['More Working Stories from this project', 'project-001', 'book_status', 'ws-001']) assert.ok(!html.includes(absent), absent);
  const related = await render([normalized({ slug: 'second', story_id: 'ws-002', title: 'Second public title' })]);
  assert.ok(related.includes('More Working Stories from this project'));
  assert.ok(related.includes('href="/writing/working-stories/second"'));
  assert.ok(related.includes('Second public title'));
  const image = { src: '/media/stories/test.webp', alt: 'Concept artwork', width: 1200, height: 674 };
  const illustrated = await render([], normalized({ coverImage: image, illustrations: [{ ...image, caption: 'A concept, not a production photograph.', afterHeading: 'A decision' }], caseStudy: { label: 'See visual case', url: 'https://www.behance.net/gallery/1/case' } }));
  assert.equal((illustrated.match(/<img /g) || []).length, 2);
  assert.ok(illustrated.includes('alt="Concept artwork"'));
  assert.ok(illustrated.includes('A concept, not a production photograph.'));
  assert.ok(illustrated.indexOf('Still <strong>original</strong>') < illustrated.indexOf('working-story-illustration'));
  assert.ok(illustrated.includes('target="_blank" rel="noopener noreferrer"'));
});

test('server adapter retrieves the dedicated collection and contributes normal ABVX feed items', () => fixture(({ root, write }) => {
  write('ws-001.md', metadata({ source_session: 'session-001' }));
  const adapter = compile('src/content/working-stories.ts', { './working-stories-lib.mjs': lib, '../../public/content-index.json': releaseIndex([normalized()]) });
  const cwd = process.cwd();
  try {
    process.chdir(root);
    assert.equal(adapter.getWorkingStories({ topic: 'design' }).length, 1);
    assert.equal(adapter.getWorkingStories({ cluster: 'project-999' }).length, 0);
    assert.equal(adapter.getWorkingStoryBySlug('test-only-story').story_id, 'ws-001');
    assert.equal(adapter.getWorkingStoryBySlug('unknown'), undefined);
    assert.equal(adapter.workingStoriesFeed()[0].url, '/writing/working-stories/test-only-story');
    assert.equal(adapter.workingStoriesFeed()[0].source, 'abvx');
    assert.ok(!JSON.stringify(adapter.workingStoriesFeed()).includes('book'));
  } finally { process.chdir(cwd); }
}));

test('story route renders dynamically, supplies canonical metadata and 404s unknown stories even with no static params', async () => {
  const story = normalized();
  const route = compile('src/app/writing/working-stories/[slug]/page.tsx', {
    '@/content/working-stories': { getWorkingStories: () => [story], getWorkingStoryBySlug: (slug) => slug === story.slug ? story : undefined, getRelatedWorkingStories: () => [], workingStoryPath: lib.workingStoryPath },
    '@/components/WorkingStoryArticle': { default: () => null, __esModule: true },
    '@/lib/seo': { defaultOgImage: { src: '/og.png' }, imageMetadata: (image, fallback) => image || fallback, metadataWithImage: (options) => options },
    'next/navigation': { notFound: () => { throw new Error('404'); } },
  });
  assert.equal(route.dynamic, 'force-dynamic');
  assert.equal(route.generateStaticParams, undefined);
  const metadata = await route.generateMetadata({ params: Promise.resolve({ slug: story.slug }) });
  assert.equal(metadata.canonicalPath, '/writing/working-stories/test-only-story');
  assert.equal(metadata.type, 'article');
  assert.ok(metadata.image);
  await assert.rejects(route.generateMetadata({ params: Promise.resolve({ slug: 'unknown' }) }), /404/);
  await assert.rejects(route.default({ params: Promise.resolve({ slug: 'unknown' }) }), /404/);
});

test('sitemap discovers published stories and series while excluding private and future sources', () => fixture(({ root, write }) => {
  write('ws-001.md', metadata({ updatedAt: '2021-01-01' }));
  write('private.md', metadata({ story_id: 'ws-002', slug: 'private', visibility: 'private' }));
  write('future.md', metadata({ story_id: 'ws-003', slug: 'future', date: '2099-01-01' }));
  const adapter = compile('src/content/working-stories.ts', { './working-stories-lib.mjs': lib, '../../public/content-index.json': releaseIndex([normalized()]) });
  const series = JSON.parse(readFileSync(path.join(repo, 'content/working-stories.json')));
  const sitemap = compile('src/app/sitemap.ts', {
    '../../content/pages.json': JSON.parse(readFileSync(path.join(repo, 'content/pages.json'))),
    '../../content/working-stories.json': series,
    '@/content': { getArtifacts: () => [], getBooks: () => [], getNativeWritingItems: () => [] },
    '@/content/service-pages': { servicePages: [] }, '@/content/editorials': { getEditorialArticles: () => [] },
    '@/content/working-stories': adapter,
  }).default;
  const cwd = process.cwd();
  try {
    process.chdir(root);
    const routes = sitemap();
    const entries = routes.filter((item) => item.url.includes('/writing/working-stories'));
    assert.equal(entries.length, 2);
    assert.equal(entries.find((item) => item.url.endsWith('/test-only-story')).lastModified.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.ok(!routes.some((item) => /\/(private|future)$/.test(item.url)));
    for (const url of ['https://abvx.xyz', 'https://abvx.xyz/ami', 'https://abvx.xyz/fr/ami', 'https://abvx.xyz/llmo']) {
      assert.ok(routes.find(item => item.url === url).lastModified >= new Date(series.updatedAt), url + ' must include the series update date');
    }
  } finally { process.chdir(cwd); }
}));
