// Isolated post-build acceptance. Never sends synthetic content to ABVX Production.
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {createFileStore} from '../src/content/runtime-writing-store.mjs';
import {seedSnapshot,digest} from '../src/content/runtime-writing.mjs';
import {verifyRuntimeWriting} from './runtime-writing-verify.mjs';
import {readdirSync,readFileSync} from 'node:fs';
const directory=await mkdtemp(join(tmpdir(),'abvx-runtime-smoke-')),base='http://127.0.0.1:3391';
const token=randomBytes(32).toString('hex'),before=readFileSync('.next/BUILD_ID','utf8');
process.env.RUNTIME_WRITING_PUBLISH_TOKEN=token;
const store=createFileStore(directory);
const sources=readdirSync('content/writing').filter(x=>x.endsWith('.md')&&!x.startsWith('_')).map(x=>readFileSync('content/writing/'+x,'utf8'));
await store.initialize(seedSnapshot(sources));
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3391'],{env:{...process.env,RUNTIME_WRITING_ENABLED:'1',RUNTIME_WRITING_BACKEND:'file',RUNTIME_WRITING_DIR:directory},stdio:['ignore','pipe','pipe']});
let serverLog='';server.stdout.on('data',b=>serverLog+=b);server.stderr.on('data',b=>serverLog+=b);
const headers={authorization:'Bearer '+token,'content-type':'application/json'};
const send=async command=>{const res=await fetch(base+'/api/writing/manage',{method:'POST',headers,body:JSON.stringify(command)});return {code:res.status,value:await res.json()};};
try{
 for(let i=0;i<100;i++){try{if((await fetch(base+'/api/writing/manage',{headers})).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));if(i===99)throw Error('QA server did not start');}
 assert.equal((await fetch(base+'/writing/runtime-acceptance-new-post')).status,404,'new slug absent after build');
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1sAAAAASUVORK5CYII=','base64');
 const source=body=>'---\n'+JSON.stringify({id:'runtime-acceptance-new-post',slug:'runtime-acceptance-new-post',title:'Runtime Acceptance New Post',summary:'Isolated verification article',type:'article',collection:'kitchen-notes',primarySection:'writing',status:'live',visibility:'public',publishedAt:'2026-10-26',tags:[],links:[],media:{src:'/media/synthetic.png',alt:'Isolated pixel',width:1,height:1}})+'\n---\n\n'+body+'\n';
 const initial=source('This isolated paragraph proves that a new slug works without rebuilding.');
 const command={action:'publish',requestId:'acceptance-publish',source:initial,assets:[{target:'/media/synthetic.png',sha256:digest(bytes),bytesBase64:bytes.toString('base64')}],approval:{intakeId:'synthetic-acceptance',sourceSha256:digest(initial)}};
 const result=await send(command);assert.equal(result.code,200,JSON.stringify(result.value));
 assert.deepEqual(await send(command),result,'exact retry');
 const verified=await verifyRuntimeWriting({base,receipt:result.value,command});
 assert.equal(verified.status,'TEST_VERIFIED');
 const homepage=await (await fetch(base+'/')).text(),imagePath=result.value.mediaMapping[0].to;
 const runtimeImages=[...homepage.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(match=>match[1]).filter(src=>decodeURIComponent(src).includes('/media/writing/runtime/'));
 assert.ok(runtimeImages.includes(imagePath),'homepage runtime cover must use its authoritative media path');
 assert.ok(!runtimeImages.some(src=>src.startsWith('/_next/image')),'homepage runtime images must bypass persistent optimization');
 assert.ok((await (await fetch(base+'/writing/kitchen-notes')).text()).includes('/writing/runtime-acceptance-new-post'));
 const nextSource=source('This revised paragraph replaces the original without a deployment.');
 const update={...command,action:'update',requestId:'acceptance-update',expectedRevision:result.value.revision,source:nextSource,approval:{intakeId:'synthetic-update',sourceSha256:digest(nextSource)}};
 const second=await send(update);assert.equal(second.code,200);await verifyRuntimeWriting({base,receipt:second.value,command:update});
 assert.equal((await send({...update,requestId:'stale-writer'})).code,409);
 const rolled=await send({action:'rollback',requestId:'acceptance-rollback',id:result.value.id,expectedRevision:second.value.revision,toRevision:result.value.revision});assert.equal(rolled.code,200);
 assert.equal(rolled.value.sourceSha256,result.value.sourceSha256);
 const withdrawn=await send({action:'unpublish',requestId:'acceptance-unpublish',id:result.value.id,expectedRevision:rolled.value.revision});assert.equal(withdrawn.code,200);
 assert.equal((await fetch(base+'/writing/runtime-acceptance-new-post')).status,404);
 for(const path of ['/content-index.json','/sitemap.xml','/llms.txt','/writing/archive','/writing/kitchen-notes'])assert.ok(!(await (await fetch(base+path)).text()).includes('https://abvx.xyz/writing/runtime-acceptance-new-post'),path+' withdrawn');
 assert.equal((await fetch(base+result.value.mediaMapping[0].to)).status,404,'unreferenced image hidden');
 await rm(join(directory,'head.json'));assert.equal((await fetch(base+'/content-index.json')).status,503,'no stale Git fallback');
 assert.equal(readFileSync('.next/BUILD_ID','utf8'),before,'no rebuild');
 const proof={status:'PASS',environment:'ISOLATED_LOCAL',newSlugAfterBuild:true,publishUpdateRollbackWithdrawal:true,idempotencyConflict:true,mediaDiscoverySearchMobile:true,storeFailureClosed:true,buildId:before.trim(),observedAt:new Date().toISOString()};
 await writeFile('exports/runtime-writing-implementation/post-build-acceptance.json',JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof));
}catch(error){await writeFile('exports/runtime-writing-implementation/smoke-server.log',serverLog);throw error;}
finally{server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));await rm(directory,{recursive:true,force:true});}
