import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { getSyncTargets } from './project-description-sync-lib.mjs';
import { createObservedEventBatch } from './cortex-abv-lib.mjs';

const outputIndex = process.argv.indexOf('--output');
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : undefined;
const slugIndex = process.argv.indexOf('--slug');
const requestedSlug = slugIndex >= 0 ? process.argv[slugIndex + 1] : undefined;

function githubHeaders() {
  const token = process.env.SOURCE_REPOS_TOKEN || process.env.GITHUB_TOKEN;
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'cortex-abv-observer',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readCommit(repository, ref) {
  const response = await fetch(`https://api.github.com/repos/${repository}/commits/${encodeURIComponent(ref)}`, { headers: githubHeaders() });
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${repository}@${ref}`);
  const commit = await response.json();
  if (typeof commit.sha !== 'string' || !commit.sha) throw new Error(`GitHub returned no commit SHA: ${repository}@${ref}`);
  return commit.sha;
}

function writeGithubOutputs(batch) {
  if (!process.env.GITHUB_OUTPUT) return;
  const targetSlugs = batch.proposals.map((proposal) => proposal.target.slug).join(' ');
  writeFileSync(process.env.GITHUB_OUTPUT, `has_changes=${batch.shouldRunCopySync}\ntarget_slugs=${targetSlugs}\n`, { flag: 'a' });
}

export async function run() {
  if (!outputPath) throw new Error('--output <path> is required');
  const configuredTargets = getSyncTargets().filter((target) => !requestedSlug || target.data.slug === requestedSlug);
  if (requestedSlug && !configuredTargets.length) throw new Error(`No enabled project-sync target for slug: ${requestedSlug}`);
  const targets = await Promise.all(configuredTargets.map(async (target) => ({
    slug: target.data.slug,
    sync: target.sync,
    sourceCommit: await readCommit(target.sync.repository, target.sync.ref),
  })));
  const batch = createObservedEventBatch({ targets, observedAt: new Date().toISOString() });
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(batch, null, 2)}\n`);
  writeGithubOutputs(batch);
  console.log(`${batch.proposals.length} observed CortexABV project-sync event(s); copy sync ${batch.shouldRunCopySync ? 'required' : 'not required'}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(`CortexABV observation failed: ${error.message}`);
    process.exitCode = 1;
  });
}
