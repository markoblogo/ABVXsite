import {parseMarkdownSource} from '../src/content/markdown-source.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,existsSync,mkdirSync,writeFileSync,readFileSync,readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { planCatalogue } from '../scripts/publish-catalogue.mjs';
import { applyPublications } from '../scripts/publication-media.mjs';
import { isStandaloneCatalogueBook } from '../src/lib/catalogue-config.mjs';
const hash=source=>createHash('sha256').update(source).digest('hex');
test('a book in a displayed secondary series is not also rendered as standalone',()=>{
 const book={group:'Fiction',seriesSlugs:['good-dogs-of-the-apocalypse']};
 assert.equal(isStandaloneCatalogueBook(book,['good-dogs-of-the-apocalypse']),false);
 assert.equal(isStandaloneCatalogueBook(book,[]),true);
 assert.equal(isStandaloneCatalogueBook({group:'Fiction'},['good-dogs-of-the-apocalypse']),true);
 assert.equal(isStandaloneCatalogueBook({primarySeriesSlug:'another-series'},[]),false);
});
function packet(folder='work',patch={}) {
 const data={id:'example',slug:'example',title:'Example',type:folder==='work'?'tool':'book',group:folder==='work'?'Standalone Utilities':'Fiction',status:'building',visibility:'public',publishedAt:'2020-01-01',primarySection:folder==='work'?'systems':'books',appearsIn:[folder==='work'?'systems':'books'],summary:'Useful summary',tags:[],links:[{type:'github',label:'Source',url:'https://github.com/example/project'}],seoTitle:'Explicit search title',...patch};
 const body='Author approved product description.';const source='---\n'+JSON.stringify(data)+'\n---\n\n'+body+'\n';
 return {schema_version:'v1',mode:'REPORT_ONLY_HANDOFF',project:'abvxsite',surface:folder,kind:data.type,slug:data.slug,title:data.title,consumer_operation:{id:folder==='work'?'abvx.publish-project':'abvx.publish-book'},payload:{source_markdown:source,source_sha256:hash(source),body_lines:[body],date_published:data.publishedAt,media_assets:[]}};
}
test('catalogue publication preserves approved types, SEO, links and prose byte for byte',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-catalogue-'));
 try {
  for(const folder of ['work','books']) {
   const value=packet(folder);const plan=planCatalogue(value,root);assert.equal(plan.source,value.payload.source_markdown);
   applyPublications([plan]);assert.ok(existsSync(path.join(root,'content',folder,'example.md')));assert.throws(()=>planCatalogue(value,root),/overwrite/);
  }
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('unrendered groups and undisplayed/private series fail before catalogue writes',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-catalogue-placement-'));
 try {
  for(const folder of ['work','books']) for(const group of [undefined,'Misspelled group']) assert.throws(()=>planCatalogue(packet(folder,{group}),root),/placement/);
  assert.throws(()=>planCatalogue(packet('books',{primarySeriesSlug:'unknown-series'}),root),/placement/);
  assert.throws(()=>planCatalogue(packet('books',{primarySeriesSlug:'good-dogs-of-the-apocalypse'}),root),/placement/);
  assert.equal(existsSync(path.join(root,'content')),false);
  mkdirSync(path.join(root,'content/series'),{recursive:true});
  const file=path.join(root,'content/series/good-dogs-of-the-apocalypse.md');
  writeFileSync(file,'---\n'+JSON.stringify({slug:'good-dogs-of-the-apocalypse',visibility:'private'})+'\n---\n');
  assert.throws(()=>planCatalogue(packet('books',{primarySeriesSlug:'good-dogs-of-the-apocalypse'}),root),/placement/);
  writeFileSync(file,'---\n'+JSON.stringify({slug:'good-dogs-of-the-apocalypse',visibility:'public'})+'\n---\n');
  assert.ok(planCatalogue(packet('books',{group:undefined,primarySeriesSlug:'good-dogs-of-the-apocalypse'}),root));
  assert.ok(planCatalogue(packet('books',{group:undefined,primarySeriesSlug:'unknown',seriesSlugs:['good-dogs-of-the-apocalypse']}),root));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('unsigned sources, source conflicts, unsupported placement and unapproved media fail before writes',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-catalogue-block-'));
 try {
  for(const value of [packet('work',{visibility:'private'}),packet('work',{publishedAt:'2999-01-01'}),packet('work',{primarySection:'focus'}),packet('work',{type:'new-type'}),packet('work',{media:{src:'/media/cover.png',alt:'Cover',width:1,height:1}})]) assert.throws(()=>planCatalogue(value,root));
  const changed=packet();changed.payload.source_sha256='0'.repeat(64);assert.throws(()=>planCatalogue(changed,root),/hash/);
  const legacy=packet();delete legacy.payload.source_markdown;assert.throws(()=>planCatalogue(legacy,root),/approved/);
  const conflict=packet();conflict.title='Different';assert.throws(()=>planCatalogue(conflict,root),/conflicts/);
  assert.equal(existsSync(path.join(root,'content')),false);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('standard catalogue media can omit dimensions while explicit invalid values fail',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-catalogue-image-'));
 try {
  const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7xkAAAAASUVORK5CYII=','base64');
  const source=path.join(root,'input.png');writeFileSync(source,bytes);
  for(const folder of ['work','books']) {
   const value=packet(folder,{media:{src:'/media/example.png',alt:'Approved cover',role:'generic-thumbnail'}});
   value.payload.media_assets=[{source,target:'/media/example.png',sha256:hash(bytes)}];
   assert.equal(planCatalogue(value,root).media.length,1);
   for(const width of [0,-1,'100',null]) assert.throws(()=>planCatalogue(packet(folder,{media:{src:'/media/example.png',alt:'Cover',width}}),root),/dimension/);
  }
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('existing book and project video additions preserve prose and links, are idempotent and append without replacement',async()=>{
 const {addCatalogueVideo}=await import('../scripts/catalogue-video.mjs');
 for(const folder of ['books','work']) {
  const data={id:'example',slug:'example',type:folder==='books'?'book':'tool',visibility:'public',status:'released',publishedAt:'2020-01-01',links:[{type:'youtube',url:'https://www.youtube.com/@channel'},{type:'pdf',url:'https://example.com/book.pdf'}]};
  const suffix='\n---\n\nApproved text.\n\n    Keep indentation.\n';
  const source='---\n'+JSON.stringify(data)+suffix;
  const route=`/${folder}/example`,result=addCatalogueVideo(source,route,'https://youtu.be/aaaaaaaaaaa','2026-01-01');
  assert.ok(result.endsWith(suffix));
  const parsed=JSON.parse(result.slice(3,result.indexOf('\n---',3)));
  assert.deepEqual(parsed.links.slice(0,-1),data.links);assert.equal(parsed.updatedAt,'2026-01-01');
  assert.equal(addCatalogueVideo(result,route,'https://www.youtube.com/watch?v=aaaaaaaaaaa','2026-01-02'),result);
  const second=addCatalogueVideo(result,route,'https://youtu.be/bbbbbbbbbbb');
  assert.deepEqual(parseMarkdownSource(second).data.links.slice(0,-1),parseMarkdownSource(result).data.links);
  assert.ok(second.endsWith(suffix));
  for(const [target,url] of [[`/${folder}/other`,'https://youtu.be/aaaaaaaaaaa'],['/books/../example','https://youtu.be/aaaaaaaaaaa'],[route,'https://evil.example/aaaaaaaaaaa'],[route,'https://www.youtube.com/@channel'],[route,'https://www.youtube.com/watch?v=aaaaaaaaaaa%26extra']])assert.throws(()=>addCatalogueVideo(source,target,url));
  assert.throws(()=>addCatalogueVideo(source.replace('"public"','"private"'),route,'https://youtu.be/aaaaaaaaaaa'));
  assert.throws(()=>addCatalogueVideo(source,route,'https://youtu.be/aaaaaaaaaaa','2026-02-31'));
 }
});

test('shared add-video CLI dry-runs, writes exactly one card and repeats without edits',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-add-video-'));
 try {
  const file=path.join(root,'content/books/example.md');mkdirSync(path.dirname(file),{recursive:true});
  const source=packet('books').payload.source_markdown;writeFileSync(file,source);
  const command=fileURLToPath(new URL('../scripts/catalogue-video.mjs',import.meta.url));
  const args=[command,'--route','/books/example','--video','https://youtu.be/aaaaaaaaaaa'];
  const run=extra=>JSON.parse(execFileSync(process.execPath,[...args,...extra],{cwd:root,encoding:'utf8'}));
  assert.equal(run([]).mode,'dry-run');assert.equal(readFileSync(file,'utf8'),source);
  assert.equal(run(['--write']).changed,true);const written=readFileSync(file,'utf8');
  assert.equal(run(['--write']).changed,false);assert.equal(readFileSync(file,'utf8'),written);
 }finally{rmSync(root,{recursive:true,force:true});}
});


test('existing legacy project and series types can receive a video without changing type',async()=>{
 const {addCatalogueVideo}=await import('../scripts/catalogue-video.mjs');
 for(const [folder,type] of [['work','index-infrastructure'],['books','series']]) {
  const data={slug:'existing',type,visibility:'public',status:'live',publishedAt:'2020-01-01',links:[]};
  const source='---\n'+JSON.stringify(data)+'\n---\nExisting description.';
  const result=addCatalogueVideo(source,`/${folder}/existing`,'https://youtu.be/aaaaaaaaaaa');
  assert.equal(JSON.parse(result.slice(3,result.indexOf('\n---',3))).type,type);
 }
});
test('books and projects accept the same strict video URL forms that their shared gallery renders',async()=>{
 const {addCatalogueVideo,catalogueCardVideoId}=await import('../scripts/catalogue-video.mjs');
 const source=packet('books').payload.source_markdown;
 for(const url of ['https://www.youtube-nocookie.com/embed/aaaaaaaaaaa','https://www.youtube.com/watch?t=1&v=aaaaaaaaaaa']) {
  assert.equal(catalogueCardVideoId(url,'books'),'aaaaaaaaaaa');
  assert.ok(addCatalogueVideo(source,'/books/example',url).includes(url));
  assert.equal(catalogueCardVideoId(url,'work'),'aaaaaaaaaaa');
 }
});

test('real public series use their series source through the complete CLI, including undated and canonical-root records',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-real-series-video-'));
 const command=fileURLToPath(new URL('../scripts/catalogue-video.mjs',import.meta.url));
 try {
  const directory=path.join(root,'content/series');mkdirSync(directory,{recursive:true});let count=0;
  for(const name of readdirSync('content/series').filter(name=>name.endsWith('.md')&&!name.startsWith('_'))) {
   const source=readFileSync(path.join('content/series',name),'utf8');const data=JSON.parse(source.slice(3,source.indexOf('\n---',3)));
   const file=path.join(directory,name);writeFileSync(file,source);
   const link=data.links.find(link=>link.type==='youtube')?.url||'https://youtu.be/aaaaaaaaaaa';
   const args=[command,'--route','/books/'+data.slug,'--video',link];
   const run=extra=>execFileSync(process.execPath,[...args,...extra],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
   if(data.visibility==='private') {assert.throws(()=>run(['--write']));assert.equal(readFileSync(file,'utf8'),source);continue;}
   const dry=JSON.parse(run([]));assert.equal(dry.sourceFile,'content/series/'+name);assert.equal(readFileSync(file,'utf8'),source);
   run(['--write']);const result=readFileSync(file,'utf8'),after=JSON.parse(result.slice(3,result.indexOf('\n---',3)));
   assert.equal(after.publishedAt,data.publishedAt);assert.equal(result.slice(result.indexOf('\n---',3)),source.slice(source.indexOf('\n---',3)));
   assert.ok(!existsSync(path.join(root,'content/books',name)));
   if(data.canonicalPath) {
    const canonical=execFileSync(process.execPath,[command,'--route',data.canonicalPath,'--video',link],{cwd:root,encoding:'utf8'});
    assert.equal(JSON.parse(canonical).changed,false);
   }
   count++;
  }
  assert.ok(count>=5,'real published series covered');
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('existing legacy catalogue cards permit an absent date without inventing it',async()=>{
 const {addCatalogueVideo}=await import('../scripts/catalogue-video.mjs');
 const data={slug:'example',type:'series',status:'released',visibility:'public',links:[]};
 const source=patch=>'---\n'+JSON.stringify({...data,...patch})+'\n---\nReleased legacy series.';
 const result=addCatalogueVideo(source({}),'/books/example','https://youtu.be/aaaaaaaaaaa');
 assert.equal(JSON.parse(result.slice(3,result.indexOf('\n---',3))).publishedAt,undefined);
 for(const patch of [{publishedAt:'2999-01-01'},{visibility:'private'}])assert.throws(()=>addCatalogueVideo(source(patch),'/books/example','https://youtu.be/aaaaaaaaaaa'));
});


test('book/series source ambiguity is rejected for both the book alias and root canonical',async()=>{
 const {resolveCatalogueVideoSource}=await import('../scripts/catalogue-video.mjs');
 const root=mkdtempSync(path.join(tmpdir(),'abvx-series-ambiguity-'));
 try {
  for(const folder of ['books','series']) {mkdirSync(path.join(root,'content',folder),{recursive:true});writeFileSync(path.join(root,'content',folder,'duplicate.md'),'---\n'+JSON.stringify({slug:'duplicate',type:'series',canonicalPath:'/duplicate'})+'\n---\nuntouched');}
  for(const route of ['/books/duplicate','/duplicate'])assert.throws(()=>resolveCatalogueVideoSource(route,root),/unambiguous/);
  assert.throws(()=>resolveCatalogueVideoSource('/books/../duplicate',root),/Unsupported/);
  assert.ok(readFileSync(path.join(root,'content/books/duplicate.md'),'utf8').endsWith('untouched'));
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('the CLI resolves a declared canonical path independently of the series slug',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-canonical-series-video-'));
 const command=fileURLToPath(new URL('../scripts/catalogue-video.mjs',import.meta.url));
 const data={slug:'foo',type:'series',status:'released',visibility:'public',canonicalPath:'/bar',links:[]};
 const source='---\n'+JSON.stringify(data)+'\n---\nOriginal series prose.\n';
 try {
  const file=path.join(root,'content/series/foo.md');mkdirSync(path.dirname(file),{recursive:true});
  for(const route of ['/bar','/books/foo']) {
   writeFileSync(file,source);
   const args=[command,'--route',route,'--video','https://youtu.be/aaaaaaaaaaa'];
   const run=extra=>JSON.parse(execFileSync(process.execPath,[...args,...extra],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}));
   assert.equal(run([]).sourceFile,'content/series/foo.md');assert.equal(readFileSync(file,'utf8'),source);
   assert.equal(run(['--write']).changed,true);const written=readFileSync(file,'utf8');
   const after=JSON.parse(written.slice(3,written.indexOf('\n---',3)));assert.equal(after.slug,'foo');assert.equal(after.canonicalPath,'/bar');assert.equal(after.publishedAt,undefined);
   assert.equal(run(['--write']).changed,false);assert.equal(readFileSync(file,'utf8'),written);
  }
  const duplicate=path.join(root,'content/series/another.md');writeFileSync(duplicate,'---\n'+JSON.stringify({...data,slug:'another'})+'\n---\nOther prose.');
  assert.throws(()=>execFileSync(process.execPath,[command,'--route','/bar','--video','https://youtu.be/aaaaaaaaaaa','--write'],{cwd:root,stdio:['ignore','pipe','pipe']}));
  assert.ok(!existsSync(path.join(root,'content/series/bar.md')));
 }finally{rmSync(root,{recursive:true,force:true});}
});
