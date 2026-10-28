import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAcceptedWorkingStory} from '../src/content/runtime-working-stories.mjs';
const data={title:'Example',slug:'example',date:'2026-10-28',type:'working-story',series:'working-stories',story_id:'ws-999',cluster:'project-999',period:null,topics:['strategy'],book:{include:true,status:'draft'},visibility:'public',summary:'Example story',language:'en'};
const source=d=>'---\n'+JSON.stringify(d)+'\n---\n\n## Context\n\nOriginal story.\n';
test('accepts a public Working Story with the original canonical metadata and prose',()=>{const p=parseAcceptedWorkingStory(source(data),new Date('2026-10-28T12:00:00Z'));assert.equal(p.data.story_id,'ws-999');assert.match(p.body,/Original story/)});
test('rejects drafts, future dates, unsafe links and malformed story metadata',()=>{for(const d of [{...data,visibility:'draft'},{...data,date:'2026-10-29'},{...data,story_id:'bad'}])assert.throws(()=>parseAcceptedWorkingStory(source(d),new Date('2026-10-28T12:00:00Z')));assert.throws(()=>parseAcceptedWorkingStory(source(data).replace('Original story.','[unsafe](javascript:alert)'),new Date('2026-10-28T12:00:00Z')))});

import {createPublisher,emptySnapshot,digest,mergeWritingSources,currentSources} from '../src/content/runtime-writing.mjs';
import {projectWritingIndex} from '../src/content/runtime-writing-discovery.mjs';
test('story publication, update and withdrawal preserve dates and do not enter native article rendering',async()=>{
 let snapshot=emptySnapshot();const store={load:async()=>({snapshot:structuredClone(snapshot),etag:'test'}),commit:async value=>{snapshot=value;}};
 const publisher=createPublisher({store,now:()=>new Date('2026-10-28T12:00:00Z')});
 const first=await publisher({action:'publish',requestId:'story-first',source:source(data)});
 assert.equal(first.canonicalUrl,'https://abvx.xyz/writing/working-stories/example');
 assert.equal(first.firstPublishedAt,'2026-10-28');assert.equal(mergeWritingSources(snapshot,[]).length,0);
 const changed=await publisher({action:'update',requestId:'story-update',expectedRevision:first.revision,source:source({...data,title:'Changed'})});
 assert.equal(changed.firstPublishedAt,first.firstPublishedAt);
 await assert.rejects(publisher({action:'update',requestId:'story-redate',expectedRevision:changed.revision,source:source({...data,date:'2026-10-27'})}));
 await publisher({action:'unpublish',requestId:'story-hide',id:'example',expectedRevision:changed.revision});assert.equal(currentSources(snapshot).length,0);
 const baseline={items:[{type:'working-story',section:'writing',title:'Old',canonicalUrl:first.canonicalUrl}]};
 assert.equal(projectWritingIndex([],baseline,{items:[]},Date.now(),[],[],Object.keys(snapshot.records)).items.length,0);
});

import {createWritingHandler} from '../src/content/runtime-writing-api.mjs';
import {commandFromPacket} from '../scripts/runtime-writing.mjs';
test('approved Working Story packet reaches authenticated API and authoritative export',async()=>{
 const text=source(data),body='## Context\n\nOriginal story.';
 const packet={schema_version:'v1',mode:'REPORT_ONLY_HANDOFF',project:'abvxsite',surface:'working-stories',consumer_operation:{id:'abvx.publish-working-story'},item_id:'story-test',slug:'example',title:'Example',kind:'working-story',payload:{source_markdown:text,source_sha256:digest(text),date_published:data.date,language:'en',body_lines:body.split('\n\n'),media_assets:[]}};
 const command=commandFromPacket(packet,{requestId:'story-api'});
 let snapshot=emptySnapshot();const store={load:async()=>({snapshot:structuredClone(snapshot),etag:'test'}),commit:async value=>{snapshot=value;}};
 const token='x'.repeat(40),handler=createWritingHandler({store,token,enabled:true,projectIndex:state=>projectWritingIndex([],{items:[]},{items:[]},Date.now(),[],currentSources(state),Object.keys(state.records))});
 const response=await handler(new Request('https://example.test/api/writing/manage',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(command)}));assert.equal(response.status,200);
 const exported=await (await handler(new Request('https://example.test/api/writing/manage?export=1',{headers:{authorization:'Bearer '+token}}))).json();assert.equal(exported.publicIndex.items[0].type,'working-story');assert.equal(exported.publicIndex.items[0].canonicalUrl,'https://abvx.xyz/writing/working-stories/example');
});

test('runtime discovery defaults an omitted summary to the title',()=>{const d={...data};delete d.summary;const index=projectWritingIndex([],{items:[]},{items:[]},Date.now(),[],[source(d)]);assert.equal(index.items[0].summary,d.title);});
