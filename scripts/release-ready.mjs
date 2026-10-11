// Read-only transition helper: no commits, pushes, merges or private-runtime writes.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
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
async function main() {
 const args=process.argv.slice(2);
 if(args.length!==3||!['--preview','--production'].includes(args[0])||args[1]!=='--pr'||!/^[1-9][0-9]*$/.test(args[2]))throw Error('Expected --preview|--production --pr <number>');
 const phase=args[0].slice(2),started=Date.now(),deadline=started+10*60_000;
 const gh=(...args)=>JSON.parse(execFileSync('gh',args,{encoding:'utf8',timeout:20_000,maxBuffer:2*1024*1024,stdio:['ignore','pipe','pipe']}));
 const api=endpoint=>gh('api','--hostname','github.com','--method','GET','repos/markoblogo/ABVXsite/'+endpoint);
 const getPr=()=>gh('pr','view',args[2],'--repo','markoblogo/ABVXsite','--json','state,headRefOid,mergeCommit,statusCheckRollup,baseRefName,mergedAt');
 const initial=getPr(),head=initial.headRefOid;
 if(phase==='production') {
  const local=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const dirty=execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim();
  if(dirty||local!==initial.mergeCommit?.oid)throw Error('Clean checkout of exact merge SHA required before production verification');
 }
 while(Date.now()<deadline) {
  const pr=getPr();let ready;
  if(phase==='preview')ready=previewReadiness(pr,head);
  else {
   if(pr.headRefOid!==head||pr.mergeCommit?.oid!==initial.mergeCommit?.oid)throw Error('PR identity changed');
   const deployments=api('deployments?environment=Production&per_page=1');
   const statuses=deployments[0]?.sha===pr.mergeCommit.oid?api(`deployments/${deployments[0].id}/statuses?per_page=1`):[];
   ready=productionReadiness(pr,deployments,statuses);
  }
  if(ready) {
   if(phase==='production') {
    const base=execFileSync('git',['rev-parse',pr.mergeCommit.oid+'^1'],{encoding:'utf8'}).trim();
    const result=spawnSync('npm',['run','content:production-check','--','--base',base],{stdio:'inherit',timeout:5*60_000});
    if(result.status!==0)throw Error('Production QA failed');
    // A rollout that overtakes QA must not qualify this release.
    const latest=api('deployments?environment=Production&per_page=1');
    if(!productionReadiness(pr,latest,latest[0]?.sha===pr.mergeCommit.oid?api(`deployments/${latest[0].id}/statuses?per_page=1`):[]))throw Error('Production changed during QA');
   }
   mkdirSync('exports/editorial-checks',{recursive:true});
   writeFileSync(`exports/editorial-checks/${phase}-ready.json`,JSON.stringify({phase,pr:Number(args[2]),head,mergeSha:pr.mergeCommit?.oid||null,completedAt:new Date().toISOString(),elapsedMs:Date.now()-started,status:phase==='preview'?'READY_FOR_REVIEW':'PRODUCTION_QA_PASS'},null,2)+'\n');
   console.log(phase==='preview'?'CI and Vercel Preview passed. Review feedback before the authorized merge.':'Production SHA and QA passed. Close the existing OS cycle immediately; Cortex transfer can retry independently.');return;
  }
  await new Promise(resolve=>setTimeout(resolve,5_000));
 }
 throw Error('Timed out after 10 minutes; resume with the same PR/cycle, without republishing');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])await main();
