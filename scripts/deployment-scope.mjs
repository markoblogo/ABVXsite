import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const documentation = /^(?:README\.md|AGENTS\.md|CHANGELOG\.md|docs\/.+\.md)$/;

export function deploymentScope(base, head = 'HEAD', cwd = process.cwd()) {
  // Unknown history must build. In Vercel, base is the last successful deployment,
  // never HEAD^: a failed source build followed by a docs commit still needs a build.
  if (!/^[a-f0-9]{40}$/i.test(base || '')) return { build: true, reason: 'unknown-base' };
  try {
    const changed = execFileSync('git', ['diff', '--no-renames', '--name-only', '-z', base, head, '--'],
      { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).split('\0').filter(Boolean);
    const docsOnly = changed.length > 0 && changed.every(file => documentation.test(file));
    return { build: !docsOnly, reason: docsOnly ? 'documentation-only' : 'runtime-or-empty-diff', changed };
  } catch {
    return { build: true, reason: 'history-unavailable' };
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const mode = process.argv[2];
  if (mode !== '--vercel' && mode !== '--ci') throw new Error('Expected --vercel or --ci');
  const base = mode === '--vercel' ? process.env.VERCEL_GIT_PREVIOUS_SHA : process.env.CI_BASE_SHA;
  const result = deploymentScope(base);
  console.log(`build=${result.build}`);
  console.log(`reason=${result.reason}`);
  // Vercel ignored-build convention: 0 skips, 1 builds. CI always succeeds;
  // its output gates only the application build, not the other checks.
  if (mode === '--vercel') process.exit(result.build ? 1 : 0);
}
