import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { publicationScope } from '../scripts/publication-scope.mjs';
test('publication QA is narrow only for a known, content-only diff including untracked files', () => {
 const root=mkdtempSync(path.join(tmpdir(),'abvx-scope-'));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 try {
  git('init','-q');mkdirSync(path.join(root,'content/writing'),{recursive:true});
  writeFileSync(path.join(root,'README.md'),'fixture');git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','base');const base=git('rev-parse','HEAD');
  const post=path.join(root,'content/writing/post.md');
  writeFileSync(post,'---\n'+JSON.stringify({slug:'post',status:'live',visibility:'public',publishedAt:'2026-01-01',title:'Post'})+'\n---\nHello.');
  const scope=publicationScope(base,'HEAD',root,true);
  assert.equal(scope.profile,'publication-v1');assert.deepEqual(scope.routes,['/writing/post']);
  assert.equal(publicationScope(undefined,'HEAD',root,true).profile,'full');
  mkdirSync(path.join(root,'src'));writeFileSync(path.join(root,'src/shared.ts'),'changed');
  assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
  rmSync(path.join(root,'src'),{recursive:true});
  writeFileSync(post,'---\n'+JSON.stringify({slug:'post',visibility:'private',status:'live',publishedAt:'2026-01-01'})+'\n---\nHello.');
  assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
  writeFileSync(post,'---\n'+JSON.stringify({slug:'post',visibility:'public',status:'live',publishedAt:'2999-01-01'})+'\n---\nHello.');
  assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
 } finally {rmSync(root,{recursive:true,force:true});}
});
test('committed pools stay scoped; deletions, slug changes and existing media edits force full QA',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-scope-pool-'));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 const post=slug=>'---\n'+JSON.stringify({slug,title:slug,visibility:'public',status:'live',publishedAt:'2026-01-01'})+'\n---\nText.';
 const commit=()=>{git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','fixture');return git('rev-parse','HEAD');};
 try {
  git('init','-q');mkdirSync(path.join(root,'content/writing'),{recursive:true});mkdirSync(path.join(root,'public/media'),{recursive:true});
  writeFileSync(path.join(root,'content/writing/old.md'),post('old'));writeFileSync(path.join(root,'public/media/existing.png'),'old');const base=commit();
  writeFileSync(path.join(root,'content/writing/one.md'),post('one'));writeFileSync(path.join(root,'content/writing/two.md'),post('two'));commit();
  assert.deepEqual(publicationScope(base,'HEAD',root).routes,['/writing/one','/writing/two']);
  writeFileSync(path.join(root,'public/media/existing.png'),'edited');assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
  writeFileSync(path.join(root,'public/media/existing.png'),'old');writeFileSync(path.join(root,'content/writing/old.md'),post('renamed'));assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
  writeFileSync(path.join(root,'content/writing/old.md'),post('old'));rmSync(path.join(root,'content/writing/old.md'));assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
 } finally{rmSync(root,{recursive:true,force:true});}
});

test('catalogue data and media choose scoped QA, while route changes, engineering and mixed families fail closed',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-catalogue-scope-'));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 const source=(slug,patch={})=>'---\n'+JSON.stringify({id:slug,slug,title:slug,type:'tool',status:'building',visibility:'public',publishedAt:'2020-01-01',primarySection:'systems',appearsIn:['systems'],...patch})+'\n---\nDescription.';
 try {
  git('init','-q');writeFileSync(path.join(root,'README.md'),'base');git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','base');const base=git('rev-parse','HEAD');
  mkdirSync(path.join(root,'content/work'),{recursive:true});mkdirSync(path.join(root,'content/books'),{recursive:true});
  writeFileSync(path.join(root,'content/work/tool.md'),source('tool'));
  writeFileSync(path.join(root,'content/books/book.md'),source('book',{primarySection:'books',appearsIn:['books'],status:'released',type:'book'}));
  const scope=publicationScope(base,'HEAD',root,true);assert.equal(scope.profile,'catalogue-v1');assert.deepEqual(scope.routes,['/books/book','/work/tool']);assert.deepEqual(scope.hubs,['/','/books','/systems']);
  writeFileSync(path.join(root,'content/work/tool.md'),source('tool',{canonicalPath:'/custom'}));assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
  writeFileSync(path.join(root,'content/work/tool.md'),source('tool'));
  mkdirSync(path.join(root,'content/writing'));writeFileSync(path.join(root,'content/writing/post.md'),source('post',{primarySection:'writing',status:'live'}));assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
  rmSync(path.join(root,'content/writing'),{recursive:true});writeFileSync(path.join(root,'package.json'),'{}');assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('existing Focus-cross-listed catalogue video additions stay scoped; other edits still require full QA',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-video-scope-'));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 const original={id:'guide',slug:'guide',title:'Guide',type:'free-book',status:'released',visibility:'public',publishedAt:'2020-01-01',primarySection:'books',appearsIn:['books','focus'],links:[{type:'pdf',url:'https://example.com/book.pdf'}]};
 const file=path.join(root,'content/books/guide.md');
 const source=data=>'---\n'+JSON.stringify(data)+'\n---\nApproved prose.';
 const added={...original,updatedAt:'2026-10-15',links:[...original.links,{type:'youtube',label:'Book trailer',url:'https://youtu.be/aaaaaaaaaaa'}]};
 try {
  git('init','-q');mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,source(original));git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','base');const base=git('rev-parse','HEAD');
  writeFileSync(file,source(added));const scope=publicationScope(base,'HEAD',root,true);
  assert.equal(scope.profile,'catalogue-v1');assert.deepEqual(scope.hubs,['/','/books','/focus']);
  for(const data of [{...added,title:'Changed'}, {...added,appearsIn:['books']}, {...added,links:added.links.slice(1)}]) {
   writeFileSync(file,source(data));assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
  }
  writeFileSync(file,source(added)+'\nChanged prose.');assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
 } finally {rmSync(root,{recursive:true,force:true});}
});

