// Read-only transition helper: no commits, pushes, merges or private-runtime writes.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function previewReadiness(pr, expectedHead) {
 if(pr.headRefOid!==expectedHead) throw Error('PR head changed; review and checks must restart');
 if(pr.state!=='OPEN'||pr.baseRefName!=='main') throw Error('Open main-bound PR required');
 const checks=pr.statusCheckRollup||[];
 const passed=check=>check.__typename==='CheckRun'?check.status==='COMPLETED'&&check.conclusion==='SUCCESS':check.state==='SUCCESS';
 if(checks.some(c=>['FAILURE','ERROR','CANCELLED','TIMED_OUT','ACTION_REQUIRED'].includes(c.conclusion||c.state))) throw Error('A PR check failed');
 return checks.some(c=>c.name==='verify'&&c.workflowName==='CI'&&passed(c))&&checks.some(c=>c.__typename==='StatusContext'&&c.context==='Vercel'&&passed(c))&&checks.every(c=>passed(c)||['NEUTRAL','SKIPPED'].includes(c.conclusion));
}
export function productionReadiness(pr, deployments, statuses) {
 if(pr.state!=='MERGED'||pr.baseRefName!=='main'||!pr.mergeCommit?.oid) throw Error('Merged main-bound PR required');
 const latest=deployments[0];if(!latest)return false;
 if(latest.sha!==pr.mergeCommit.oid) {
  if(Date.parse(latest.created_at)>Date.parse(pr.mergedAt))throw Error('Release superseded by another production SHA');
  return false;
 }
 if(latest.environment!=='Production')throw Error('Production deployment required');
 const status=statuses[0];if(!status)return false;
 if(['failure','error','inactive'].includes(status.state))throw Error('Production deployment failed or became inactive');
 return status.environment==='Production'&&status.state==='success';
}
// Read-only waiting logic; a provider backlog is pending, not a failed build.
export async function waitForReadiness(options, io) {
 const {phase,head,mergeSha,timeoutMs=30*60_000}=options;
 const {getPr,api,now,sleep,onProgress=async()=>{}}=io;
 const start=now(),deadline=start+timeoutMs;let acknowledged=false,lastStatus=null,interval=5000,lastPr;
 while(now()<deadline) {
  const pr=await getPr();lastPr=pr;let ready=false,status;
  if(pr.headRefOid!==head) {
   if(acknowledged||now()-start>=30_000)throw Error('PR head changed; review and checks must restart');
   status='WAITING_FOR_GITHUB_SNAPSHOT';
  } else {
   acknowledged=true;
   if(phase==='preview') {
    ready=previewReadiness(pr,head);
    const checks=pr.statusCheckRollup||[];
    const ci=checks.find(c=>c.name==='verify'&&c.workflowName==='CI');
    const provider=checks.find(c=>c.context==='Vercel');
    status=ci?.conclusion!=='SUCCESS'?'WAITING_FOR_CI':!provider?'WAITING_FOR_PROVIDER':provider.state!=='SUCCESS'?'WAITING_FOR_PROVIDER_BUILD':'WAITING_FOR_CHECKS';
   } else {
    if(pr.mergeCommit?.oid!==mergeSha)throw Error('PR merge identity changed');
    const deployments=await api('deployments?environment=Production&per_page=1');
    const statuses=deployments[0]?.sha===mergeSha?await api(`deployments/${deployments[0].id}/statuses?per_page=1`):[];
    ready=productionReadiness(pr,deployments,statuses);
    status=deployments[0]?.sha!==mergeSha?'WAITING_FOR_PROVIDER':'WAITING_FOR_PROVIDER_BUILD';
   }
  }
  if(ready)status='READY';
  if(status!==lastStatus) {
   interval=5000;lastStatus=status;await onProgress({status,elapsedMs:now()-start});
  }
  if(ready)return {status,pr,elapsedMs:now()-start};
  await sleep(Math.min(interval,Math.max(0,deadline-now())));
  interval=Math.min(interval*2,30_000);
 }
 return {status:lastStatus,pr:lastPr,elapsedMs:now()-start};
}

export async function platformIncidents(fetcher=fetch) {
 const providers=[['GitHub','https://www.githubstatus.com'],['Vercel','https://www.vercel-status.com']];
 return Promise.all(providers.map(async([provider,base])=>{
  try {
   const response=await fetcher(base+'/api/v2/incidents/unresolved.json',{signal:AbortSignal.timeout(3000)});
   if(!response.ok)throw Error('status unavailable');
   const data=await response.json();if(!Array.isArray(data.incidents))throw Error('invalid status data');
   return {provider,availability:'AVAILABLE',incidents:data.incidents.slice(0,5).map(i=>({id:String(i.id).slice(0,80),name:String(i.name).slice(0,200),status:String(i.status).slice(0,40),url:base+'/incidents/'+encodeURIComponent(i.id)}))};
  } catch {return {provider,availability:'UNKNOWN',incidents:[]};}
 }));
}

