import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { deploymentScope } from '../scripts/deployment-scope.mjs';

test('build scope follows successful baseline and fails open on unknown history', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'abvx-build-scope-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const commit = () => { git('add', '.'); git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture'); return git('rev-parse', 'HEAD'); };
  try {
    git('init', '-q'); mkdirSync(path.join(root, 'docs'));
    writeFileSync(path.join(root, 'README.md'), 'initial'); const deployed = commit();
    writeFileSync(path.join(root, 'docs', 'runbook.md'), 'docs'); commit();
    assert.equal(deploymentScope(deployed, 'HEAD', root).build, false);
    assert.equal(deploymentScope(undefined, 'HEAD', root).build, true);
    assert.equal(deploymentScope('0'.repeat(40), 'HEAD', root).build, true);
    assert.equal(deploymentScope(git('rev-parse', 'HEAD'), 'HEAD', root).build, true);
    // A runtime commit failed to deploy, then a documentation-only commit arrived.
    writeFileSync(path.join(root, 'source.ts'), 'runtime'); const failed = commit();
    writeFileSync(path.join(root, 'README.md'), 'updated'); commit();
    assert.equal(deploymentScope(failed, 'HEAD', root).build, false);
    assert.equal(deploymentScope(deployed, 'HEAD', root).build, true);
    // Renames must expose both source and destination, even with identical bytes.
    const beforeRename = git('rev-parse', 'HEAD');
    renameSync(path.join(root, 'docs', 'runbook.md'), path.join(root, 'runtime.md')); commit();
    assert.equal(deploymentScope(beforeRename, 'HEAD', root).build, true);
    const beforeDelete = git('rev-parse', 'HEAD');
    rmSync(path.join(root, 'source.ts')); commit();
    assert.equal(deploymentScope(beforeDelete, 'HEAD', root).build, true);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
