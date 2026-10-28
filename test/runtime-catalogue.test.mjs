import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPublisher,emptySnapshot,currentSources,mergeWritingSources} from '../src/content/runtime-writing.mjs';
import {catalogueFamily,catalogueConfiguration,readLegacyCatalogueSources,mergeCatalogueSources,projectCatalogueIndex} from '../src/content/runtime-catalogue.mjs';
import {bookFromSource,workFromSource,seriesFromSource,readBookFiles,readWorkFiles,readSeriesFiles} from '../src/content/file-loader.ts';
import {parseMarkdownSource} from '../src/content/markdown-source.mjs';
const now=new Date('2026-10-28T12:00:00Z');
const source=data=>'---\n'+JSON.stringify(data)+'\n---\n\nOriginal approved description.\n';
const base={id:'new-book',slug:'new-book',type:'book',title:'New book',summary:'A new book',visibility:'public',status:'released',primarySection:'books',appearsIn:['books'],publishedAt:'2026-10-28',tags:['test'],links:[],group:'Fiction'};
function fixture(legacy=[]){let state=emptySnapshot();const store={load:async()=>({snapshot:structuredClone(state),etag:'fixture'}),commit:async value=>{state=value;}};return {publish:createPublisher({store,legacySources:legacy,now:()=>now}),state:()=>state};}
test('bundled catalogue normalization and discovery remain unchanged with no runtime records',()=>{
 const sources=readLegacyCatalogueSources(),snapshot=emptySnapshot(),index=JSON.parse(readFileSync('public/content-index.json','utf8'));
 assert.deepEqual(projectCatalogueIndex(index,mergeCatalogueSources(snapshot,sources),snapshot),index);
 for(const [family,read,normalize]of [['books',readBookFiles,bookFromSource],['work',readWorkFiles,workFromSource],['series',readSeriesFiles,seriesFromSource]])assert.deepEqual(sources.filter(s=>catalogueFamily(parseMarkdownSource(s).data)===family&&!['private','draft'].includes(parseMarkdownSource(s).data.visibility)).map(normalize),read());
});
test('book lifecycle is versioned, isolated from Writing, visible in discovery and withdrawable',async()=>{
 const f=fixture(),command={action:'publish',requestId:'book',source:source(base)};
 const r=await f.publish(command);assert.equal(r.canonicalUrl,'https://abvx.xyz/books/new-book');assert.deepEqual(await f.publish(command),r);
 assert.equal(mergeWritingSources(f.state(),[]).length,0);assert.equal(bookFromSource(currentSources(f.state())[0]).title,base.title);
 assert.equal(projectCatalogueIndex({items:[]},currentSources(f.state()),f.state()).items.length,1);
 const update=await f.publish({action:'update',requestId:'update',expectedRevision:r.revision,source:source({...base,title:'Updated'})});
 await assert.rejects(f.publish({action:'update',requestId:'stale',expectedRevision:r.revision,source:source(base)}));
 const rollback=await f.publish({action:'rollback',requestId:'rollback',id:base.slug,expectedRevision:update.revision,toRevision:r.revision});
 await f.publish({action:'unpublish',requestId:'hide',id:base.slug,expectedRevision:rollback.revision});assert.equal(currentSources(f.state()).length,0);
});
test('series and new project sections render through the existing configuration and enforce references',async()=>{
 const f=fixture();const series={...base,id:'new-series',slug:'new-series',type:'series'};const sr=await f.publish({action:'publish',requestId:'series',source:source(series)});
 await f.publish({action:'publish',requestId:'member',source:source({...base,primarySeriesSlug:series.slug,group:'Custom'})});
 await assert.rejects(f.publish({action:'unpublish',requestId:'hide-series',id:series.slug,expectedRevision:sr.revision}),/members|Referenced series|visible systems group/);
 const section={...base,id:'new-tools',slug:'new-tools',type:'catalogue-section',primarySection:'systems',appearsIn:['systems'],group:'New Tools',ecosystem:'New Systems'};
 const sec=await f.publish({action:'publish',requestId:'section',source:source(section)});
 await f.publish({action:'publish',requestId:'project',source:source({...base,id:'new-tool',slug:'new-tool',type:'tool',primarySection:'systems',appearsIn:['systems'],group:'New Tools'})});
 const config=catalogueConfiguration(currentSources(f.state()),Object.keys(f.state().records));assert.ok(config.seriesSlugs.includes('new-series'));assert.ok(config.ecosystems.some(e=>e.title==='New Systems'&&e.groups[0].title==='New Tools'));
 await assert.rejects(f.publish({action:'unpublish',requestId:'hide-section',id:section.slug,expectedRevision:sec.revision}),/members|Referenced series|visible systems group/);
});
test('bad placement, protocols, dates and legacy collisions cannot partially write',async()=>{
 for(const data of [{...base,group:'Unknown'},{...base,publishedAt:'2026-02-31'},{...base,links:[{type:'site',label:'Bad',url:'//evil.test'}]},{...base,media:{src:'/media/x.png',alt:'',width:1,height:1}},{...base,canonicalPath:'/other'}]){const f=fixture();await assert.rejects(f.publish({action:'publish',requestId:'bad',source:source(data)}));assert.equal(f.state().revision,'empty');}
 const f=fixture([source(base)]);await assert.rejects(f.publish({action:'publish',requestId:'duplicate',source:source(base)}),/already exists/);
});
