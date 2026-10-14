import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedMap, internalPagePaths } from '../scripts/publication-qa.mjs';
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
