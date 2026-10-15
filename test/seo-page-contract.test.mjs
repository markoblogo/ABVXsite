import * as mediaPolicy from '../src/lib/media-policy.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSeoPage } from '../scripts/seo-page-contract.mjs';
const record=()=>({title:'Unique title',description:'Useful description',canonical:['https://abvx.xyz/writing/test'],robots:'index, follow',h1:1,lang:'en',jsonld:[{'@type':'Article'}]});
test('a sitemap page must have a self canonical, visible heading, description and valid indexable metadata',()=>{
 assertSeoPage(record(),'https://abvx.xyz/writing/test');
 for(const patch of [{canonical:[]},{canonical:['https://abvx.xyz/wrong']},{description:''},{robots:'NOINDEX, follow'},{h1:0},{h1:2},{jsonld:[null]},{lang:''}]) assert.throws(()=>assertSeoPage({...record(),...patch},'https://abvx.xyz/writing/test'));
 assert.throws(()=>assertSeoPage(record(),'https://abvx.xyz/writing/test','noindex'));
});

import { publicationMetadataErrors } from '../scripts/publication-metadata.mjs';
test('metadata rejects invalid calendar dates, reversed modification dates and malformed explicit SEO before build',()=>{
 assert.deepEqual(publicationMetadataErrors({publishedAt:'2026-10-14',updatedAt:'2026-10-14T14:00:00Z',seoTitle:'Title'}),[]);
 for(const data of [{publishedAt:'2026-02-31'},{updatedAt:'invalid'},{publishedAt:'2026-10-14',updatedAt:'2026-10-13'},{seoTitle:42},{seoDescription:''}]) assert.ok(publicationMetadataErrors(data).length);
 assert.deepEqual(publicationMetadataErrors({}),[],'legacy unknown dates stay unknown');
});

import ts from 'typescript';
import { readFileSync } from 'node:fs';
const seoModule = { exports: {} };
new Function('module','exports',ts.transpileModule(readFileSync('src/lib/seo.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(seoModule,seoModule.exports);
test('Book structured data honors the declared publisher and preserves the site fallback',()=>{
 const book={slug:'publisher-test',title:'Example handbook',summary:'A practical guide.',tags:[],links:[]};
 assert.deepEqual(seoModule.exports.bookJsonLd({...book,publisher:'AMI Press'}).publisher,{'@type':'Organization',name:'AMI Press'});
 assert.deepEqual(seoModule.exports.bookJsonLd(book).publisher,{'@id':'https://abvx.xyz/#organization'});
});


test('audio releases have narrow media CSP permission and old URLs redirect to identical published assets',async()=>{
 const load=file=>{const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(()=>mediaPolicy,m,m.exports);return m.exports;};
 const csp=load('src/lib/csp-policy.ts').buildContentSecurityPolicy('test-nonce');
 assert.equal(csp.split(';').map(x=>x.trim()).find(x=>x.startsWith('media-src ')),"media-src 'self' https://github.com https://release-assets.githubusercontent.com");
 const redirects=await load('next.config.ts').default.redirects();
 for(const ext of ['mp3','m4b']) {
  const rule=redirects.find(r=>r.source==='/media/books/mn7r-agro-commodity-brokerage-en-free-edition/audiobook.'+ext);
  assert.equal(rule?.destination,'https://github.com/markoblogo/mn7r-public-assets/releases/download/book-assets-2026-09-23/mn7r-agro-commodity-brokerage-en-audio.'+ext);
  assert.equal(rule?.permanent,true);
 }
});
