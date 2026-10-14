import assert from 'node:assert/strict';
import test from 'node:test';
import {writingWindow, visibleWritingItems} from '../src/lib/writing-window.mjs';

test('retained video 38 stays outside the rendered window without disappearing from history', () => {
  const posts = Array.from({length:38}, (_,i)=>({url:'/writing/videos/video-'+i}));
  const {featuredPost,recentPosts,archivePosts}=writingWindow(posts);
  assert.equal(featuredPost.url,posts[0].url);
  assert.equal(recentPosts.length,6);
  assert.equal(archivePosts.length,30);
  assert.deepEqual(visibleWritingItems(posts),posts.slice(0,37));
  assert.ok(!visibleWritingItems(posts).includes(posts[37]));
  assert.equal(posts.length,38);
});

test('a native video companion consumes a slot in the same window as automatic videos', () => {
  const posts=[{url:'/writing/authored-companion'}, ...Array.from({length:37},(_,i)=>({url:'/writing/videos/video-'+i}))];
  const visible=visibleWritingItems(posts);
  assert.equal(visible.length,37);
  assert.equal(visible[0].url,'/writing/authored-companion');
  assert.equal(visible.at(-1).url,'/writing/videos/video-35');
  assert.deepEqual(visibleWritingItems([]),[]);
  assert.deepEqual(visibleWritingItems(posts.slice(0,1)),posts.slice(0,1));
});

test('More posts receives all hidden entries in source order without repeating the initial window',()=>{
 const posts=Array.from({length:100},(_,i)=>({url:'/writing/post-'+i}));
 const window=writingWindow(posts);
 assert.deepEqual([...visibleWritingItems(posts),...window.remainingPosts],posts);
 assert.equal(window.remainingPosts.length,63);assert.deepEqual(writingWindow([]).remainingPosts,[]);
});
