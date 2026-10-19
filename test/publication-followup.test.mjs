import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {syncFollowUps,dueFollowUps,recordFollowUp} from '../scripts/publication-followup.mjs';

const url='https://abvx.xyz/writing/example';
const index={items:[{canonicalUrl:url,title:'Example',publishedAt:'2026-10-19'}]};
test('7/14/28-day checkpoints preserve the anchor across edits and register only public local source pages',()=>{
 let state=syncFollowUps(index,null,'2026-10-19','2026-10-10');
 assert.deepEqual(dueFollowUps(state,'2026-10-25'),[]);
 assert.equal(dueFollowUps(state,'2026-10-26')[0].day,7);
 state=syncFollowUps({items:[{...index.items[0],publishedAt:'2026-10-28'},{canonicalUrl:'https://medium.com/new',publishedAt:'2026-10-28'},{canonicalUrl:'https://abvx.xyz/writing/videos/aaaaaaaaaaa',publishedAt:'2026-10-28'}]},state,'2026-10-28');
 assert.equal(state.items[url].anchorDate,'2026-10-19');
 assert.equal(Object.keys(state.items).length,1);
 const observation={status:'observed',discovered:false,indexed:false,lastCrawlAt:null,impressions:0,clicks:0,dataThrough:'2026-10-26',firstImpressionDate:null,evidence:['URL Inspection: URL unknown to Google. Performance: exact-page filter, no impressions in the complete checkpoint window.']};
 recordFollowUp(state,url,7,observation,'2026-10-28T12:00:00Z');
 assert.equal(dueFollowUps(state,'2026-11-02')[0].day,14);
 recordFollowUp(state,url,14,{...observation,dataThrough:'2026-11-02'},'2026-11-03T12:00:00Z');
 assert.equal(dueFollowUps(state,'2026-11-16')[0].day,28);
});

test('failed access and delayed data remain pending, preserve unknowns and retain attempts',()=>{
 const state=syncFollowUps(index,null,'2026-10-19','2026-10-19');
 const missing={status:'access_failed',discovered:null,indexed:null,lastCrawlAt:null,impressions:null,clicks:null,dataThrough:null,firstImpressionDate:null,evidence:['GSC session unavailable.']};
 assert.throws(()=>recordFollowUp(state,url,7,missing,'2026-10-25T10:00:00Z'),/not due/);
 recordFollowUp(state,url,7,missing,'2026-10-26T10:00:00Z');
 const delayed={...missing,status:'observed',discovered:true,indexed:true,impressions:2,clicks:0,dataThrough:'2026-10-24',evidence:['URL indexed; performance report only complete through October 24.']};
 recordFollowUp(state,url,7,delayed,'2026-10-26T11:00:00Z');
 assert.equal(dueFollowUps(state,'2026-10-27')[0].day,7);
 assert.equal(state.items[url].checkpoints[7].attempts[0].impressions,null);
 recordFollowUp(state,url,7,{...delayed,dataThrough:'2026-10-26'},'2026-10-28T10:00:00Z');
 assert.equal(state.items[url].checkpoints[7].attempts.length,3);
 assert.deepEqual(dueFollowUps(state,'2026-10-28'),[]);
 assert.throws(()=>recordFollowUp(state,url,7,delayed,'2026-10-28T12:00:00Z'),/immutable/);
});

test('old baseline pages are not later enrolled as new; new backdated URLs use first public observation',()=>{
 const old={items:[{canonicalUrl:url,title:'Old',publishedAt:'2025-01-01'}]};
 let state=syncFollowUps(old,null,'2026-10-19','2026-10-10');
 assert.equal(Object.keys(state.items).length,0);
 state=syncFollowUps({items:[...old.items,{canonicalUrl:url+'-new',title:'New page',publishedAt:'2025-01-01'}]},state,'2026-10-20');
 assert.equal(state.items[url+'-new'].anchorDate,'2026-10-20');
 assert.equal(Object.keys(state.items).length,1);
 assert.equal(dueFollowUps(state,'2026-10-27')[0].day,7);
 assert.throws(()=>syncFollowUps({items:[{type:'writing',canonicalUrl:url,updatedAt:'2026-10-19'}]},null,'2026-10-19','2026-10-10'),/lacks publication dates/);
});