test('updating an existing legacy catalogue type still selects full QA',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-legacy-video-scope-'));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 const data={slug:'legacy',title:'Legacy',type:'index-infrastructure',visibility:'public',status:'live',publishedAt:'2020-01-01',primarySection:'systems',appearsIn:['systems'],links:[]};
 const file=path.join(root,'content/work/legacy.md');const source=value=>'---\n'+JSON.stringify(value)+'\n---\nExisting description.';
 try {
  git('init','-q');mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,source(data));git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','base');const base=git('rev-parse','HEAD');
  writeFileSync(file,source({...data,updatedAt:'2026-10-15',links:[{type:'youtube',url:'https://youtu.be/aaaaaaaaaaa'}]}));
  assert.equal(publicationScope(base,'HEAD',root,true).reason,'unsupported-catalogue-type');
 } finally {rmSync(root,{recursive:true,force:true});}
});

test('an existing project video checks every unchanged catalogue placement, including primary Focus',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-media-placement-'));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 const original={slug:'library',title:'Library',type:'book-companion',visibility:'public',status:'live',publishedAt:'2020-01-01',primarySection:'focus',appearsIn:['focus','systems','books'],links:[]};
 const source=data=>'---\n'+JSON.stringify(data)+'\n---\nApproved prose.';
 const file=path.join(root,'content/work/library.md');
 try {
  git('init','-q');mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,source(original));git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','base');const base=git('rev-parse','HEAD');
  const added={...original,updatedAt:'2026-10-15',links:[{type:'youtube',label:'Launch video',url:'https://youtu.be/aaaaaaaaaaa'}]};
  writeFileSync(file,source(added));const scope=publicationScope(base,'HEAD',root,true);
  assert.equal(scope.profile,'catalogue-v1');assert.deepEqual(scope.routes,['/work/library']);assert.deepEqual(scope.hubs,['/','/books','/focus','/systems']);
  for(const patch of [{title:'Different'}, {primarySection:'systems'}, {appearsIn:['systems']}, {appearsIn:['focus','unknown']}]){
   writeFileSync(file,source({...added,...patch}));assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
  }
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('unchanged published series media use their canonical route and existing legacy date convention',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-series-media-'));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 const data={slug:'line',title:'Line',type:'series',status:'released',visibility:'public',primarySection:'books',appearsIn:['books'],canonicalPath:'/existing-line',links:[]};
 const file=path.join(root,'content/series/line.md');const source=data=>'---\n'+JSON.stringify(data)+'\n---\nOriginal series prose.';
 try{
  git('init','-q');mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,source(data));git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','base');const base=git('rev-parse','HEAD');
  const added={...data,updatedAt:'2026-10-15',links:[{type:'pdf',label:'Catalogue',url:'https://example.com/line.pdf'}]};
  writeFileSync(file,source(added));const scope=publicationScope(base,'HEAD',root,true);
  assert.equal(scope.profile,'catalogue-v1');assert.deepEqual(scope.routes,['/existing-line']);assert.deepEqual(scope.hubs,['/','/books']);
  writeFileSync(file,source({...added,canonicalPath:'/different-line'}));assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
  writeFileSync(file,source({...added,title:'Changed'}));assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('an amended new article and cover remain additions relative to the release base',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-scope-amend-'));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 const commit=()=>{git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','fixture');return git('rev-parse','HEAD');};
 try {
  git('init','-q');writeFileSync(path.join(root,'README.md'),'base');const base=commit();
  mkdirSync(path.join(root,'content/writing'),{recursive:true});mkdirSync(path.join(root,'public/media'),{recursive:true});
  const post=path.join(root,'content/writing/post.md');const cover=path.join(root,'public/media/new.webp');
  const source=text=>'---\n'+JSON.stringify({slug:'post',title:'Post',status:'live',visibility:'public',publishedAt:'2020-01-01'})+'\n---\n'+text;
  writeFileSync(post,source('First draft.'));writeFileSync(cover,'first');commit();
  writeFileSync(post,source('Corrected approved prose.'));writeFileSync(cover,'corrected');
  assert.equal(publicationScope(base,'HEAD',root,true).profile,'publication-v1');
  git('add','.');assert.equal(publicationScope(base,'HEAD',root,true).profile,'publication-v1');
  rmSync(post);assert.equal(publicationScope(base,'HEAD',root,true).reason,'no-native-publication');
 } finally {rmSync(root,{recursive:true,force:true});}
});

test('removing an existing media file from the index and readding it untracked cannot disguise replacement as new media',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-scope-replace-'));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 try {
  git('init','-q');mkdirSync(path.join(root,'public/media'),{recursive:true});writeFileSync(path.join(root,'public/media/old.webp'),'old');git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','base');const base=git('rev-parse','HEAD');
  git('rm','--cached','public/media/old.webp');writeFileSync(path.join(root,'public/media/old.webp'),'replacement');
  mkdirSync(path.join(root,'content/writing'),{recursive:true});writeFileSync(path.join(root,'content/writing/post.md'),'---\n'+JSON.stringify({slug:'post',title:'Post',status:'live',visibility:'public',publishedAt:'2020-01-01'})+'\n---\nProse.');
  assert.equal(publicationScope(base,'HEAD',root,true).profile,'full');
 }finally{rmSync(root,{recursive:true,force:true});}
});
