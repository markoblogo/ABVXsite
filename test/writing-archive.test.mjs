import test from 'node:test';
import assert from 'node:assert/strict';
import { writingArchiveItems,writingArchiveLastModified } from '../src/lib/writing-archive.mjs';
test('archive changes follow first discovery of historical native stories and videos, excluding unrelated feeds',()=>{
 const items=[{type:'writing',canonicalUrl:'https://abvx.xyz/writing/old-note',updatedAt:'2020-01-01'},{type:'working-story',canonicalUrl:'https://abvx.xyz/writing/working-stories/old-story',publishedAt:'2020-01-01'},{type:'video',canonicalUrl:'https://abvx.xyz/writing/videos/aaaaaaaaaaa',publishedAt:'2020-01-01',links:[{type:'youtube',url:'https://youtu.be/aaaaaaaaaaa'}]}];
 const urls=['/writing/old-note','/writing/working-stories/old-story','https://www.youtube.com/watch?v=aaaaaaaaaaa'];
 for(const url of urls) assert.equal(writingArchiveLastModified({items},{items:[{url,addedAt:'2024-02-01T00:00:00.000Z'}]},'2024-01-01'),'2024-02-01T00:00:00.000Z');
 const discovery={items:[{url:'https://abvx.substack.com/p/unrelated',addedAt:'2025-01-01T00:00:00.000Z'},{url:'/writing/not-in-archive',addedAt:'2025-01-01T00:00:00.000Z'}]};
 assert.equal(writingArchiveLastModified({items},discovery,'2024-01-01'),'2024-01-01');
 items[0].updatedAt='2024-03-01';assert.equal(writingArchiveLastModified({items},discovery,'2024-01-01'),'2024-03-01');
});
test('the complete archive keeps entries beyond the recent window, including old public notes and video pages',()=>{
 const items=Array.from({length:80},(_,i)=>({title:'Title '+i,type:i%2?'video':'writing',canonicalUrl:'https://abvx.xyz/writing/item-'+i}));
 items.push({type:'writing',title:'Archive',canonicalUrl:'https://abvx.xyz/writing/old-note',status:'archive'});
 items.push({type:'editorial-series',title:'Hub',canonicalUrl:'https://abvx.xyz/writing/archive'});
 assert.equal(writingArchiveItems({items}).length,81);
 assert.ok(writingArchiveItems({items}).some(item=>item.url==='/writing/item-79'));
 assert.ok(writingArchiveItems({items}).some(item=>item.url==='/writing/old-note'));
});
