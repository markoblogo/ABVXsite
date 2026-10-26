import {mkdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {get,put,BlobPreconditionFailedError} from '@vercel/blob';
import {assertSnapshot,digest,ConflictError} from './runtime-writing.mjs';
const prefix='writing-v1/';
const immutableCache=new Map();
const headPath=prefix+'head.json';
const objectPath=hash=>prefix+'snapshots/'+hash+'.json';
const serialize=snapshot=>JSON.stringify(assertSnapshot(snapshot));
function decode(head,bytes){
 if(head.schemaVersion!==1||!/^[a-f0-9]{64}$/.test(head.hash)||digest(bytes)!==head.hash)throw Error('Writing snapshot integrity failed');
 const snapshot=assertSnapshot(JSON.parse(bytes));
 if(snapshot.revision!==head.revision)throw Error('Writing revision mismatch');
 return snapshot;
}
// Development/acceptance only. Production has no writable filesystem backend.
export function createFileStore(directory){
 if(process.env.VERCEL||process.env.VERCEL_ENV)throw Error('Filesystem writing store is forbidden on Vercel');
 const head=join(directory,'head.json');
 async function locked(work){
  await mkdir(directory,{recursive:true});const lock=join(directory,'.commit-lock');
  try{await mkdir(lock);}catch(error){if(error.code==='EEXIST')throw new ConflictError('Another write is in progress; retry');throw error;}
  try{return await work();}finally{await rm(lock,{recursive:true,force:true});}
 }
 async function commit(snapshot,expected){return locked(async()=>{
  let current=null;try{current=await readFile(head,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
  if((current===null?null:digest(current))!==expected)throw new ConflictError('Content revision changed');
  const bytes=serialize(snapshot),hash=digest(bytes);await writeFile(join(directory,hash+'.json'),bytes);
  const pointer=JSON.stringify({schemaVersion:1,hash,revision:snapshot.revision});const temp=head+'.'+randomUUID();
  await writeFile(temp,pointer,{flag:'wx'});await rename(temp,head);
 });}
 return {
  async load(){const pointer=await readFile(head,'utf8'),headValue=JSON.parse(pointer);return {snapshot:decode(headValue,await readFile(join(directory,headValue.hash+'.json'),'utf8')),etag:digest(pointer)};},
  commit,initialize:snapshot=>commit(snapshot,null),
  async putAsset(key,bytes){await mkdir(join(directory,'assets'),{recursive:true});await writeFile(join(directory,'assets',key),bytes,{flag:'wx'}).catch(error=>{if(error.code!=='EEXIST')throw error;});},
  async getAsset(key){return readFile(join(directory,'assets',key));},
 };
}
export function createBlobStore(options={},client={get,put}){
 const config={access:'private',...options};
 async function read(path){const result=await client.get(path,{...config,useCache:false});if(!result||result.statusCode!==200)throw Error('Writing store is unavailable or not initialized');return {bytes:await new Response(result.stream).text(),etag:result.blob.etag};}
 async function commit(snapshot,expected){
  const bytes=serialize(snapshot),hash=digest(bytes);
  // Immutable data is durable before the single conditional publication pointer changes.
  await client.put(objectPath(hash),bytes,{...config,addRandomSuffix:false,contentType:'application/json',allowOverwrite:true});
  try{await client.put(headPath,JSON.stringify({schemaVersion:1,hash,revision:snapshot.revision}),{...config,addRandomSuffix:false,contentType:'application/json',...(expected===null?{allowOverwrite:false}:{ifMatch:expected})});}
  catch(error){if(error instanceof BlobPreconditionFailedError||error.message?.includes('already exists'))throw new ConflictError('Content revision changed');throw error;}
 }
 return {
  async load(){const head=await read(headPath),pointer=JSON.parse(head.bytes);if(!/^[a-f0-9]{64}$/.test(pointer.hash))throw Error('Invalid writing pointer');let snapshot=immutableCache.get(pointer.hash);if(!snapshot){const data=await read(objectPath(pointer.hash));snapshot=decode(pointer,data.bytes);immutableCache.set(pointer.hash,snapshot);while(immutableCache.size>2)immutableCache.delete(immutableCache.keys().next().value);}if(snapshot.revision!==pointer.revision)throw Error('Writing revision mismatch');return {snapshot:structuredClone(snapshot),etag:head.etag};},
  commit,initialize:snapshot=>commit(snapshot,null),
  async putAsset(key,bytes,contentType){await client.put(prefix+'assets/'+key,bytes,{...config,addRandomSuffix:false,allowOverwrite:true,contentType});},
  async getAsset(key){const data=await client.get(prefix+'assets/'+key,{...config,useCache:false});if(!data||data.statusCode!==200)throw Error('Missing image');return Buffer.from(await new Response(data.stream).arrayBuffer());},
 };
}
export function configuredWritingStore(){
 if(process.env.RUNTIME_WRITING_BACKEND==='file'){
  if(!process.env.RUNTIME_WRITING_DIR)throw Error('RUNTIME_WRITING_DIR required');
  return createFileStore(process.env.RUNTIME_WRITING_DIR);
 }
 return createBlobStore();
}