const missing={status:'access_failed',discovered:null,indexed:null,lastCrawlAt:null,impressions:null,clicks:null,dataThrough:null,firstImpressionDate:null,evidence:['GSC session unavailable.']};
test('checkpoint eligibility uses the Paris calendar across winter, summer and explicit offsets',()=>{
 for(const [publishedAt,before,due] of [
  ['2026-10-19','2026-10-25T22:59:59Z','2026-10-25T23:00:00Z'],
  ['2026-07-01','2026-07-07T21:59:59Z','2026-07-07T22:00:00Z'],
  ['2026-07-01','2026-07-07T23:59:59+02:00','2026-07-08T00:00:00+02:00'],
 ]) {
  const state=syncFollowUps({items:[{...index.items[0],publishedAt}]},null,publishedAt,publishedAt);
  assert.throws(()=>recordFollowUp(state,url,7,missing,before),/not due/);
  recordFollowUp(state,url,7,missing,due);
  assert.equal(state.items[url].checkpoints[7].attempts[0].observedAt,due);
 }
});

test('bounded retries let every due URL run before repeating pending or failed checks',()=>{
 const items=Array.from({length:23},(_,i)=>({...index.items[0],canonicalUrl:url+String(i).padStart(2,'0')}));
 const state=syncFollowUps({items},null,'2026-10-19','2026-10-19');
 const first=dueFollowUps(state,'2026-10-28');
 for(const [i,item] of first.entries())recordFollowUp(state,item.url,7,{...missing,status:i%2?'data_pending':'access_failed'},'2026-10-28T10:00:00Z');
 const second=dueFollowUps(state,'2026-10-28');
 assert.equal(second.length,10);
 assert.ok(second.every(item=>!first.some(previous=>previous.url===item.url)));
 for(const item of second)recordFollowUp(state,item.url,7,missing,'2026-10-28T11:00:00Z');
 const third=dueFollowUps(state,'2026-10-28');
 const untouched=third.filter(item=>!state.items[item.url].checkpoints[7]);
 assert.equal(untouched.length,3);
 assert.deepEqual(third.slice(0,3),untouched);
 for(const item of untouched)recordFollowUp(state,item.url,7,missing,'2026-10-28T12:00:00Z');
 assert.deepEqual(dueFollowUps(state,'2026-10-28').map(item=>item.url),first.map(item=>item.url));
 for(const item of first)recordFollowUp(state,item.url,7,missing,'2026-10-28T13:00:00Z');
 assert.deepEqual(dueFollowUps(state,'2026-10-28').map(item=>item.url),second.map(item=>item.url));
});

test('initial enrollment requires an explicit baseline without persisting skipped URLs',()=>{
 assert.throws(()=>syncFollowUps(index,null,'2026-10-19'),/explicit.*baseline/i);
 const folder=mkdtempSync(path.join(tmpdir(),'followup-baseline-'));
 try {
  const source=path.join(folder,'index.json'),state=path.join(folder,'state.json');
  writeFileSync(source,JSON.stringify({items:[{...index.items[0],publishedAt:'2026-10-10'}]}));
  const args=['scripts/publication-followup.mjs','sync','--index',source,'--state',state,'--today','2026-10-19'];
  const live=spawnSync(process.execPath,['scripts/publication-followup.mjs','sync','--live','--state',state],{encoding:'utf8',timeout:5000});
  assert.equal(live.error,undefined);
  assert.equal(live.status,1);
  assert.match(live.stderr,/explicit.*baseline/i);
  assert.equal(existsSync(state),false);
  const failed=spawnSync(process.execPath,args,{encoding:'utf8',timeout:5000});
  assert.notEqual(failed.status,0);
  assert.match(failed.stderr,/explicit.*baseline/i);
  assert.equal(existsSync(state),false);
  const recovered=spawnSync(process.execPath,[...args,'--since','2026-10-10'],{encoding:'utf8',timeout:5000});
  assert.equal(recovered.status,0,recovered.stderr);
  assert.equal(JSON.parse(recovered.stdout).tracked,1);
  const repeat=spawnSync(process.execPath,args,{encoding:'utf8',timeout:5000});
  assert.equal(repeat.status,0,repeat.stderr);
  assert.equal(JSON.parse(repeat.stdout).tracked,1);
 } finally {rmSync(folder,{recursive:true,force:true});}
});
