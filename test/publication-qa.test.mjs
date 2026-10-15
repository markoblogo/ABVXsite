import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedMap, internalPagePaths, assertCatalogueVideo } from '../scripts/publication-qa.mjs';
import {staticPublicationRoutes} from '../scripts/publication-routes.mjs';
test('scoped internal links include absolute same-origin URLs and exclude external/media links',()=>{
 assert.deepEqual(internalPagePaths(['/books/a','https://abvx.xyz/books/missing?x=1#title','//abvx.xyz/books/a','https://example.com/books/a','mailto:test@example.com','/media/cover.avif']),['/books/a','/books/missing']);
 assert.deepEqual(internalPagePaths(['related','#part'],'https://abvx.xyz/writing/post'),['/writing/related','/writing/post']);
});
test('static hub paths are reserved before considering content routes',()=>{
 const routes=staticPublicationRoutes();
 assert.ok(routes.has('/writing/archive'));assert.ok(routes.has('/writing/kitchen-notes'));
 assert.ok(routes.has('/books'));assert.equal(routes.has('/writing/[slug]'),false);
});
test('requests are bounded, overlap, cover every item and propagate failure',async()=>{
 let active=0,peak=0;const visited=[];
 await boundedMap(Array.from({length:15},(_,i)=>i),async i=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,5));visited.push(i);active--;},3);
 assert.equal(peak,3);assert.deepEqual(visited.sort((a,b)=>a-b),Array.from({length:15},(_,i)=>i));
 await assert.rejects(boundedMap([1,2,3],async i=>{if(i===2)throw Error('failed');}),/failed/);
});

test('catalogue video evidence requires the selected video, not an arbitrary iframe',()=>{
 const data={links:[{type:'youtube',url:'https://www.youtube.com/@channel'},{type:'youtube',url:'https://youtu.be/aaaaaaaaaaa'}]};
 assertCatalogueVideo(data,[{src:'https://www.youtube.com/embed/aaaaaaaaaaa',title:'Book trailer'}]);
 assertCatalogueVideo(data,[{src:'https://www.youtube-nocookie.com/embed/aaaaaaaaaaa?rel=0',title:'Book trailer'}]);
 for(const frame of [{src:'https://www.youtube.com/embed/bbbbbbbbbbb',title:'Wrong'}, {src:'https://evil.example/embed/aaaaaaaaaaa',title:'Fake'}, {src:'https://www.youtube.com/embed/aaaaaaaaaaa',title:' '}])assert.throws(()=>assertCatalogueVideo(data,[frame]));
});


test('catalogue evidence rejects watch-page iframes and follows the book-renderable link',()=>{
 const data={links:[{type:'youtube',url:'https://www.youtube-nocookie.com/embed/bbbbbbbbbbb'},{type:'youtube',url:'https://youtu.be/aaaaaaaaaaa'}]};
 assertCatalogueVideo(data,[{src:'https://www.youtube.com/embed/aaaaaaaaaaa',title:'Trailer'}],'books');
 assert.throws(()=>assertCatalogueVideo(data,[{src:'https://www.youtube.com/watch?v=aaaaaaaaaaa',title:'Trailer'}],'books'));
 assert.throws(()=>assertCatalogueVideo(data,[{src:'https://youtu.be/aaaaaaaaaaa',title:'Trailer'}],'books'));
});


test('internal download checks do not buffer large media but still reject missing targets', async () => {
 const { assertInternalLink } = await import('../scripts/publication-qa.mjs');
 const calls = [];
 const client = {
  get: async url => { calls.push(['GET', url]); return { status: () => 200, dispose: async () => {} }; },
  head: async url => { calls.push(['HEAD', url]); return { status: () => url.includes('missing') ? 404 : 200, dispose: async () => {} }; },
 };
 await assertInternalLink(client, 'https://abvx.xyz/books/example');
 await assertInternalLink(client, 'https://abvx.xyz/media/audiobook.MP3?download=1');
 await assertInternalLink(client, 'https://abvx.xyz/media/audiobook.m4b');
 assert.deepEqual(calls.map(call => call[0]), ['GET', 'HEAD', 'HEAD']);
 await assert.rejects(assertInternalLink(client, 'https://abvx.xyz/media/missing.mp3'), /broken internal link/);
});


test('scoped link QA retains binary links and fails a missing M4B through the real scoped helper', async () => {
 const { checkInternalLinks } = await import('../scripts/publication-qa.mjs');
 const calls=[];
 const response = status => ({status:()=>status,dispose:async()=>{}});
 const client={get:async url=>{calls.push(['GET',url]);return response(200);},head:async url=>{calls.push(['HEAD',url]);return response(url.includes('missing')?404:200);}};
 await checkInternalLinks(client, ['/books/related','/media/book.mp3','https://abvx.xyz/media/book.m4b?download=1','https://outside.example/file.m4b'], 'https://abvx.xyz/books/new', 'http://localhost:3000');
 assert.deepEqual(calls,[['GET','http://localhost:3000/books/related'],['HEAD','http://localhost:3000/media/book.mp3'],['HEAD','http://localhost:3000/media/book.m4b?download=1']]);
 await assert.rejects(checkInternalLinks(client,['/media/missing.m4b'],'https://abvx.xyz/books/new'),/broken internal link/);
});