async function main() {
 const args=process.argv.slice(2);
 if(![3,5].includes(args.length)||!['--preview','--production'].includes(args[0])||args[1]!=='--pr'||!/^[1-9][0-9]*$/.test(args[2])||
    (args.length===5&&(args[3]!=='--timeout-minutes'||!/^([1-9]|[1-5][0-9]|60)$/.test(args[4]))))throw Error('Expected --preview|--production --pr <number> [--timeout-minutes 1..60]');
 const phase=args[0].slice(2),prNumber=Number(args[2]),timeoutMs=Number(args[4]||30)*60_000;
 const gh=(...args)=>JSON.parse(execFileSync('gh',args,{encoding:'utf8',timeout:20_000,maxBuffer:2*1024*1024,stdio:['ignore','pipe','pipe']}));
 const api=endpoint=>gh('api','--hostname','github.com','--method','GET','repos/markoblogo/ABVXsite/'+endpoint);
 const getPr=()=>gh('pr','view',String(prNumber),'--repo','markoblogo/ABVXsite','--json','state,headRefOid,mergeCommit,statusCheckRollup,baseRefName,mergedAt');
 const initial=getPr();
 const local=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const dirty=execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim();
 if(dirty)throw Error('Clean committed checkout required before release readiness');
 const head=phase==='preview'?local:initial.headRefOid,mergeSha=phase==='production'?initial.mergeCommit?.oid:null;
 if(phase==='production'&&local!==mergeSha)throw Error('Clean checkout of exact merge SHA required before production verification');
 const directory='exports/editorial-checks';mkdirSync(directory,{recursive:true});
 const journal=`${directory}/release-${prNumber}-${phase}.json`;
 let previous;
 try {previous=JSON.parse(readFileSync(journal,'utf8'));}catch {previous=null;}
 const compatible=previous?.head===head&&previous?.mergeSha===mergeSha&&previous?.pr===prNumber&&Number.isFinite(Date.parse(previous.startedAt));
 const startedAt=compatible?previous.startedAt:new Date().toISOString();
 const state={phase,pr:prNumber,head,mergeSha,startedAt,attemptStartedAt:new Date().toISOString(),status:'WAITING',retryable:true};
 const save=patch=>{Object.assign(state,patch,{updatedAt:new Date().toISOString(),elapsedMs:Date.now()-Date.parse(startedAt)});writeFileSync(journal,JSON.stringify(state,null,2)+'\n');};
 let platformChecked=false;
 try {
  const result=await waitForReadiness({phase,head,mergeSha,timeoutMs},{getPr,api,now:Date.now,sleep:ms=>new Promise(resolve=>setTimeout(resolve,ms)),onProgress:async progress=>{
   save(progress);console.log(`${phase}: ${progress.status} (${Math.round(state.elapsedMs/1000)}s elapsed)`);
   if(progress.status.startsWith('WAITING_FOR_PROVIDER')&&!platformChecked) {
    platformChecked=true;const platforms=await platformIncidents();save({platforms});
    for(const platform of platforms)for(const incident of platform.incidents)console.log(`${platform.provider} incident: ${incident.name} (${incident.url})`);
   }
  }});
  if(result.status!=='READY') {
   save({status:result.status,retryable:true});
   console.log('Release remains pending; resume the same PR/cycle. Do not rebuild, republish, or abort the publication cycle for this wait.');
   process.exitCode=2;return;
  }
  if(phase==='production') {
   save({status:'VERIFYING_PRODUCTION',retryable:false});
   const base=execFileSync('git',['rev-parse',mergeSha+'^1'],{encoding:'utf8'}).trim();
   const checked=spawnSync('npm',['run','content:production-check','--','--base',base],{stdio:'inherit',timeout:5*60_000});
   if(checked.status!==0)throw Error('Production QA failed');
   const latest=api('deployments?environment=Production&per_page=1');
   if(!productionReadiness(result.pr,latest,latest[0]?.sha===mergeSha?api(`deployments/${latest[0].id}/statuses?per_page=1`):[]))throw Error('Production changed during QA');
  }
  const completedAt=new Date().toISOString(),status=phase==='preview'?'READY_FOR_REVIEW':'PRODUCTION_QA_PASS';
  save({status,completedAt,retryable:false});
  writeFileSync(`${directory}/${phase}-ready.json`,JSON.stringify(state,null,2)+'\n');
  console.log(phase==='preview'?'CI and Vercel Preview passed. Review feedback before the authorized merge.':'Production SHA and QA passed. Close the existing OS cycle immediately; Cortex transfer can retry independently.');
 } catch(error) {save({status:'FAILED',retryable:false,error:error.message});throw error;}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])await main();
