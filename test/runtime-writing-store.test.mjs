import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createFileStore} from '../src/content/runtime-writing-store.mjs';
import {emptySnapshot,ConflictError} from '../src/content/runtime-writing.mjs';
test('durable store initializes once, checks integrity and rejects stale writers',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'abvx-runtime-'));
 try{const a=createFileStore(dir),b=createFileStore(dir);await assert.rejects(a.load());
 await a.initialize(emptySnapshot());await assert.rejects(a.initialize(emptySnapshot()),ConflictError);
 const one=await a.load(),two=await b.load();const next={...one.snapshot,revision:'next'};
 await a.commit(next,one.etag);await assert.rejects(b.commit({...two.snapshot,revision:'stale'},two.etag),ConflictError);
 assert.equal((await b.load()).snapshot.revision,'next');
 }finally{await rm(dir,{recursive:true,force:true});}
});
