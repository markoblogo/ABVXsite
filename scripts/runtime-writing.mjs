#!/usr/bin/env node
// Content-only operator: no Git, shell, deploy or account-setting capability.
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseMarkdownSource} from '../src/content/markdown-source.mjs';
import {parseAcceptedSource,seedSnapshot,digest} from '../src/content/runtime-writing.mjs';
import {configuredWritingStore} from '../src/content/runtime-writing-store.mjs';
export function commandFromPacket(packet,{action='publish',requestId,expectedRevision}={}){
 const source=packet.payload?.source_markdown;
 if(packet.schema_version!=='v1'||packet.mode!=='REPORT_ONLY_HANDOFF'||packet.project!=='abvxsite'||packet.surface!=='writing'||packet.consumer_operation?.id!=='abvx.publish-writing'||!packet.item_id||typeof source!=='string'||digest(source)!==packet.payload.source_sha256)throw Error('Exact approved native Writing packet required');
 const {data,body}=parseAcceptedSource(source);
 if(data.id!==packet.slug||data.title!==packet.title||data.type!==packet.kind||data.publishedAt!==packet.payload.date_published||(data.language||'en')!==(packet.payload.language||'en')||body!==packet.payload.body_lines?.join('\n\n'))throw Error('Packet and accepted source differ');
 const assets=(packet.payload.media_assets||[]).map(asset=>{
  if(!isAbsolute(asset.source))throw Error('Absolute approved image source required');const bytes=readFileSync(asset.source);
  if(digest(bytes)!==asset.sha256)throw Error('Approved image bytes changed');
  return {target:asset.target,sha256:asset.sha256,bytesBase64:bytes.toString('base64')};
 });
 return {action,requestId,expectedRevision,source,assets,approval:{intakeId:packet.item_id,sourceSha256:digest(source)}};
}
function save(path,value){mkdirSync(dirname(resolve(path)),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{mode:0o600});}
async function main(){
 const [operation,...argv]=process.argv.slice(2);const args={};
 for(let i=0;i<argv.length;i++){const key=argv[i];if(!key.startsWith('--'))throw Error('Unknown argument');args[key.slice(2)]=['write','initialize'].includes(key.slice(2))?true:argv[++i];}
 if(operation==='seed'){
  if(!args.initialize)throw Error('seed requires --initialize; never replaces a live archive');
  const sources=readdirSync('content/writing').filter(x=>x.endsWith('.md')&&!x.startsWith('_')).map(x=>readFileSync('content/writing/'+x,'utf8')).filter(source=>!['private','draft'].includes(parseMarkdownSource(source).data.visibility));
  const snapshot=seedSnapshot(sources);await configuredWritingStore().initialize(snapshot);
  console.log(JSON.stringify({status:'INITIALIZED',count:sources.length,sourceDigest:digest(JSON.stringify(sources)),snapshotRevision:snapshot.revision}));return;
 }
 const base=args.base||'https://abvx.xyz',url=new URL(base);
 if(url.origin!=='https://abvx.xyz'&&!['localhost','127.0.0.1'].includes(url.hostname))throw Error('Only ABVX Production or an isolated localhost endpoint is allowed');
 if(!process.env.RUNTIME_WRITING_PUBLISH_TOKEN&&(args.write||['status','export'].includes(operation)))throw Error('Operator token missing');
 const headers={authorization:'Bearer '+process.env.RUNTIME_WRITING_PUBLISH_TOKEN,'content-type':'application/json'};
 if(['status','export'].includes(operation)){
  const res=await fetch(new URL('/api/writing/manage'+(operation==='export'?'?export=1':''),base),{headers,signal:AbortSignal.timeout(30_000)});if(!res.ok)throw Error('Content status/export failed: '+res.status);const data=await res.json();
  if(operation==='export'){if(!args.output)throw Error('Private --output path required');save(args.output,data);console.log(JSON.stringify({status:'EXPORTED',snapshotRevision:data.snapshot.revision}));}else console.log(JSON.stringify(data,null,2));return;
 }
 let command;
 if(['publish','update'].includes(operation))command=commandFromPacket(JSON.parse(readFileSync(args.packet,'utf8')),{action:operation,requestId:args['request-id'],expectedRevision:args['expected-revision']});
 else if(['rollback','unpublish'].includes(operation))command={action:operation,requestId:args['request-id'],id:args.id,expectedRevision:args['expected-revision'],toRevision:args['to-revision']};else throw Error('Use seed, status, export, publish, update, rollback or unpublish');
 if(!command.requestId||operation!=='publish'&&!command.expectedRevision)throw Error('Stable --request-id and current --expected-revision required');
 if(Buffer.byteLength(JSON.stringify(command))>4_000_000)throw Error('Prepared request exceeds 4 MB; use smaller approved web derivatives');
 if(!args.write){console.log(JSON.stringify({status:'DRY_RUN',action:operation,requestId:command.requestId,sourceSha256:command.source?digest(command.source):null,images:command.assets?.length||0}));return;}
 if(!args.output)throw Error('Private --output receipt required before write');
 // Save the exact retry command BEFORE transmission. An ambiguous response must reuse it.
 save(args.output+'.request.json',command);
 const res=await fetch(new URL('/api/writing/manage',base),{method:'POST',headers,body:JSON.stringify(command),signal:AbortSignal.timeout(60_000)});
 const receipt=await res.json();save(args.output,receipt);if(!res.ok)throw Error('Content write failed: '+res.status+' '+receipt.error);
 try{const snapshot=await fetch(new URL('/api/writing/manage?export=1',base),{headers,signal:AbortSignal.timeout(30_000)});if(!snapshot.ok)throw Error('Source export unavailable');save(args.output+'.export.json',await snapshot.json());}catch{console.error('Content stored; inventory export pending. Resume export, never repeat publication with a new requestId.');}
 console.log(JSON.stringify({status:receipt.status,canonicalUrl:receipt.canonicalUrl,revision:receipt.revision,engineVersion:receipt.engineVersion,verification:'OWNER_OPTIONAL'}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
