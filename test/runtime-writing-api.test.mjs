import test from 'node:test';
import assert from 'node:assert/strict';
import {createWritingHandler} from '../src/content/runtime-writing-api.mjs';
import {createMediaPreparer} from '../src/content/runtime-writing-media.mjs';
import {emptySnapshot,digest} from '../src/content/runtime-writing.mjs';
const token='x'.repeat(40);
const source=(image={})=>'---\n'+JSON.stringify({id:'new',slug:'new',title:'Approved title',summary:'Summary',primarySection:'writing',type:'article',status:'live',visibility:'public',publishedAt:'2026-10-26',tags:[],links:[],...image})+'\n---\n\nAuthor text.\n';
function store(){let snapshot=emptySnapshot(),etag='0';return {load:async()=>({snapshot:structuredClone(snapshot),etag}),commit:async next=>{snapshot=structuredClone(next);etag+='1';},putAsset:async()=>{}};}
const request=(command,secret=token)=>new Request('http://localhost/api/writing/manage',{method:'POST',headers:{authorization:'Bearer '+secret,'content-type':'application/json'},body:JSON.stringify(command)});
test('machine API requires authentication and accepted source binding; storage success is not publication proof',async()=>{
 const handler=createWritingHandler({store:store(),token,enabled:true});
 assert.equal((await handler(request({action:'publish'},'wrong'))).status,401);
 assert.equal((await handler(request({action:'publish',requestId:'missing-approval',source:source()}))).status,400);
 const result=await handler(request({action:'publish',requestId:'accepted',source:source(),approval:{intakeId:'intake-1',sourceSha256:digest(source())}}));
 assert.equal(result.status,200);const receipt=await result.json();assert.equal(receipt.status,'STORED');assert.equal(receipt.approval.intakeId,'intake-1');
});
test('approved image mapping preserves prose; invalid bytes and unreferenced uploads are rejected',async()=>{
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1sAAAAASUVORK5CYII=','base64');
 const input=source({media:{src:'/media/new.png',alt:'Author photo',width:1,height:1}}),asset={target:'/media/new.png',sha256:digest(bytes),bytesBase64:bytes.toString('base64')};
 const state=emptySnapshot(),prepare=createMediaPreparer(store());const result=await prepare(input,[asset],state);
 assert.ok(result.source.includes('/media/writing/runtime/'+asset.sha256+'.png'));assert.ok(result.source.endsWith('Author text.\n'));
 await assert.rejects(prepare(input,[{...asset,bytesBase64:Buffer.from('not an image').toString('base64')}],emptySnapshot()));
 await assert.rejects(prepare(source(),[asset],emptySnapshot()));
});
test('disabled/missing credentials fail closed and oversized requests cannot reach storage',async()=>{
 let loads=0;const backend={load:async()=>{loads++;throw Error('must not reach store');}};
 const disabled=createWritingHandler({store:backend,token,enabled:false});
 assert.equal((await disabled(request({}))).status,503);
 const handler=createWritingHandler({store:backend,token,enabled:true});
 assert.equal((await handler(request({source:'x'.repeat(4_000_001)}))).status,400);
 assert.equal(loads,0);
});
test('a retry retains the original engine context, and local storage cannot be mistaken for Production',async()=>{
 const backend=store();const sourceText=source();const cmd={action:'publish',requestId:'original-context',source:sourceText,approval:{intakeId:'one',sourceSha256:digest(sourceText)}};
 const first=await (await createWritingHandler({store:backend,token,enabled:true,engineVersion:'first'})(request(cmd))).json();
 const retried=await (await createWritingHandler({store:backend,token,enabled:true,engineVersion:'second'})(request(cmd))).json();
 assert.deepEqual(retried,first);assert.equal(first.deploymentEnvironment,'local');assert.equal(first.deploymentSha,null);
});
