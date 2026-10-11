import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedMap } from '../scripts/publication-qa.mjs';
test('requests are bounded, overlap, cover every item and propagate failure',async()=>{
 let active=0,peak=0;const visited=[];
 await boundedMap(Array.from({length:15},(_,i)=>i),async i=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,5));visited.push(i);active--;},3);
 assert.equal(peak,3);assert.deepEqual(visited.sort((a,b)=>a-b),Array.from({length:15},(_,i)=>i));
 await assert.rejects(boundedMap([1,2,3],async i=>{if(i===2)throw Error('failed');}),/failed/);
});
