import test from 'node:test';
import assert from 'node:assert/strict';
import {createPublisher, emptySnapshot, ConflictError} from '../src/content/runtime-writing.mjs';
const source=(slug,body='Accepted author text.')=>'---\n'+JSON.stringify({id:slug,slug,title:'Accepted title',summary:'Summary',type:'article',primarySection:'writing',appearsIn:['writing'],status:'live',visibility:'public',language:'en',publishedAt:'2026-10-26',updatedAt:'2026-10-26',tags:[],links:[]})+'\n---\n\n'+body+'\n';
function memoryStore(){let state=emptySnapshot(),etag='0';return {load:async()=>({snapshot:structuredClone(state),etag}),commit:async(next,expected)=>{if(expected!==etag)throw new ConflictError('Concurrent update');state=structuredClone(next);etag=String(Number(etag)+1);},state:()=>structuredClone(state)};}
test('one accepted publication persists without a Git checkout and a retry is idempotent',async()=>{
 const store=memoryStore(),publish=createPublisher({store,now:()=>new Date('2026-10-26T14:00:00Z')});
 const command={action:'publish',requestId:'request-1',source:source('new-post'),assets:[]};
 const first=await publish(command);assert.equal(first.canonicalUrl,'https://abvx.xyz/writing/new-post');assert.equal(first.status,'STORED');assert.ok(first.sourceSha256);assert.equal(store.state().records['new-post'].currentRevision,first.revision);
 assert.deepEqual(await publish(command),first);assert.equal(Object.keys(store.state().requests).length,1);
 await assert.rejects(publish({...command,source:source('new-post','Changed bytes.')}),ConflictError);
});

test('updates preserve first publication and stale writers cannot overwrite; rollback and withdrawal are versioned',async()=>{
 const store=memoryStore(),publish=createPublisher({store,now:()=>new Date('2026-10-26T14:00:00Z')});
 const first=await publish({action:'publish',requestId:'first',source:source('sample')});
 const second=await publish({action:'update',requestId:'second',expectedRevision:first.revision,source:source('sample','Revised accepted text.')});
 await assert.rejects(publish({action:'update',requestId:'stale',expectedRevision:first.revision,source:source('sample','Stale copy.')}),ConflictError);
 const rolled=await publish({action:'rollback',requestId:'rollback',id:'sample',expectedRevision:second.revision,toRevision:first.revision});
 assert.equal(rolled.sourceSha256,first.sourceSha256);assert.equal(rolled.firstPublishedAt,first.firstPublishedAt);
 const withdrawn=await publish({action:'unpublish',requestId:'withdraw',id:'sample',expectedRevision:rolled.revision});
 assert.equal(store.state().records.sample.versions[withdrawn.revision].withdrawn,true);
});

test('concurrent publications have one CAS winner and failed media preparation cannot alter the archive',async()=>{
 const store=memoryStore(),publish=createPublisher({store,now:()=>new Date('2026-10-26T14:00:00Z')});
 const outcomes=await Promise.allSettled(['a','b'].map(id=>publish({action:'publish',requestId:id,source:source(id)})));
 assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);
 assert.equal(outcomes.filter(x=>x.status==='rejected'&&x.reason instanceof ConflictError).length,1);
 const before=store.state();const failing=createPublisher({store,prepareMedia:async()=>{throw Error('upload unavailable');}});
 await assert.rejects(failing({action:'publish',requestId:'failed',source:source('failed')}),/unavailable/);
 assert.deepEqual(store.state(),before);
});

test('invalid dates and inherited keys cannot corrupt the registry or skip a write',async()=>{
 const publish=createPublisher({store:memoryStore(),now:()=>new Date('2026-10-26T14:00:00Z')});
 await assert.rejects(publish({action:'publish',requestId:'bad-date',source:source('date').replaceAll('2026-10-26','not-a-date')}));
 const result=await publish({action:'publish',requestId:'constructor',source:source('constructor')});
 assert.equal(result.id,'constructor');
});

test('authored executable links are rejected before storing content',async()=>{
 const store=memoryStore(),publish=createPublisher({store});
 await assert.rejects(publish({action:'publish',requestId:'unsafe',source:source('unsafe','[click](javascript:alert)')}),/protocol/);
 assert.equal(Object.keys(store.state().records).length,0);
});
