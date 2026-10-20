// This clock invokes the existing bounded importer; it never writes site content.
const workflow='https://api.github.com/repos/markoblogo/ABVXsite/actions/workflows/writing-feed-sync.yml';
const minute=60000;
const activeStatuses=new Set(['queued','in_progress','waiting','pending','requested']);

export async function ensureWritingSync(env,{fetchImpl=fetch,now=Date.now()}={}) {
 if(env.ENABLED!=='true')return {action:'disabled'};
 if(typeof env.GITHUB_DISPATCH_TOKEN!=='string'||!env.GITHUB_DISPATCH_TOKEN.trim())throw Error('GITHUB_DISPATCH_TOKEN is required');
 if(!Number.isFinite(now))throw Error('Valid observation time required');
 const headers={Accept:'application/vnd.github+json',Authorization:'Bearer '+env.GITHUB_DISPATCH_TOKEN,
  'User-Agent':'abvx-writing-sync-backup','X-GitHub-Api-Version':'2026-03-10','Content-Type':'application/json'};
 const request=(url,options={})=>fetchImpl(url,{headers,redirect:'error',signal:AbortSignal.timeout(10000),...options});
 const response=await request(workflow+'/runs?branch=main&per_page=20');
 if(!response.ok)throw Error('GitHub run lookup failed: HTTP '+response.status);
 const data=await response.json();
 if(!Array.isArray(data.workflow_runs))throw Error('Invalid GitHub workflow run response');
 const runs=data.workflow_runs.filter(run=>run.head_branch==='main'&&['schedule','workflow_dispatch'].includes(run.event));
 const active=runs.find(run=>activeStatuses.has(run.status));
 if(active) {
  const age=now-Date.parse(active.created_at);
  if(!Number.isFinite(age)||age < -minute)throw Error('Invalid active sync timestamp');
  if(age>30*minute)throw Error('Writing sync is stuck for over 30 minutes; inspect the existing run');
  return {action:'active'};
 }
 for(const run of runs.filter(run=>run.status==='completed'&&run.conclusion==='success')) {
  // A delayed completion must not make a long-ago feed check look fresh.
  const age=now-Date.parse(run.created_at);
  if(!Number.isFinite(age)||age < -minute)throw Error('Invalid completed sync timestamp');
  if(age<=12*minute)return {action:'fresh'};
 }
 const result=await request(workflow+'/dispatches',{method:'POST',body:JSON.stringify({ref:'main'})});
 if(![200,204].includes(result.status))throw Error('GitHub workflow dispatch failed: HTTP '+result.status);
 return {action:'dispatched'};
}

export default {
 async scheduled(controller,env) {
  const result=await ensureWritingSync(env);
  console.log(JSON.stringify({event:'writing-sync-backup',scheduledAt:controller.scheduledTime,observedAt:Date.now(),...result}));
 },
};
