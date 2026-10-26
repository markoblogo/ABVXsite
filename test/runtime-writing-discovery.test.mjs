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
