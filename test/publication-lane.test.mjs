import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const command = new URL('../scripts/publication-lane.mjs', import.meta.url).pathname;
const hash = value => createHash('sha256').update(value).digest('hex');
function fixture(run) {
 const root = mkdtempSync(path.join(tmpdir(), 'abvx-lane-'));
 const git = (...args) => execFileSync('git', args, {cwd:root, encoding:'utf8', stdio:'pipe'}).trim();
 try {
  git('init','-q');writeFileSync(path.join(root,'README.md'),'base');git('add','.');
  git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','base');
  const base = git('rev-parse','HEAD');
  const invoke = (args) => execFileSync(process.execPath,[command,'--base',base,...args],{cwd:root,encoding:'utf8',stdio:'pipe'});
  // Packets and original assets live outside the site checkout.
  const inputs = mkdtempSync(path.join(tmpdir(),'abvx-lane-input-'));
  try { run({root,base,git,invoke,inputs}); } finally {rmSync(inputs,{recursive:true,force:true});}
 } finally {rmSync(root,{recursive:true,force:true});}
}
function packet(inputs, slug, story=false) {
 const body = 'Author prose.\n\n## Choice\n\nAn example.';
 const data = story ? {title:slug,slug,date:'2020-01-01',type:'working-story',series:'working-stories',story_id:'ws-001',cluster:'project-001',period:null,topics:[],book:{include:false,status:'excluded'},visibility:'public',language:'en'}
  : {id:slug,slug,title:slug,type:'article',primarySection:'writing',appearsIn:['writing'],status:'live',visibility:'public',publishedAt:'2020-01-01',summary:'Original summary.',tags:[],links:[],language:'en',seoTitle:'A distinct search title'};
 const source = `---\n${JSON.stringify(data)}\n---\n\n${body}\n`;
 const value = {schema_version:'v1',mode:'REPORT_ONLY_HANDOFF',project:'abvxsite',surface:story?'working-stories':'writing',kind:data.type,slug,title:slug,consumer_operation:{id:story?'abvx.publish-working-story':'abvx.publish-writing',target_surface:story?'abvx.working-story':'abvx.writing'},payload:{source_markdown:source,source_sha256:hash(source),body_lines:[body],language:'en',date_published:data.date||data.publishedAt,media_assets:[]},enrichment:{meta_description:data.summary||'Story.',tags:[]}};
 const file = path.join(inputs,slug+'.json');writeFileSync(file,JSON.stringify(value));return {file,value,source};
}
test('one content-only command dry-runs then publishes a mixed pool byte-for-byte',()=>fixture(({root,invoke,inputs})=>{
 const a=packet(inputs,'a-note'), b=packet(inputs,'a-story',true);
 const args=['--packet',a.file,'--packet',b.file];
 assert.equal(JSON.parse(invoke([...args,'--dry-run'])).members.length,2);
 assert.equal(existsSync(path.join(root,'content')),false);
 invoke([...args,'--write']);
 assert.equal(readFileSync(path.join(root,'content/writing/a-note.md'),'utf8'),a.source);
 assert.equal(readFileSync(path.join(root,'content/working-stories/ws-001-a-story.md'),'utf8'),b.source);
 assert.equal(JSON.parse(invoke(['--check'])).profile,'publication-v1');
 assert.throws(()=>invoke([...args,'--write']),/clean checkout/);
}));
test('invalid second member and duplicate story IDs leave the entire pool unwritten',()=>fixture(({root,invoke,inputs})=>{
 const a=packet(inputs,'a-note'), b=packet(inputs,'bad-note');b.value.payload.source_sha256='0'.repeat(64);writeFileSync(b.file,JSON.stringify(b.value));
 assert.throws(()=>invoke(['--packet',a.file,'--packet',b.file,'--write']),/source hash/);
 assert.equal(existsSync(path.join(root,'content')),false);
 const c=packet(inputs,'story-one',true), d=packet(inputs,'story-two',true);
 assert.throws(()=>invoke(['--packet',c.file,'--packet',d.file,'--write']),/Duplicate/);
 assert.equal(existsSync(path.join(root,'content')),false);
}));
test('unknown base, pending application changes and committed engineering changes are refused',()=>fixture(({root,invoke,inputs,git})=>{
 const a=packet(inputs,'a-note');
 assert.throws(()=>execFileSync(process.execPath,[command,'--base','0'.repeat(40),'--packet',a.file,'--write'],{cwd:root,stdio:'pipe'}));
 writeFileSync(path.join(root,'package.json'),'{}');
 assert.throws(()=>invoke(['--packet',a.file,'--write']),/clean checkout/);
 git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','engineering');
 assert.throws(()=>invoke(['--packet',a.file,'--write']),/separate engineering/);
 assert.equal(existsSync(path.join(root,'content')),false);
}));
test('publication boundary rejects documentation mixed with an otherwise valid post',()=>fixture(({root,invoke,inputs})=>{
 invoke(['--packet',packet(inputs,'a-note').file,'--write']);
 writeFileSync(path.join(root,'README.md'),'unrelated change');
 assert.throws(()=>invoke(['--check']),/publication boundary/);
}));
test('approved shared assets are written once; conflicting assets reject the pool before writes',()=>fixture(({root,invoke,inputs})=>{
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7xkAAAAASUVORK5CYII=','base64');
 const asset=path.join(inputs,'cover.png');writeFileSync(asset,bytes);
 const a=packet(inputs,'one'), b=packet(inputs,'two');
 for(const item of [a,b]) {
  const source=item.source.replace('"seoTitle":', '"media":{"src":"/media/writing/shared.png","alt":"Approved cover","width":1,"height":1},"seoTitle":');
  item.value.payload.source_markdown=source;item.value.payload.source_sha256=hash(source);
  item.value.payload.media_assets=[{source:asset,target:'/media/writing/shared.png',sha256:hash(bytes)}];writeFileSync(item.file,JSON.stringify(item.value));
 }
 const other=path.join(inputs,'other.png'), changed=Buffer.concat([bytes,Buffer.from('different')]);writeFileSync(other,changed);
 b.value.payload.media_assets=[{source:other,target:'/media/writing/shared.png',sha256:hash(changed)}];writeFileSync(b.file,JSON.stringify(b.value));
 assert.throws(()=>invoke(['--packet',a.file,'--packet',b.file,'--write']),/Conflicting pool media/);
 assert.equal(existsSync(path.join(root,'content')),false);
 b.value.payload.media_assets=a.value.payload.media_assets;writeFileSync(b.file,JSON.stringify(b.value));
 invoke(['--packet',a.file,'--packet',b.file,'--write']);
 assert.deepEqual(readFileSync(path.join(root,'public/media/writing/shared.png')),bytes);
}));
test('the routine lane refuses unsigned legacy source, unsupported kinds and malformed SEO before writes',()=>fixture(({root,invoke,inputs})=>{
 const item=packet(inputs,'test-note');
 delete item.value.payload.source_markdown;writeFileSync(item.file,JSON.stringify(item.value));
 assert.throws(()=>invoke(['--packet',item.file,'--write']),/complete approved source/);
 for(const patch of [{type:'new-kind'}, {seoTitle:42}, {tags:null}]) {
  const next=packet(inputs,'test-note');const source=next.source.replace(/---\n(.*?)\n---/s,(_,json)=>'---\n'+JSON.stringify({...JSON.parse(json),...patch})+'\n---');
  next.value.kind=patch.type||next.value.kind;next.value.payload.source_markdown=source;next.value.payload.source_sha256=hash(source);writeFileSync(next.file,JSON.stringify(next.value));
  assert.throws(()=>invoke(['--packet',next.file,'--write']));
 }
 assert.equal(existsSync(path.join(root,'content')),false);
}));
test('a later write collision rolls back earlier pool files without changing existing bytes',async()=>{
 const {applyPublications}=await import('../scripts/publication-media.mjs');
 const root=mkdtempSync(path.join(tmpdir(),'abvx-lane-rollback-'));
 try {
  const first=path.join(root,'one.md'), occupied=path.join(root,'two.md');writeFileSync(occupied,'original');
  assert.throws(()=>applyPublications([{targetFile:first,source:'new',media:[]},{targetFile:occupied,source:'different',media:[]}]),/EEXIST/);
  assert.equal(existsSync(first),false);assert.equal(readFileSync(occupied,'utf8'),'original');
 }finally{rmSync(root,{recursive:true,force:true});}
});
