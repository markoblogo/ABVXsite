import {parseMarkdownSource} from './markdown-source.mjs';
import {createHash,timingSafeEqual} from 'node:crypto';
import {createPublisher,digest,ConflictError,ValidationError} from './runtime-writing.mjs';
import {createMediaPreparer} from './runtime-writing-media.mjs';
const hash=value=>createHash('sha256').update(value).digest();
const headers={'Cache-Control':'no-store','Content-Type':'application/json'};
const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
async function boundedJson(request){
 const reader=request.body?.getReader();if(!reader)throw new ValidationError('JSON body required');let size=0;const chunks=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4_000_000){await reader.cancel();throw new ValidationError('Request exceeds 4 MB');}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
 try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw new ValidationError('Invalid JSON');}
}
export function createWritingHandler({store,token,enabled,projectIndex,legacySources=/** @type {string[]} */([]),engineVersion=process.env.VERCEL_GIT_COMMIT_SHA||'development'}){
 const context={engineVersion,deploymentEnvironment:process.env.VERCEL_ENV||'local',deploymentSha:process.env.VERCEL_GIT_COMMIT_SHA||null};
 const publish=createPublisher({store,context,legacySources,prepareMedia:createMediaPreparer(store)});
 return async request=>{
  if(!enabled||typeof token!=='string'||token.length<32)return response({error:'Runtime publisher is not enabled'},503);
  const supplied=request.headers.get('authorization')||'';
  if(!timingSafeEqual(hash(supplied),hash('Bearer '+token)))return response({error:'Unauthorized'},401);
  try{
   if(request.method==='GET'){
    const {snapshot}=await store.load();
    if(new URL(request.url).searchParams.get('export')==='1')return response({schemaVersion:1,authority:'RUNTIME_WRITING_ENABLED',...context,snapshot,legacySources:legacySources.filter(source=>!Object.hasOwn(snapshot.records,parseMarkdownSource(source).data.slug)),...(projectIndex?{publicIndex:projectIndex(snapshot)}:{})});
    return response({engineVersion,snapshotRevision:snapshot.revision,records:Object.fromEntries(Object.entries(snapshot.records).map(([id,r])=>[id,{revision:r.currentRevision,firstPublishedAt:r.firstPublishedAt,sourceSha256:r.versions[r.currentRevision].sourceSha256,withdrawn:r.versions[r.currentRevision].withdrawn}]))});
   }
   if(request.method!=='POST')return response({error:'Method not allowed'},405);
   if(!request.headers.get('content-type')?.startsWith('application/json'))throw new ValidationError('application/json required');
   const command=await boundedJson(request);
   if(['publish','update'].includes(command.action)&&(!command.approval?.intakeId||command.approval.sourceSha256!==digest(command.source||'')))throw new ValidationError('Accepted intake and exact source hash required');
   const receipt=await publish(command);return response(receipt);
  }catch(error){
   if(error instanceof ConflictError)return response({error:error.message},409);
   if(error instanceof ValidationError||error instanceof SyntaxError||error instanceof TypeError||error instanceof RangeError)return response({error:error.message},400);
   // Never reflect provider errors, credentials, paths or private store internals.
   return response({error:'Writing storage unavailable; retain requestId and retry'},503);
  }
 };
}
