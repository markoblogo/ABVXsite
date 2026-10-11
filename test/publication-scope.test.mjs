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
