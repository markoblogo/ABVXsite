import test from 'node:test';
import assert from 'node:assert/strict';
import { previewReadiness, productionReadiness, waitForReadiness, platformIncidents, codexReviewState } from '../scripts/release-ready.mjs';
const checks=[{__typename:'CheckRun',name:'verify',workflowName:'CI',status:'COMPLETED',conclusion:'SUCCESS'},{__typename:'StatusContext',context:'Vercel',state:'SUCCESS'}];
test('preview waits for both CI and provider and rejects failure or changed head',()=>{
 const pr={state:'OPEN',baseRefName:'main',headRefOid:'a',statusCheckRollup:checks};
 assert.equal(previewReadiness({...pr,statusCheckRollup:[]},'a'),false);
 assert.equal(previewReadiness({...pr,statusCheckRollup:checks.slice(0,1)},'a'),false);
 assert.equal(previewReadiness(pr,'a'),true);
 assert.throws(()=>previewReadiness(pr,'b'),/head changed/);
 assert.throws(()=>previewReadiness({...pr,statusCheckRollup:[...checks,{state:'FAILURE'}]},'a'),/failed/);
});
test('production requires latest successful exact merge SHA and detects superseding rollout',()=>{
 const pr={state:'MERGED',baseRefName:'main',mergeCommit:{oid:'b'},mergedAt:'2026-10-11T12:00:00Z'};
 const deployment={sha:'b',environment:'Production',created_at:'2026-10-11T12:01:00Z'};
 assert.equal(productionReadiness(pr,[{...deployment,sha:'a',created_at:'2026-10-11T11:00:00Z'}],[]),false);
 assert.equal(productionReadiness(pr,[deployment],[{environment:'Production',state:'pending'}]),false);
 assert.equal(productionReadiness(pr,[deployment],[{environment:'Production',state:'success'}]),true);
 assert.throws(()=>productionReadiness(pr,[{...deployment,sha:'c'}],[]),/superseded/);
 assert.throws(()=>productionReadiness(pr,[deployment],[{state:'failure'}]),/failed/);
});

function clocked(snapshots, api=()=>[]) {
 let time=0,calls=0;const progress=[];
 return {io:{now:()=>time,sleep:async ms=>{time+=ms;},getPr:async()=>{calls++;return snapshots(time,calls);},api,onProgress:async value=>progress.push(value)},calls:()=>calls,progress};
}
test('a thirteen-minute provider delay completes without a false ten-minute failure or excessive polling',async()=>{
 const base={state:'OPEN',baseRefName:'main',headRefOid:'new'};
 const fake=clocked(time=>({...base,statusCheckRollup:time>=13*60_000?checks:checks.slice(0,1)}));
 const result=await waitForReadiness({phase:'preview',head:'new'},fake.io);
 assert.equal(result.status,'READY');assert.ok(fake.calls()<50);
});
test('a brief stale post-push snapshot waits for the local head instead of binding to the old head',async()=>{
 const fake=clocked((time,calls)=>({state:'OPEN',baseRefName:'main',headRefOid:calls===1?'old':'new',statusCheckRollup:checks}));
 assert.equal((await waitForReadiness({phase:'preview',head:'new'},fake.io)).status,'READY');
});
test('pending provider deadline is resumable and distinct from an actual failed check',async()=>{
 const base={state:'OPEN',baseRefName:'main',headRefOid:'new',statusCheckRollup:checks.slice(0,1)};
 const fake=clocked(()=>base);
 assert.equal((await waitForReadiness({phase:'preview',head:'new',timeoutMs:60_000},fake.io)).status,'WAITING_FOR_PROVIDER');
 assert.ok(fake.progress.some(p=>p.status==='WAITING_FOR_PROVIDER'));
 const failed=clocked(()=>({...base,statusCheckRollup:[{state:'FAILURE'}]}));
 await assert.rejects(waitForReadiness({phase:'preview',head:'new'},failed.io),/failed/);
});
test('a changed head after acknowledgement and a persistently mismatched head remain hard failures',async()=>{
 const base={state:'OPEN',baseRefName:'main',headRefOid:'new',statusCheckRollup:checks.slice(0,1)};
 const changed=clocked((time,calls)=>({...base,headRefOid:calls===1?'new':'other'}));
 await assert.rejects(waitForReadiness({phase:'preview',head:'new'},changed.io),/head changed/);
 const mismatch=clocked(()=>({...base,headRefOid:'other'}));
 await assert.rejects(waitForReadiness({phase:'preview',head:'new'},mismatch.io),/head changed/);
});
test('production waits for exact merge and retains failed and superseding deployment guards',async()=>{
 const pr={state:'MERGED',baseRefName:'main',headRefOid:'head',mergeCommit:{oid:'merge'},mergedAt:'2020-01-01T00:00:00Z'};
 const deployment={id:1,sha:'merge',environment:'Production',created_at:'2020-01-01T00:00:01Z'};
 const fake=clocked(()=>pr,endpoint=>endpoint.startsWith('deployments?')?[deployment]:[{state:'success',environment:'Production'}]);
 assert.equal((await waitForReadiness({phase:'production',head:'head',mergeSha:'merge'},fake.io)).status,'READY');
 const failed=clocked(()=>pr,endpoint=>endpoint.startsWith('deployments?')?[deployment]:[{state:'failure',environment:'Production'}]);
 await assert.rejects(waitForReadiness({phase:'production',head:'head',mergeSha:'merge'},failed.io),/failed/);
});

test('provider status is advisory and a failed status lookup remains unknown',async()=>{
 const missing=await platformIncidents(async()=>{throw Error('offline');});
 assert.ok(missing.every(p=>p.availability==='UNKNOWN'));
 const incidents=await platformIncidents(async()=>({ok:true,json:async()=>({incidents:[{id:'incident',name:'Webhook delivery delay',status:'investigating'}]})}));
 assert.equal(incidents[0].incidents[0].name,'Webhook delivery delay');
 assert.equal(incidents[0].incidents[0].url,'https://www.githubstatus.com/incidents/incident');
});

test('configured review must finish on the exact current head before preview readiness',async()=>{
 const pr={state:'OPEN',baseRefName:'main',headRefOid:'new',statusCheckRollup:checks};
 const fake=clocked(()=>pr);let reviewCalls=0;
 fake.io.getReview=async()=>{reviewCalls++;return reviewCalls===1?{commit_sha:'old',status:'completed'}:reviewCalls===2?{commit_sha:'new',status:'running'}:{commit_sha:'new',status:'completed'};};
 assert.equal((await waitForReadiness({phase:'preview',head:'new',reviewRequired:true},fake.io)).status,'READY');
 assert.equal(reviewCalls,3);assert.ok(fake.progress.some(p=>p.status==='WAITING_FOR_REVIEW'));
});
test('review receipts from a human, old head or malformed metadata do not authorize readiness',()=>{
 const comment=(login,type,head,status='completed')=>({user:{login,type},body:'<!-- codex-review-state:v1 '+JSON.stringify({code_review:{commit_sha:head,status}})+' -->'});
 const valid=comment('chatgpt-codex-connector[bot]','Bot','new');
 assert.equal(codexReviewState([comment('someone','User','new'),comment('chatgpt-codex-connector[bot]','Bot','old')],'new'),null);
 assert.equal(codexReviewState([valid],'new').status,'completed');
 assert.equal(codexReviewState([{...valid,body:'<!-- codex-review-state:v1 broken -->'}],'new'),null);
});
