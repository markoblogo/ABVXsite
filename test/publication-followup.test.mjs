import test from 'node:test';
import assert from 'node:assert/strict';
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
 const state=syncFollowUps(index,null,'2026-10-19');
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
 assert.throws(()=>syncFollowUps({items:[{type:'writing',canonicalUrl:url,updatedAt:'2026-10-19'}]},null,'2026-10-19'),/lacks publication dates/);
});
