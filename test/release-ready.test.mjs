import test from 'node:test';
import assert from 'node:assert/strict';
import { previewReadiness, productionReadiness } from '../scripts/release-ready.mjs';
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
