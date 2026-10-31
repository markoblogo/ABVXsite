import test from 'node:test';
import assert from 'node:assert/strict';
import { assertIllustrationPlacement, boundedMap, internalPagePaths, assertCatalogueVideo } from '../scripts/publication-qa.mjs';
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
 assert.throws(()=>assertCatalogueVideo(data,[{src:'https://www.youtube.com/embed/aaaaaaaaaaa',title:'Book trailer',loading:'lazy',referrerPolicy:'strict-origin-when-cross-origin'}]));
 assertCatalogueVideo(data,[{src:'https://www.youtube-nocookie.com/embed/aaaaaaaaaaa?rel=0',title:'Book trailer',loading:'lazy',referrerPolicy:'strict-origin-when-cross-origin'}]);
 for(const frame of [{src:'https://www.youtube.com/embed/bbbbbbbbbbb',title:'Wrong'}, {src:'https://evil.example/embed/aaaaaaaaaaa',title:'Fake'}, {src:'https://www.youtube.com/embed/aaaaaaaaaaa',title:' '}])assert.throws(()=>assertCatalogueVideo(data,[frame]));
});


test('catalogue evidence rejects watch-page iframes and verifies every supported book video',()=>{
 const data={links:[{type:'youtube',url:'https://www.youtube-nocookie.com/embed/bbbbbbbbbbb'},{type:'youtube',url:'https://youtu.be/aaaaaaaaaaa'}]};
 assertCatalogueVideo(data,['aaaaaaaaaaa','bbbbbbbbbbb'].map(id=>({src:'https://www.youtube-nocookie.com/embed/'+id,title:'Trailer',loading:'lazy',referrerPolicy:'strict-origin-when-cross-origin'})),'books');
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

test('catalogue media proves the requested image and HEAD-checks download assets',async()=>{
 const {assertCatalogueImage,assertCatalogueDownloads}=await import('../scripts/publication-qa.mjs');
 const data={media:{src:'/media/new.webp',alt:'Cover'},links:[{type:'pdf',url:'https://example.com/book.pdf'},{type:'audio',url:'/media/book.mp3'}]};
 assertCatalogueImage(data,[{src:'/_next/image?url=%2Fmedia%2Fnew.webp&w=640&q=75',loaded:true}]);
 for(const image of [{src:'/media/old.webp',loaded:true},{src:'/media/new.webp',loaded:false}])assert.throws(()=>assertCatalogueImage(data,[image]));
 const calls=[];const client={head:async url=>{calls.push(url);return {status:()=>url.includes('missing')?404:200,dispose:async()=>{}};}};
 await assertCatalogueDownloads(client,data,'http://127.0.0.1:3210');
 assert.deepEqual(calls,['https://example.com/book.pdf','http://127.0.0.1:3210/media/book.mp3']);
 await assert.rejects(assertCatalogueDownloads(client,{links:[{type:'audiobook',url:'https://example.com/missing.m4b'}]},'http://localhost:3000'),/unavailable/);
});


test('catalogue video QA rejects eager and referrer-unsafe privacy-host frames',()=>{
 const data={links:[{type:'youtube',url:'https://youtu.be/aaaaaaaaaaa'}]};
 const frame={src:'https://www.youtube-nocookie.com/embed/aaaaaaaaaaa',title:'Trailer',loading:'lazy',referrerPolicy:'strict-origin-when-cross-origin'};
 assertCatalogueVideo(data,[frame]);
 for(const patch of [{loading:undefined},{loading:'eager'},{referrerPolicy:undefined},{referrerPolicy:'unsafe-url'}])assert.throws(()=>assertCatalogueVideo(data,[{...frame,...patch}]));
});
test('playable audio QA rejects CSP-blocked initial and redirect hosts, while download-only links remain allowed',async()=>{
 const {assertCatalogueDownloads}=await import('../scripts/publication-qa.mjs');
 const blocked={type:'audio',url:'https://example.com/book.mp3'};
 const client={head:async url=>({status:()=>200,url:()=>url,dispose:async()=>{}})};
 await assert.rejects(assertCatalogueDownloads(client,{type:'book',links:[blocked]},'https://abvx.xyz','books'),/CSP/);
 await assertCatalogueDownloads(client,{type:'series',links:[blocked]},'https://abvx.xyz','books');
 await assertCatalogueDownloads(client,{type:'tool',links:[blocked]},'https://abvx.xyz','work');
 const allowed={type:'audio',url:'https://github.com/owner/assets/releases/download/v1/book.mp3'};
 await assertCatalogueDownloads(client,{type:'book',links:[allowed]},'https://abvx.xyz','books');
 const redirected={head:async()=>({status:()=>200,url:()=>blocked.url,dispose:async()=>{}})};
 await assert.rejects(assertCatalogueDownloads(redirected,{type:'book',links:[allowed]},'https://abvx.xyz','books'),/redirect.*CSP/);
});

test('catalogue QA rejects a release missing any of its ten distinct videos',()=>{
 const links=Array.from({length:10},(_,i)=>({type:'youtube',label:'Video '+i,url:'https://youtu.be/'+String(i).padStart(11,'0')}));
 const frames=links.map(link=>({src:'https://www.youtube-nocookie.com/embed/'+link.url.split('/').at(-1),title:link.label,loading:'lazy',referrerPolicy:'strict-origin-when-cross-origin'}));
 const data={links};assertCatalogueVideo(data,frames,'books');
 assert.throws(()=>assertCatalogueVideo(data,frames.slice(0,-1),'books'),'last video cannot disappear');
 assert.throws(()=>assertCatalogueVideo(data,[frames[0]],'work'),'first video alone cannot prove all videos');
});

test('illustration QA checks exact paragraph placement as well as legacy headings',()=>{
 const image={afterParagraph:'An _introductory_ paragraph.'};
 const position={tag:'P',text:'An introductory paragraph.',anchor:image.afterParagraph};
 assertIllustrationPlacement(image,position);
 for(const invalid of [{...position,tag:'H3'},{...position,anchor:'Other.'},{...position,text:''}]) assert.throws(()=>assertIllustrationPlacement(image,invalid));
 assertIllustrationPlacement({afterHeading:'Section'},{tag:'H3',text:'Section'});
 assert.throws(()=>assertIllustrationPlacement({afterHeading:'Section'},position));
});

test('paragraph illustration QA recognizes the selected standalone video, rejecting others',()=>{
 const image={afterParagraph:'[Clip](https://www.youtube.com/watch?v=aaaaaaaaaaa)'};
 assertIllustrationPlacement(image,{tag:'FIGURE',videoSrc:'https://www.youtube-nocookie.com/embed/aaaaaaaaaaa'});
 assert.throws(()=>assertIllustrationPlacement(image,{tag:'FIGURE',videoSrc:'https://www.youtube-nocookie.com/embed/bbbbbbbbbbb'}));
});
