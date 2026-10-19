// Private checkpoint ledger, not a Google client. Observations come from GSC UI
// or an already authorized donor. Public source discovery uses the deployed index.
import {readFileSync,writeFileSync,mkdirSync,existsSync,renameSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const horizons=[7,14,28];
function date(value) {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw Error('Valid YYYY-MM-DD required');
 return value;
}
function addDays(value,days) {return new Date(Date.parse(date(value)) + days*86400000).toISOString().slice(0,10);}
function publicSource(item) {
 try {const u=new URL(item.canonicalUrl);return u.origin==='https://abvx.xyz'&&!u.username&&!u.password&&!u.search&&!u.hash&&!u.pathname.startsWith('/writing/videos/');}catch{return false;}
}
function validateState(state) {
 if(state.schemaVersion!==1||!Array.isArray(state.seenUrls)||!state.items||typeof state.items!=='object')throw Error('Unsupported or damaged follow-up ledger');
 return state;
}
export function syncFollowUps(index,previous,today,since=today) {
 date(today);date(since);
 if(!index||!Array.isArray(index.items))throw Error('Public content index required');
 if(index.items.some(item=>item.type==='writing'&&!Object.hasOwn(item,'publishedAt')))throw Error('Live index lacks publication dates; wait for the current deployment');
 const initial=!previous;
 const state=previous?structuredClone(validateState(previous)):{schemaVersion:1,enrolledSince:since,seenUrls:[],items:{}};
 const seen=new Set(state.seenUrls);
 for(const item of index.items.filter(publicSource)) {
  const url=item.canonicalUrl;
  if(seen.has(url))continue;
  const publishedAt=typeof item.publishedAt==='string'?item.publishedAt.slice(0,10):null;
  if(publishedAt)date(publishedAt);
  if(publishedAt&&publishedAt>today)continue;
  seen.add(url);
  if(initial&&(!publishedAt||publishedAt<since))continue;
  state.items[url]={url,title:item.title,publishedAt,firstObservedDate:today,
   anchorDate:initial?publishedAt:today,anchorBasis:initial?'source-published-date':'first-observed-in-live-index',checkpoints:{}};
 }
 state.seenUrls=[...seen].sort();state.lastSyncedDate=today;return state;
}
export function dueFollowUps(state,today,limit=10) {
 validateState(state);date(today);
 if(!Number.isSafeInteger(limit)||limit<1)throw Error('Positive limit required');
 return Object.values(state.items).flatMap(item=>{
  const day=horizons.find(day=>addDays(item.anchorDate,day)<=today&&item.checkpoints[day]?.status!=='observed');
  return day?[{url:item.url,title:item.title,day,dueDate:addDays(item.anchorDate,day),anchorDate:item.anchorDate,anchorBasis:item.anchorBasis}]:[];
 }).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.url.localeCompare(b.url)).slice(0,limit);
}
export function recordFollowUp(state,url,day,observation,observedAt=new Date().toISOString()) {
 validateState(state);
 if(!state.items[url]||!horizons.includes(day)||!Number.isFinite(Date.parse(observedAt)))throw Error('Known URL, checkpoint and observation timestamp required');
 const item=state.items[url];
 if(observedAt.slice(0,10)<addDays(item.anchorDate,day))throw Error('Checkpoint is not due');
 if(item.checkpoints[day]?.status==='observed')throw Error('Completed checkpoints are immutable');
 if(!['observed','access_failed','data_pending'].includes(observation.status))throw Error('Explicit observation status required');
 for(const key of ['discovered','indexed'])if(![true,false,null].includes(observation[key]))throw Error('Boolean or null required: '+key);
 for(const key of ['impressions','clicks'])if(observation[key]!==null&&(!Number.isSafeInteger(observation[key])||observation[key]<0))throw Error('Non-negative count or null required: '+key);
 for(const key of ['lastCrawlAt','dataThrough','firstImpressionDate'])if(observation[key]!==null&&(typeof observation[key]!=='string'||!Number.isFinite(Date.parse(observation[key]))))throw Error('Date or null required: '+key);
 if(!Array.isArray(observation.evidence)||!observation.evidence.length||observation.evidence.some(v=>typeof v!=='string'||!v.trim()))throw Error('Source evidence required');
 if(observation.indexed===true&&observation.discovered!==true)throw Error('Indexed URL must be discovered');
 const checkpoint=item.checkpoints[day]||{attempts:[]};
 checkpoint.attempts.push({...structuredClone(observation),observedAt});
 // Missing source access or delayed data remains due; never turn UNKNOWN into 0.
 checkpoint.status=observation.status==='observed'&&(observation.indexed===null||observation.impressions===null||observation.dataThrough===null||observation.dataThrough.slice(0,10)<addDays(item.anchorDate,day))?'data_pending':observation.status;
 item.checkpoints[day]=checkpoint;return state;
}
function save(file,state) {
 mkdirSync(path.dirname(file),{recursive:true});
 const temporary=file+'.tmp';writeFileSync(temporary,JSON.stringify(state,null,2)+'\n');renameSync(temporary,file);
}
async function main() {
 const args=process.argv.slice(2);const mode=args.shift();const options={};
 for(let i=0;i<args.length;i++){if(args[i]==='--live'){options.live=true;continue;}if(!['--index','--state','--today','--since','--limit','--url','--day','--observation'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw Error('Unknown or incomplete argument');options[args[i].slice(2)]=args[++i];}
 if(!['sync','due','record'].includes(mode))throw Error('Expected sync, due or record');
 const file=path.resolve(options.state||'exports/publication-followup/state.json');
 const today=options.today||new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris'}).format(new Date());
 let state=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):null;
 if(mode==='sync') {
  if(Boolean(options.live)===Boolean(options.index))throw Error('Choose exactly one: --live or --index <snapshot>');
  let index;
  if(options.live){const response=await fetch('https://abvx.xyz/content-index.json',{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Live index unavailable: '+response.status);index=await response.json();}
  else index=JSON.parse(readFileSync(options.index,'utf8'));
  state=syncFollowUps(index,state,today,options.since||today);save(file,state);
 }else if(!state)throw Error('Initialize from a live index first');
 if(mode==='record'){recordFollowUp(state,options.url,Number(options.day),JSON.parse(readFileSync(options.observation,'utf8')));save(file,state);}
 console.log(JSON.stringify({tracked:Object.keys(state.items).length,due:dueFollowUps(state,today,Number(options.limit||10))},null,2));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1]))await main();
