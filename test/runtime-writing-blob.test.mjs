import test from 'node:test';
import assert from 'node:assert/strict';
import {BlobPreconditionFailedError} from '@vercel/blob';
import {createBlobStore} from '../src/content/runtime-writing-store.mjs';
import {emptySnapshot,ConflictError} from '../src/content/runtime-writing.mjs';
test('Blob adapter reads the current private pointer and performs a conditional atomic promotion',async()=>{
 const objects=new Map(),reads=[];let n=0;
 const client={get:async(path,options)=>{reads.push({path,options});const data=objects.get(path);return data?{statusCode:200,stream:new Response(data.body).body,blob:{etag:data.etag}}:null;},put:async(path,body,options)=>{
  const old=objects.get(path);if(options.ifMatch&&options.ifMatch!==old?.etag)throw new BlobPreconditionFailedError('changed');
  if(options.allowOverwrite===false&&old)throw Error('already exists');objects.set(path,{body,etag:String(++n)});
 }};
 const store=createBlobStore({},client);await store.initialize(emptySnapshot());
 const a=await store.load(),b=await store.load();await store.commit({...a.snapshot,revision:'new-revision'},a.etag);
 await assert.rejects(store.commit({...b.snapshot,revision:'stale'},b.etag),ConflictError);
 assert.equal((await store.load()).snapshot.revision,'new-revision');
 assert.ok(reads.every(x=>x.options.access==='private'&&x.options.useCache===false));
});
