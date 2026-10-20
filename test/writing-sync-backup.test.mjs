import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker,{ensureWritingSync} from '../infra/writing-sync-backup/worker.mjs';

const now=Date.parse('2026-10-20T12:07:00Z');
const env={ENABLED:'true',GITHUB_DISPATCH_TOKEN:'synthetic-test-token'};
const endpoint='https://api.github.com/repos/markoblogo/ABVXsite/actions/workflows/writing-feed-sync.yml';
const run=(overrides={})=>({id:1,head_branch:'main',event:'schedule',status:'completed',conclusion:'success',
 created_at:'2026-10-20T12:02:00Z',updated_at:'2026-10-20T12:03:00Z',...overrides});
function github(runs=[],dispatchStatus=204) {
 const calls=[];
 const fetchImpl=async (url,options)=>{
  calls.push({url,options});
  return options.method==='POST'?new Response(null,{status:dispatchStatus}):Response.json({workflow_runs:runs});
 };
 return {calls,fetchImpl};
}
test('a missed scheduled run dispatches the existing main-branch workflow once',async()=>{
 const api=github();
 assert.deepEqual(await ensureWritingSync(env,{now,fetchImpl:api.fetchImpl}),{action:'dispatched'});
 assert.equal(api.calls.length,2);
 assert.equal(api.calls[0].url,endpoint+'/runs?branch=main&per_page=20');
 const dispatch=api.calls[1];
 assert.equal(dispatch.url,endpoint+'/dispatches');
 assert.equal(dispatch.options.method,'POST');
 assert.deepEqual(JSON.parse(dispatch.options.body),{ref:'main'});
 assert.equal(dispatch.options.headers.Authorization,'Bearer synthetic-test-token');
 assert.equal(dispatch.options.redirect,'error');
 assert.ok(dispatch.options.signal instanceof AbortSignal);
});

test('failed runs, stale checks and unrelated branches cannot suppress recovery',async()=>{
 for(const runs of [
  [run({conclusion:'failure'})],
  [run({created_at:'2026-10-20T11:42:00Z'})],
  [run({head_branch:'feature'})],
  [run({event:'push'})],
 ]) {
  const api=github(runs,200);
  assert.equal((await ensureWritingSync(env,{now,fetchImpl:api.fetchImpl})).action,'dispatched');
  assert.equal(api.calls.filter(call=>call.options.method==='POST').length,1);
 }
});

test('disabled deployment and missing secrets never send a request',async()=>{
 const api=github();
 assert.deepEqual(await ensureWritingSync({}, {fetchImpl:api.fetchImpl}),{action:'disabled'});
 await assert.rejects(()=>ensureWritingSync({ENABLED:'true'}, {fetchImpl:api.fetchImpl}),/TOKEN is required/);
 assert.equal(api.calls.length,0);
});

test('a stuck run is reported instead of enqueueing more copies',async()=>{
 const api=github([run({status:'in_progress',conclusion:null,created_at:'2026-10-20T11:00:00Z'})]);
 await assert.rejects(()=>ensureWritingSync(env,{now,fetchImpl:api.fetchImpl}),/stuck/);
 assert.equal(api.calls.length,1);
});

test('API failures or invalid timestamps fail closed without exposing response bodies',async()=>{
 for(const response of [new Response('sensitive-response',{status:401}),Response.json({unexpected:true}),Response.json({workflow_runs:[run({created_at:'broken'})]}),Response.json({workflow_runs:[run({created_at:'2026-10-20T13:00:00Z'})]})]) {
  let requests=0;
  await assert.rejects(()=>ensureWritingSync(env,{now,fetchImpl:async()=>{requests++;return response;}}),error=>!error.message.includes('sensitive-response'));
  assert.equal(requests,1);
 }
 const api=github([],403);
 await assert.rejects(()=>ensureWritingSync(env,{now,fetchImpl:api.fetchImpl}),/dispatch failed: HTTP 403/);
 assert.equal(api.calls.length,2,'a failed dispatch is not blindly retried');
});

test('deployment is inert by default and exposes no public HTTP endpoint',()=>{
 const config=JSON.parse(readFileSync(new URL('../infra/writing-sync-backup/wrangler.json',import.meta.url),'utf8'));
 assert.equal(config.vars.ENABLED,'false');
 assert.equal(config.workers_dev,false);
 assert.equal(config.preview_urls,false);
 assert.equal(typeof worker.scheduled,'function');
 assert.equal(Object.hasOwn(worker,'fetch'),false);
 assert.deepEqual(config.triggers.crons,['7,22,37,52 * * * *']);
 assert.equal(Object.hasOwn(config.vars,'GITHUB_DISPATCH_TOKEN'),false);
});

test('a recent successful run or an active main-branch run suppresses backup dispatch',async()=>{
 for(const item of [run(),run({event:'workflow_dispatch',status:'in_progress',conclusion:null}),run({status:'queued',conclusion:null}),run({status:'waiting',conclusion:null})]) {
  const api=github([item]);
  const result=await ensureWritingSync(env,{now,fetchImpl:api.fetchImpl});
  assert.equal(result.action,item.status==='completed'?'fresh':'active');
  assert.equal(api.calls.length,1,'skip a duplicate workflow without dispatching');
 }
});
