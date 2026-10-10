import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,symlinkSync,unlinkSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {editorialTreeDigest} from '../scripts/editorial-checks-tree.mjs';
test('release digest detects untracked, changed and removed public sources',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-tree-'));execFileSync('git',['init','-q'],{cwd:root});
 writeFileSync(path.join(root,'source.md'),'first');const a=editorialTreeDigest(root);
 writeFileSync(path.join(root,'source.md'),'second');assert.notEqual(a,editorialTreeDigest(root));
 writeFileSync(path.join(root,'another.md'),'third');const b=editorialTreeDigest(root);assert.notEqual(a,b);
 const outside=mkdtempSync(path.join(tmpdir(),'abvx-outside-'));writeFileSync(path.join(outside,'secret'),'test-only');symlinkSync(path.join(outside,'secret'),path.join(root,'bad.md'));
 assert.throws(()=>editorialTreeDigest(root),/Symlink/);
});

test('tracked unstaged deletions and executable modes change evidence',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-tree-'));execFileSync('git',['init','-q'],{cwd:root});
 const file=path.join(root,'source.md');writeFileSync(file,'same');chmodSync(file,0o644);execFileSync('git',['add','source.md'],{cwd:root});
 const a=editorialTreeDigest(root);chmodSync(file,0o755);assert.notEqual(a,editorialTreeDigest(root));chmodSync(file,0o644);assert.equal(a,editorialTreeDigest(root));
 unlinkSync(file);const removed=editorialTreeDigest(root);assert.notEqual(a,removed);writeFileSync(file,'same');chmodSync(file,0o644);assert.equal(a,editorialTreeDigest(root));
});
