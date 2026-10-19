import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, readFileSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
function run(fail = '', publication = false) {
  const root = mkdtempSync(path.join(tmpdir(), 'abvx-release-'));
  try {
    mkdirSync(path.join(root, 'src/content'), {recursive:true});
    copyFileSync('src/content/markdown-source.mjs',path.join(root,'src/content/markdown-source.mjs'));
    mkdirSync(path.join(root, 'scripts')); mkdirSync(path.join(root, 'bin'));
    mkdirSync(path.join(root,'src/lib'),{recursive:true});
    for(const file of ['youtube-pages.mjs','writing-chronology.mjs','media-policy.mjs','youtube-url.mjs'])copyFileSync('src/lib/'+file,path.join(root,'src/lib',file));
    for (const file of ['editorial-release-check.mjs', 'editorial-checks-tree.mjs', 'publication-scope.mjs', 'publication-metadata.mjs', 'catalogue-video.mjs', 'catalogue-media.mjs']) copyFileSync('scripts/' + file, path.join(root, 'scripts', file));
    writeFileSync(path.join(root, '.gitignore'), 'exports/\nevents\n');
    execFileSync('git', ['init', '-q'], { cwd: root });
    const npm = path.join(root, 'bin/npm');
    writeFileSync(npm, '#!' + process.execPath + `
const fs = require('node:fs');
const name = process.argv[2] === 'audit' ? 'dependency-audit' : process.argv[3];
fs.appendFileSync('events', name + ':start\\n');
// Synchronize fake independent gates instead of assuming process startup takes <50ms.
const phase = JSON.parse(process.env.PHASE_MEMBERS || '[]');
const deadline = Date.now() + 10000;
const timer = setInterval(() => {
  const events = fs.readFileSync('events', 'utf8');
  if (phase.includes(name) && !phase.every(member => events.includes(member + ':start'))) {
    if (Date.now() > deadline) { clearInterval(timer); process.exit(2); }
    return;
  }
  clearInterval(timer); fs.appendFileSync('events', name + ':end\\n'); console.log(name);
  process.exit(name === process.env.FAIL_GATE ? 1 : 0);
}, 10);
`);
    chmodSync(npm, 0o755);
    execFileSync('git',['add','.'],{cwd:root});
    execFileSync('git',['-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','base'],{cwd:root});
    execFileSync('git',['update-ref','refs/remotes/origin/main','HEAD'],{cwd:root});
    if(publication==='catalogue') {
      mkdirSync(path.join(root,'content/work'),{recursive:true});
      writeFileSync(path.join(root,'content/work/project.md'),'---\n'+JSON.stringify({slug:'project',title:'Project',type:'tool',visibility:'public',status:'building',publishedAt:'2026-01-01',primarySection:'systems',appearsIn:['systems']})+'\n---\nProject.');
    } else if(publication) {
      mkdirSync(path.join(root,'content/writing'),{recursive:true});
      writeFileSync(path.join(root,'content/writing/post.md'),'---\n'+JSON.stringify({slug:'post',title:'Post',visibility:'public',status:'live',publishedAt:'2026-01-01'})+'\n---\nA post.');
    }
    const result = spawnSync(process.execPath, ['scripts/editorial-release-check.mjs'], { cwd: root, encoding: 'utf8', env: { ...process.env, PATH: path.join(root, 'bin') + ':' + process.env.PATH, FAIL_GATE: fail, PHASE_MEMBERS: JSON.stringify(publication ? ['test:publication','dependency-audit'] : ['lint','test:sync','cortex-abv:vector-export:check','dependency-audit']) } });
    return { result, receipt: JSON.parse(readFileSync(path.join(root, 'exports/editorial-checks/receipt.json'), 'utf8')), events: readFileSync(path.join(root, 'events'), 'utf8') };
  } finally { rmSync(root, { recursive: true, force: true }); }
}
test('cheap failures stop before build; parallel failure cannot yield a passing receipt', () => {
  for (const fail of ['content:validate', 'lint']) {
    const { result, receipt, events } = run(fail);
    assert.equal(result.status, 1); assert.equal(receipt.result, 'FAIL');
    assert.ok(!events.includes('build:start')); assert.ok(!receipt.treeDigest);
  }
});
test('independent checks overlap but build and SEO wait; logs and ordered gates stay compatible', () => {
  const { result, receipt, events } = run();
  assert.equal(result.status, 0, result.stderr); assert.equal(receipt.result, 'PASS');
  assert.deepEqual(receipt.checks.map(check => check.name), ['content:validate', 'ecosystem:check', 'lint', 'test:sync', 'cortex-abv:vector-export:check', 'build', 'qa:seo', 'dependency-audit']);
  assert.ok(events.indexOf('test:sync:start') < events.indexOf('lint:end'));
  assert.ok(events.indexOf('dependency-audit:start') < events.indexOf('lint:end'));
  assert.equal(receipt.qaScope.profile, 'full');
  assert.ok(events.indexOf('build:start') > events.indexOf('test:sync:end'));
  assert.ok(events.indexOf('qa:seo:start') > events.indexOf('build:end'));
  assert.match(receipt.treeDigest, /^[a-f0-9]{64}$/);
});

test('content-only release runs its real six gates, never fabricates unrelated lint/vector passes',()=>{
 const {result,receipt,events}=run('',true);
 assert.equal(result.status,0,result.stderr);assert.equal(receipt.checkProfile,'publication-v1');
 assert.deepEqual(receipt.checks.map(c=>c.name),['content:validate','ecosystem:check','test:publication','build','qa:seo','dependency-audit']);
 assert.ok(!events.includes('lint:start'));assert.ok(!events.includes('test:sync:start'));assert.ok(!events.includes('cortex-abv:vector-export:check:start'));
 const failed=run('test:publication',true);assert.equal(failed.receipt.result,'FAIL');assert.ok(!failed.events.includes('build:start'));
});

test('catalogue-only data gets its own measured profile with the same six actual gates',()=>{
 const {result,receipt,events}=run('','catalogue');
 assert.equal(result.status,0,result.stderr);assert.equal(receipt.checkProfile,'catalogue-v1');
 assert.deepEqual(receipt.qaScope.routes,['/work/project']);
 assert.deepEqual(receipt.checks.map(c=>c.name),['content:validate','ecosystem:check','test:publication','build','qa:seo','dependency-audit']);
 assert.ok(!events.includes('lint:start'));
 const failed=run('test:publication','catalogue');assert.equal(failed.receipt.result,'FAIL');assert.ok(!failed.events.includes('build:start'));
});
