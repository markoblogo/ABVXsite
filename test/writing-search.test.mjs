import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchWritingPosts, normalizeWritingQuery, writingSearchExcerpt, writingSearchHref } from '../src/lib/writing-search.mjs';

test('Writing search finds words deep in a native article rather than only its title or summary', () => {
  const posts = [
    { title: 'A quiet afternoon', excerpt: 'A personal note.', source: 'abvx', url: '/writing/afternoon' },
    { title: 'Another post', source: 'medium', url: 'https://medium.com/another' },
  ];
  const bodies = new Map([['/writing/afternoon', 'Opening. '.repeat(500) + 'The tulips were hard-boiled eggs.']]);
  assert.deepEqual(searchWritingPosts(posts, 'TULIPS eggs', { bodies }).map(post => post.url), ['/writing/afternoon']);
  assert.equal(searchWritingPosts(posts, 'tulips missing', { bodies }).length, 0);
});

test('source filters combine with keywords and external headings/descriptions remain searchable', () => {
  const posts = [
    { title: 'Creative breakfast', source: 'medium', url: 'https://medium.com/a', excerpt: 'Egg tulips for March 8.' },
    { title: 'Egg tulips at home', source: 'abvx', url: '/writing/b' },
    { title: 'A new film', source: 'youtube', url: '/writing/videos/aaaaaaaaaaa', videoDescription: 'Building a creative breakfast.' },
  ];
  assert.deepEqual(searchWritingPosts(posts, 'egg', { source: 'medium' }).map(post => post.url), ['https://medium.com/a']);
  assert.equal(searchWritingPosts(posts, 'creative breakfast').length, 2);
  assert.equal(searchWritingPosts(posts, 'missing', { source: 'substack' }).length, 0);
});

test('search covers the full retained feed and never introduces a page outside Writing', () => {
  const posts = Array.from({ length: 90 }, (_, i) => ({ title: `Post ${i}`, source: 'abvx', url: `/writing/post-${i}` }));
  const bodies = new Map([
    ['/writing/post-89', 'The archive contains a rare saffron story.'],
    ['/books/private', 'A rare saffron book'],
    ['/writing/unpublished', 'An unpublished rare saffron draft'],
  ]);
  assert.deepEqual(searchWritingPosts(posts, 'saffron', { bodies }).map(post => post.url), ['/writing/post-89']);
});

test('Working Stories bodies are searched using their exact Writing URL', () => {
  const post = { title: 'A launch story', url: '/writing/working-stories/launch', source: 'abvx' };
  assert.equal(searchWritingPosts([post], 'distribution', { bodies: new Map([[post.url, 'A retail distribution strategy.']]) }).length, 1);
});

test('only visible prose is searched, not tags, dates, author or link targets', () => {
  const post = { title: 'A note', excerpt: 'A short reflection.', url: '/writing/special-marker', source: 'abvx', author: 'hidden-author', tags: ['secret-tag'] };
  const bodies = new Map([[post.url, 'Read [the source](https://example.com/hidden-link-target). **Actual prose** remains.']]);
  for (const query of ['special-marker', 'hidden-author', 'secret-tag', 'hidden-link-target']) assert.equal(searchWritingPosts([post], query, { bodies }).length, 0);
  assert.equal(searchWritingPosts([post], 'actual prose', { bodies }).length, 1);
});


test('query URLs preserve source and Unicode while clearing only the search', () => {
  assert.equal(normalizeWritingQuery(['  café   кофе  ', 'ignored']), 'café кофе');
  assert.equal(normalizeWritingQuery('a'.repeat(500)).length, 200);
  assert.equal(writingSearchHref('abvx', 'eggs & tulips'), '/writing?source=abvx&q=eggs+%26+tulips');
  assert.equal(writingSearchHref('all', 'кофе'), '/writing?q=%D0%BA%D0%BE%D1%84%D0%B5');
  assert.equal(writingSearchHref('medium'), '/writing?source=medium');
  assert.equal(writingSearchHref(), '/writing');
});

test('body results show a short prose excerpt around the matching word', () => {
  const excerpt = writingSearchExcerpt({ excerpt: 'No keyword in summary.' }, 'Beginning. '.repeat(100) + 'Unexpected **tulips** at breakfast. ' + 'More. '.repeat(100), 'tulips');
  assert.ok(excerpt.includes('tulips'));
  assert.ok(!excerpt.includes('**'));
  assert.ok(excerpt.startsWith('…'));
  assert.ok(excerpt.length <= 302);
});


test('literal identifiers and code content remain searchable while Markdown emphasis is removed', () => {
  const post = { title: 'Command notes', source: 'abvx', url: '/writing/commands' };
  const body = 'Use PACKAGE_NAME and `INLINE_NAME` with **bold** and _emphasis_.\n```sh\nadb shell pm enable PACKAGE_NAME\nconst ENTRY_NAME = "[value] * _ <literal>";\n```';
  const bodies = new Map([[post.url, body]]);
  for (const query of ['PACKAGE_NAME', 'INLINE_NAME', 'ENTRY_NAME', '[value]', '<literal>', 'bold emphasis']) {
    assert.equal(searchWritingPosts([post], query, { bodies }).length, 1, query);
  }
  const excerpt = writingSearchExcerpt(post, body, 'PACKAGE_NAME');
  assert.match(excerpt, /PACKAGE_NAME/);
  assert.match(excerpt, /INLINE_NAME/);
  assert.ok(!excerpt.includes('**'));
  assert.ok(!excerpt.includes('_emphasis_'));
});

test('the published Android TV article is found by its rendered PACKAGE_NAME command', () => {
  const post = { title: 'Android TV notes', source: 'abvx', url: '/writing/android-tv-debloat-codex-claude-code-adb' };
  const body = readFileSync(new URL('../content/writing/android-tv-debloat-codex-claude-code-adb.md', import.meta.url), 'utf8').split('---').slice(2).join('---');
  assert.equal(searchWritingPosts([post], 'PACKAGE_NAME', { bodies: new Map([[post.url, body]]) }).length, 1);
  assert.match(writingSearchExcerpt(post, body, 'PACKAGE_NAME'), /PACKAGE_NAME/);
});
