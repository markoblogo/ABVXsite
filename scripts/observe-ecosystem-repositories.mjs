import { readFileSync, writeFileSync } from 'node:fs';
import { applyRepositoryObservations } from './ecosystem-registry-lib.mjs';

const graphPath = 'cortex-abv/ecosystem-graph.v1.json';
const changesPath = process.argv.includes('--changes-output')
  ? process.argv[process.argv.indexOf('--changes-output') + 1]
  : 'cortex-abv/ecosystem-changes.v1.json';
const token = process.env.ECOSYSTEM_SYNC_TOKEN || process.env.GITHUB_TOKEN;

function headers() {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ABVX-Ecosystem-Sync/1.0',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubJson(url, { optional = false } = {}) {
  const response = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(15000) });
  if (optional && response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${url}`);
  return response.json();
}

async function observe(node) {
  const repository = await githubJson(`https://api.github.com/repos/${node.repository}`, { optional: node.visibility === 'private' });
  if (!repository) return null;
  const release = await githubJson(`https://api.github.com/repos/${node.repository}/releases/latest`, { optional: true });
  return {
    repository: node.repository,
    description: repository.description || null,
    homepageUrl: repository.homepage || null,
    defaultBranch: repository.default_branch,
    latestRelease: release ? { tag: release.tag_name, url: release.html_url, publishedAt: release.published_at } : null,
  };
}

const graph = JSON.parse(readFileSync(graphPath, 'utf8'));
const observations = (await Promise.all(graph.nodes.map(observe))).filter(Boolean);
const observedAt = new Date().toISOString();
const result = applyRepositoryObservations({ graph, observations, observedAt });
writeFileSync(graphPath, `${JSON.stringify(result.graph, null, 2)}\n`);
writeFileSync(changesPath, `${JSON.stringify({ schemaVersion: 1, kind: 'ABVXEcosystemChangeSet', observedAt, changes: result.changes }, null, 2)}\n`);
if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `has_changes=${result.changes.length > 0}\n`, { flag: 'a' });
console.log(`Observed ${observations.length} repositories; ${result.changes.length} node(s) changed.`);
