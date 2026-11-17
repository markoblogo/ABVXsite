import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createPublishedImageReader} from '../src/content/runtime-writing-media.mjs';
import {seedSnapshot,digest} from '../src/content/runtime-writing.mjs';

async function fixture(){
 const bytes=await sharp({create:{width:1536,height:1024,channels:3,background:'#dfaf44'}}).png().toBuffer();
 const hash=digest(bytes),key=hash+'.png',path='/media/writing/runtime/'+key;
 const source='---\n'+JSON.stringify({id:'preview',slug:'preview',title:'Preview',summary:'Summary',type:'article',primarySection:'writing',status:'live',visibility:'public',publishedAt:'2026-10-26',tags:[],links:[],media:{src:path,alt:'Cover',width:1536,height:1024}})+'\n---\n\nAccepted text.\n';
 const snapshot=seedSnapshot([source]);snapshot.assets[key]={publicPath:path,sha256:hash,contentType:'image/png'};
 let reads=0,loads=0,unavailable=false,corrupt=false;
 const store={load:async()=>{loads++;if(unavailable)throw Error('unavailable');return {snapshot};},getAsset:async()=>{reads++;return corrupt?Buffer.from('corrupt'):bytes;}};
 return {key,bytes,store,snapshot,counts:()=>({reads,loads}),fail:()=>{unavailable=true;},corrupt:()=>{corrupt=true;}};
}
test('concurrent previews share verified bytes, resize, and recheck visibility on every request',async()=>{
 const f=await fixture(),read=createPublishedImageReader();
 const images=await Promise.all([read(f.store,f.key,320),read(f.store,f.key,320)]);
 assert.equal(f.counts().reads,1);assert.equal(f.counts().loads,2);
 assert.equal((await sharp(images[0].bytes).metadata()).width,320);
 assert.ok(images[0].bytes.length<f.bytes.length);assert.equal(images[0].contentType,'image/webp');
 const record=f.snapshot.records.preview;record.versions[record.currentRevision].withdrawn=true;
 assert.equal(await read(f.store,f.key,320),null);
 f.fail();await assert.rejects(read(f.store,f.key,320),/unavailable/);
});
test('failed reads are never cached and arbitrary widths cannot allocate derivatives',async()=>{
 const f=await fixture(),read=createPublishedImageReader();
 assert.equal(await read(f.store,f.key,99999),null);assert.equal(f.counts().loads,0);
 f.corrupt();await assert.rejects(read(f.store,f.key,640),/integrity/);
 await assert.rejects(read(f.store,f.key,640),/integrity/);assert.equal(f.counts().reads,2);
});
test('byte budget evicts originals instead of keeping unbounded media',async()=>{
 const f=await fixture(),read=createPublishedImageReader({maxBytes:1});
 await read(f.store,f.key);await read(f.store,f.key);assert.equal(f.counts().reads,2);
});
