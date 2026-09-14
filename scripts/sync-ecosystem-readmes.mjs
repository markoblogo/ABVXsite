import { readFileSync } from 'node:fs';
import { renderReadmeBlock, upsertManagedReadmeBlock } from './ecosystem-registry-lib.mjs';

const registry = JSON.parse(readFileSync('cortex-abv/ecosystem-registry.v1.json', 'utf8'));
const token = process.env.ECOSYSTEM_SYNC_TOKEN;
const requested = process.argv.includes('--node') ? process.argv[process.argv.indexOf('--node') + 1] : null;
const dryRun = process.argv.includes('--dry-run');
if (!token && !dryRun) throw new Error('ECOSYSTEM_SYNC_TOKEN is required');

const headers = {
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
  'User-Agent': 'ABVX-Ecosystem-Sync/1.0',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function request(url, options = {}) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000), ...options });
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${url}: ${(await response.text()).slice(0, 300)}`);
  return response.json();
}

async function syncNode(node) {
  let repo;
  try {
    repo = await request(`https://api.github.com/repos/${node.repository}`);
  } catch (error) {
    if (dryRun && node.visibility === 'private' && /GitHub 404/.test(error.message)) {
      return { repository: node.repository, status: 'inaccessible_private' };
    }
    throw error;
  }
  const endpoint = `https://api.github.com/repos/${node.repository}/contents/README.md?ref=${encodeURIComponent(repo.default_branch)}`;
  const current = await request(endpoint);
  const readme = Buffer.from(current.content, 'base64').toString('utf8');
  const next = upsertManagedReadmeBlock({ readme, block: renderReadmeBlock({ registry, nodeId: node.id }) });
  if (next === readme) return { repository: node.repository, status: 'current' };
  if (dryRun) return { repository: node.repository, status: 'would_update' };
  await request(`https://api.github.com/repos/${node.repository}/contents/README.md`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `ecosystem-sync: refresh managed links for ${node.id}`,
      content: Buffer.from(next).toString('base64'),
      sha: current.sha,
      branch: repo.default_branch,
      committer: { name: 'abvx-ecosystem[bot]', email: 'abvx-ecosystem[bot]@users.noreply.github.com' },
    }),
  });
  return { repository: node.repository, status: 'updated' };
}

const nodes = registry.nodes.filter((node) => node.propagation.readme && (!requested || node.id === requested));
if (requested && !nodes.length) throw new Error(`unknown or disabled node: ${requested}`);
const results = [];
for (const node of nodes) {
  try {
    results.push(await syncNode(node));
  } catch (error) {
    results.push({ repository: node.repository, status: 'failed', error: error.message });
  }
}
console.log(JSON.stringify({ kind: 'ABVXEcosystemReadmeSyncReceipt', dryRun, results }, null, 2));
if (results.some(({ status }) => status === 'failed')) process.exitCode = 1;
