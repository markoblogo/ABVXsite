import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

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
for (const name of [...checks, 'dependency-audit']) {
  const commandArgs = name === 'dependency-audit' ? ['audit', '--omit=dev', '--audit-level=high']
    : ['run', name, ...(name === 'build' && args.includes('--webpack') ? ['--', '--webpack'] : [])];
  const checkStarted = performance.now();
  const result = spawnSync('npm', commandArgs, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  writeFileSync(path.join(output, `${name.replaceAll(':', '-')}.log`), (result.stdout || '') + (result.stderr || ''));
  receipt.checks.push({ name, status: result.status === 0 ? 'PASS' : 'FAIL', durationMs: Math.round(performance.now() - checkStarted) });
  save();
  console.log(`${name}: ${receipt.checks.at(-1).status}`);
  if (result.status !== 0) {
    receipt.result = 'FAIL'; save();
    console.error(result.error?.message || (result.stderr || result.stdout || '').split('\n').slice(-15).join('\n'));
    process.exit(1);
  }
}
receipt.result = 'PASS'; receipt.durationMs = Math.round(performance.now() - started); save();
console.log('Editorial release checks passed; receipt and logs: exports/editorial-checks/. Commit intended generated indexes with the source. Production remains a separate gate.');
