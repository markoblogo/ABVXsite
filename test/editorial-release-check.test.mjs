import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, readFileSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
function run(fail = '') {
  const root = mkdtempSync(path.join(tmpdir(), 'abvx-release-'));
  try {
    mkdirSync(path.join(root, 'scripts')); mkdirSync(path.join(root, 'bin'));
    for (const file of ['editorial-release-check.mjs', 'editorial-checks-tree.mjs']) copyFileSync('scripts/' + file, path.join(root, 'scripts', file));
    writeFileSync(path.join(root, '.gitignore'), 'exports/\nevents\n');
    execFileSync('git', ['init', '-q'], { cwd: root });
    const npm = path.join(root, 'bin/npm');
    writeFileSync(npm, '#!' + process.execPath + `
const fs = require('node:fs');
const name = process.argv[2] === 'audit' ? 'dependency-audit' : process.argv[3];
fs.appendFileSync('events', name + ':start\\n');
setTimeout(() => { fs.appendFileSync('events', name + ':end\\n'); console.log(name); process.exit(name === process.env.FAIL_GATE ? 1 : 0); }, 50);
`);
    chmodSync(npm, 0o755);
    const result = spawnSync(process.execPath, ['scripts/editorial-release-check.mjs'], { cwd: root, encoding: 'utf8', env: { ...process.env, PATH: path.join(root, 'bin') + ':' + process.env.PATH, FAIL_GATE: fail } });
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
  assert.ok(events.indexOf('build:start') > events.indexOf('test:sync:end'));
  assert.ok(events.indexOf('qa:seo:start') > events.indexOf('build:end'));
  assert.match(receipt.treeDigest, /^[a-f0-9]{64}$/);
});
