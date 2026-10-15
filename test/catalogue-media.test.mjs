import test from 'node:test';
import assert from 'node:assert/strict';
import {isCatalogueMediaAddition, addCatalogueMedia} from '../scripts/catalogue-media.mjs';
import {parseMarkdownSource} from '../src/content/markdown-source.mjs';
const original={slug:'guide',title:'Guide',type:'free-book',visibility:'public',status:'released',publishedAt:'2020-01-01',primarySection:'books',appearsIn:['books','focus'],links:[{type:'site',label:'Site',url:'https://example.com/'}]};
const source=data=>'---\n'+JSON.stringify(data)+'\n---\nApproved prose.\n';
const parsed=data=>parseMarkdownSource(source(data));
test('additive catalogue media preserves approved text, chronology, links and the shared video path',()=>{
 for(const descriptor of [{type:'pdf',label:'PDF',url:'https://example.com/book.pdf'},{type:'epub',label:'EPUB',url:'/media/books/guide/book.epub'},{type:'audio',label:'Audio',url:'https://example.com/book.mp3'},{type:'audiobook',label:'Audiobook',url:'https://example.com/book.m4b'},{type:'youtube',label:'Trailer',url:'https://youtu.be/aaaaaaaaaaa'},{type:'image',label:'Guide cover',url:'/media/books/guide/cover.webp'}]){
  const result=addCatalogueMedia(source(original),'/books/guide',descriptor,'2026-10-15');
  const current=parseMarkdownSource(result);
  assert.equal(current.body,parsed(original).body);assert.equal(current.data.publishedAt,original.publishedAt);
  assert.deepEqual(current.data.links.slice(0,1),original.links);
  assert.equal(isCatalogueMediaAddition(parsed(original),current,'books'),true,descriptor.type);
  assert.equal(addCatalogueMedia(result,'/books/guide',descriptor,'2026-10-15'),result,'repeat is a no-op');
 }
});
test('media-only recognition rejects edits, replacements, hidden sources, invalid dates and unsupported media',()=>{
 const added={...original,updatedAt:'2026-10-15',links:[...original.links,{type:'pdf',label:'PDF',url:'https://example.com/book.pdf'}]};
 assert.equal(isCatalogueMediaAddition(parsed(original),parsed(added),'books'),true);
 for(const change of [{...added,title:'Changed'}, {...added,visibility:'private'}, {...added,updatedAt:'2999-01-01'}, {...added,updatedAt:'2026-02-30'}, {...added,links:added.links.slice(1)}, {...added,links:[...original.links,{type:'site',label:'Website',url:'https://example.com/new'}]}])assert.equal(isCatalogueMediaAddition(parsed(original),parsed(change),'books'),false);
 assert.equal(isCatalogueMediaAddition(parsed(original),{...parsed(added),body:'Changed prose'},'books'),false);
 for(const descriptor of [{type:'pdf',label:'Bad',url:'javascript:alert(1)'},{type:'pdf',label:'Bad',url:'https://example.com/'},{type:'image',label:'Cover',url:'/media/../cover.webp'},{type:'audio',label:'',url:'https://example.com/book.mp3'}])assert.throws(()=>addCatalogueMedia(source(original),'/books/guide',descriptor));
 const withAudio={...original,links:[...original.links,{type:'audio',label:'Audio',url:'https://example.com/old.mp3'}]};
 assert.throws(()=>addCatalogueMedia(source(withAudio),'/books/guide',{type:'audio',label:'Audio',url:'https://example.com/new.mp3'}),/replacement/i);
 const withCover={...original,media:{src:'/media/old.webp',alt:'Old'}};
 assert.throws(()=>addCatalogueMedia(source(withCover),'/books/guide',{type:'image',label:'New',url:'/media/new.webp'}),/replacement/i);
});
test('published series use the same media addition contract without inventing an original date',()=>{
 const series={slug:'line',title:'Line',type:'series',visibility:'public',status:'released',canonicalPath:'/line',primarySection:'books',appearsIn:['books'],links:[]};
 const result=addCatalogueMedia(source(series),'/line',{type:'pdf',label:'Catalogue',url:'https://example.com/catalogue.pdf'},'2026-10-15');
 assert.equal(parseMarkdownSource(result).data.publishedAt,undefined);
 assert.equal(isCatalogueMediaAddition(parsed(series),parseMarkdownSource(result),'books'),true);
});

test('the real media CLI dry-runs, writes once and resolves a series canonical path',async()=>{
 const {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync}=await import('node:fs');
 const {execFileSync}=await import('node:child_process');const {tmpdir}=await import('node:os');const path=await import('node:path');
 const root=mkdtempSync(path.join(tmpdir(),'abvx-media-cli-'));
 const script=path.resolve('scripts/catalogue-media.mjs');const file=path.join(root,'content/series/line.md');
 const data={slug:'line',title:'Line',type:'series',visibility:'public',status:'released',canonicalPath:'/canonical-line',links:[]};const before=source(data);
 try{
  mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,before);
  const args=['--route','/canonical-line','--type','epub','--url','https://example.com/line.epub','--label','EPUB'];
  const run=extra=>JSON.parse(execFileSync(process.execPath,[script,...args,...extra],{cwd:root,encoding:'utf8'}));
  assert.equal(run([]).mode,'dry-run');assert.equal(readFileSync(file,'utf8'),before);
  assert.equal(run(['--write']).sourceFile,'content/series/line.md');const written=readFileSync(file,'utf8');
  assert.equal(run(['--write']).changed,false);assert.equal(readFileSync(file,'utf8'),written);
  assert.equal(parseMarkdownSource(written).data.publishedAt,undefined);
 }finally{rmSync(root,{recursive:true,force:true});}
});
