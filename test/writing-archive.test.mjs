import test from 'node:test';
import assert from 'node:assert/strict';
import { writingArchiveItems } from '../src/lib/writing-archive.mjs';
test('the complete archive keeps entries beyond the recent window, including old public notes and video pages',()=>{
 const items=Array.from({length:80},(_,i)=>({title:'Title '+i,type:i%2?'video':'writing',canonicalUrl:'https://abvx.xyz/writing/item-'+i}));
 items.push({type:'writing',title:'Archive',canonicalUrl:'https://abvx.xyz/writing/old-note',status:'archive'});
 items.push({type:'editorial-series',title:'Hub',canonicalUrl:'https://abvx.xyz/writing/archive'});
 assert.equal(writingArchiveItems({items}).length,81);
 assert.ok(writingArchiveItems({items}).some(item=>item.url==='/writing/item-79'));
 assert.ok(writingArchiveItems({items}).some(item=>item.url==='/writing/old-note'));
});
