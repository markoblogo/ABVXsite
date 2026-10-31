import test from 'node:test';
import assert from 'node:assert/strict';
import {readingContinuation} from '../src/lib/reading-continuation.mjs';
const post=(slug,extra={})=>({slug,tags:['AI'],language:'en',publishedAt:'2026-01-01',...extra});
test('recommendations honor discovery, language, dates, editorial priority and the three-item limit',()=>{
 const current=post('current',{relatedSlugs:['explicit']});
 const posts=['a','b','c','explicit','hidden'].map(x=>post(x));
 posts.push(post('future',{publishedAt:'2099-01-01'}),post('fr',{language:'fr'}),current);
 const visible=new Set(posts.filter(x=>x.slug!=='hidden').map(x=>'/writing/'+x.slug));
 assert.deepEqual(readingContinuation(current,posts,visible).related.map(x=>x.slug),['explicit','a','b']);
});
test('numbered notebooks only link consecutive visible members and exclude standalone articles',()=>{
 const notebook=n=>post('psychology-notebook-'+n+'-topic',{tags:['psychology-notebook']});
 const current=notebook(22),posts=[notebook(20),notebook(21),notebook(23),post('standalone',{tags:['psychology-notebook']})];
 const visible=new Set(posts.filter(x=>x.slug!==notebook(23).slug).map(x=>'/writing/'+x.slug));
 const result=readingContinuation(current,posts,visible);
 assert.equal(result.previous.slug,notebook(21).slug);assert.equal(result.next,undefined);assert.equal(result.first.slug,notebook(20).slug);
 assert.equal(readingContinuation(post('standalone'),posts,visible).previous,undefined);
});
test('unrelated posts do not fill empty recommendations',()=>{
 assert.deepEqual(readingContinuation(post('one'),[post('two',{tags:['cooking']})],new Set(['/writing/two'])).related,[]);
});

test('missing language is English for both current and candidate records',()=>{
 const legacy=post('legacy',{language:undefined});
 const visible=new Set(['/writing/legacy']);
 assert.equal(readingContinuation(post('french',{language:'fr'}),[legacy],visible).related.length,0);
 assert.equal(readingContinuation(post('ukrainian',{language:'uk'}),[legacy],visible).related.length,0);
 assert.equal(readingContinuation(post('english',{language:undefined}),[legacy],visible).related[0].slug,'legacy');
});
