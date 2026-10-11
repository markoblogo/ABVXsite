import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { editorialTreeDigest } from './editorial-checks-tree.mjs';

const args = process.argv.slice(2);
if (args.some(arg => arg !== '--webpack')) throw new Error('Only the local --webpack build fallback is supported');
const output = path.join(process.cwd(), 'exports/editorial-checks');
mkdirSync(output, { recursive: true });
const checks = ['content:validate', 'ecosystem:check', 'lint', 'test:sync', 'cortex-abv:vector-export:check', 'build', 'qa:seo'];
const started = performance.now();
const receipt = {
  checkedAt: new Date().toISOString(),
  head: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(),
  dirty: Boolean(spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).stdout.trim()),
  buildMode: args.includes('--webpack') ? 'webpack-local-fallback' : 'default',
  result: 'RUNNING', checks: [],
};
const save = () => {
  receipt.durationMs = Math.round(performance.now() - started);
  writeFileSync(path.join(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
};
async function runCheck(name) {
  const commandArgs = name === 'dependency-audit' ? ['audit', '--omit=dev', '--audit-level=high']
    : ['run', name, ...(name === 'build' && args.includes('--webpack') ? ['--', '--webpack'] : [])];
  const checkStarted = performance.now();
  const log = await new Promise(resolve => {
    const child = spawn('npm', commandArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '', bytes = 0;
    const append = chunk => {
      bytes += chunk.length;
      if (bytes > 4 * 1024 * 1024) { child.kill('SIGTERM'); return; }
      output += chunk.toString();
    };
    child.stdout.on('data', append); child.stderr.on('data', append);
    child.on('error', error => { output += error.message; });
    child.on('close', status => resolve({ output, status: bytes > 4 * 1024 * 1024 ? null : status }));
  });
  writeFileSync(path.join(output, `${name.replaceAll(':', '-')}.log`), log.output);
  return { name, status: log.status === 0 ? 'PASS' : 'FAIL',
    sha256: createHash('sha256').update(log.output).digest('hex'),
    durationMs: Math.round(performance.now() - checkStarted) };
}
// Source checks fail early. Independent read-only checks share a phase; build
// and browser QA remain sequential. Receipt order stays compatible with OS.
const phases = [['content:validate'], ['ecosystem:check'], ['lint', 'test:sync', 'cortex-abv:vector-export:check'], ['build'], ['qa:seo'], ['dependency-audit']];
if (phases.flat().join('|') !== [...checks, 'dependency-audit'].join('|')) throw new Error('Release gate order changed');
for (const phase of phases) {
  const results = await Promise.all(phase.map(runCheck));
  receipt.checks.push(...results); save();
  for (const check of results) console.log(`${check.name}: ${check.status}`);
  if (results.some(check => check.status !== 'PASS')) {
    receipt.result = 'FAIL'; save();
    console.error('Release check failed; see the retained log for each failed gate.');
    process.exit(1);
  }
}
receipt.treeDigest = editorialTreeDigest();
receipt.result = 'PASS'; receipt.durationMs = Math.round(performance.now() - started); save();
console.log('Editorial release checks passed; receipt and logs: exports/editorial-checks/. Commit intended generated indexes with the source. Production remains a separate gate.');
