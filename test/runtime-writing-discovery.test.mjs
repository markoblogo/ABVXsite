import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {readNativeWritingFiles,nativeWritingFromSource} from '../src/content/file-loader.ts';
import {projectWritingIndex,projectWritingLlms} from '../src/content/runtime-writing-discovery.mjs';
const baseline=JSON.parse(readFileSync('public/content-index.json','utf8'));
const discovery=JSON.parse(readFileSync('content/writing-discovery.json','utf8'));
const sources=readdirSync('content/writing').filter(x=>x.endsWith('.md')&&!x.startsWith('_')).map(x=>readFileSync('content/writing/'+x,'utf8'));
test('migration preserves every existing normalized public article and discovery entry',()=>{
 const items=readNativeWritingFiles();assert.deepEqual(items,sources.map(nativeWritingFromSource).filter(x=>x.visibility!=='private'&&x.visibility!=='draft'));
 const projected=projectWritingIndex(sources,baseline,discovery);
 for(const item of baseline.items.filter(x=>x.type==='writing'))assert.deepEqual(projected.items.find(x=>x.canonicalUrl===item.canonicalUrl),item);
});
test('withdrawn articles disappear from discovery and llms while catalogue and stories remain',()=>{
 const removed=baseline.items.find(x=>x.type==='writing');
 const kept=sources.filter(source=>!source.includes('"slug": "'+new URL(removed.canonicalUrl).pathname.split('/').pop()+'"'));
 const next=projectWritingIndex(kept,baseline,discovery);
 assert.ok(!next.items.some(x=>x.canonicalUrl===removed.canonicalUrl));
 assert.deepEqual(next.items.filter(x=>!['writing','video','writing-archive'].includes(x.type)),baseline.items.filter(x=>!['writing','video','writing-archive'].includes(x.type)));
 const text=projectWritingLlms(readFileSync('public/llms.txt','utf8'),next);
 assert.ok(!text.includes('URL: '+removed.canonicalUrl+'\n'));
});
test('a retained video redirect must still belong to that exact video',()=>{
 const wrap=data=>'---\n'+JSON.stringify({visibility:'public',status:'live',publishedAt:'2020-01-01',title:data.slug,summary:'Summary',...data})+'\n---\n\nText.';
 const changed=wrap({slug:'original',videoUrl:'https://www.youtube.com/watch?v=NewVideo002'}),other=wrap({slug:'remaining',videoUrl:'https://www.youtube.com/watch?v=NewVideo001'});
 const index=projectWritingIndex([changed,other],{...baseline,videoRedirects:{NewVideo001:'original'}},{items:[]},Date.now(),['original','remaining']);
 assert.equal(index.videoRedirects.NewVideo001,'remaining');
});
test('the clock alone cannot release a seeded/legacy companion; an explicit runtime write can',()=>{
 const source='---\n'+JSON.stringify({slug:'scheduled',title:'Scheduled',summary:'Summary',status:'live',visibility:'public',publishedAt:'2027-01-01',videoUrl:'https://www.youtube.com/watch?v=NewVideo001'})+'\n---\n\nText.';
 const registry={items:[{source:'youtube',url:'https://www.youtube.com/watch?v=NewVideo001',title:'Automatic page',publishedAt:'2020-01-01'}]};
 const old={items:[],videoCompanions:{},videoRedirects:{}};
 const frozen=projectWritingIndex([source],old,registry,Date.parse('2028-01-01'));
 assert.ok(frozen.items.some(x=>x.type==='video'));assert.ok(!frozen.items.some(x=>x.type==='writing'));
 const committed=projectWritingIndex([source],old,registry,Date.parse('2028-01-01'),['scheduled']);
 assert.ok(committed.items.some(x=>x.type==='writing'));assert.ok(!committed.items.some(x=>x.type==='video'));
});
