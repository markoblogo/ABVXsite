import test from 'node:test';
import assert from 'node:assert/strict';
import { writingTopics, writingTopicsFor, normalizeWritingTopic, navigationTopicErrors, filterWritingPosts } from '../src/content/writing-topics.mjs';
import { writingSearchHref, searchWritingPosts } from '../src/lib/writing-search.mjs';
import { writingWindow } from '../src/lib/writing-window.mjs';
import { publicationMetadataErrors } from '../scripts/publication-metadata.mjs';

test('stable ordered navigation taxonomy and source-scoped URL state', () => {
  assert.deepEqual(writingTopics.map(t => t.slug), ['psychology','kitchen-notes','ai-technology','business-work','other']);
  for (const {slug} of writingTopics) {
    assert.equal(normalizeWritingTopic([slug]), slug);
    assert.equal(writingSearchHref('abvx','',slug), `/writing?source=abvx&topic=${slug}`);
    assert.equal(writingSearchHref('abvx','bread',slug), `/writing?source=abvx&topic=${slug}&q=bread`);
    assert.equal(normalizeWritingTopic(slug,'medium'), '');
    assert.equal(writingSearchHref('medium','bread',slug), '/writing?source=medium&q=bread');
  }
  assert.equal(normalizeWritingTopic('unknown'), '');
  assert.equal(writingSearchHref('abvx','','unknown'), '/writing?source=abvx');
});

test('metadata inference supports multiple topics, Other and explicit overrides without touching book fields', () => {
  assert.deepEqual(writingTopicsFor({collection:'kitchen-notes',tags:['cooking-with-ai']}), ['kitchen-notes','ai-technology']);
  assert.deepEqual(writingTopicsFor({type:'working-story',topics:['consumer-psychology']}), ['psychology','business-work']);
  assert.deepEqual(writingTopicsFor({tags:['AI agents','Future of Work']}), ['ai-technology','business-work']);
  assert.deepEqual(writingTopicsFor({tags:['books','personal']}), ['other']);
  assert.deepEqual(writingTopicsFor({type:'note',tags:['books','psychology','economics']}), ['other']);
  assert.deepEqual(writingTopicsFor({tags:['psychology'],navigationTopics:[]}), ['other']);
  const metadata={tags:['psychology-notebook'],navigationTopics:['business-work','ai-technology'],book:{include:true,topics:['grief']}};
  const before=structuredClone(metadata);
  assert.deepEqual(writingTopicsFor(metadata), ['ai-technology','business-work']);
  assert.deepEqual(metadata,before);
  assert.deepEqual(writingTopicsFor({book:{topics:['psychology']}}), ['other']);
});

test('navigation metadata is validated independently of publication and book state', () => {
  for (const navigationTopics of [[],['other'],['psychology','business-work']]) assert.deepEqual(navigationTopicErrors({navigationTopics}),[]);
  for (const navigationTopics of [null,'psychology',['invalid'],['other','other']]) {
    assert.equal(navigationTopicErrors({navigationTopics}).length,1);
    assert.equal(publicationMetadataErrors({navigationTopics}).length,1);
  }
});

test('full collection filtering precedes featured/window/search, preserves order and never duplicates', () => {
  const posts=Array.from({length:90},(_,n)=>({source:'abvx',url:`/writing/${n}`,title:`Entry ${n}`,navigationTopics:n%2?['kitchen-notes','ai-technology']:['psychology']}));
  posts.push({source:'abvx',url:'/writing/other',title:'Personal note',navigationTopics:['other']});
  posts.push({source:'medium',url:'https://example.com/post',title:'Bread elsewhere'});
  assert.equal(filterWritingPosts(posts,'abvx').length,91);
  assert.deepEqual(filterWritingPosts(posts,'abvx','invalid'),filterWritingPosts(posts,'abvx'));
  const selected=filterWritingPosts(posts,'abvx','kitchen-notes');
  assert.equal(selected.length,45);
  const window=writingWindow(selected);
  assert.equal(window.featuredPost.url,'/writing/1');
  const all=[window.featuredPost,...window.recentPosts,...window.archivePosts,...window.remainingPosts];
  assert.deepEqual(all,selected);
  assert.equal(new Set(all.map(p=>p.url)).size,45);
  assert.equal(window.remainingPosts.length,8);
  assert.deepEqual(searchWritingPosts(selected,'bread',{bodies:new Map([['/writing/89','Bread recipe']])}).map(p=>p.url),['/writing/89']);
  assert.deepEqual(searchWritingPosts(selected,'missing'),[]);
  assert.equal(filterWritingPosts(posts,'abvx','other').length,1);
  assert.equal(filterWritingPosts(posts,'medium','psychology').length,1);
  assert.equal(filterWritingPosts(posts).length,posts.length);
});
