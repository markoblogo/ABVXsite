import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildRepositoryObservationSnapshot } from './cortex-abv-repository-observer-lib.mjs';

const root = process.cwd();
const inputPath = process.argv.includes('--input') ? process.argv[process.argv.indexOf('--input') + 1] : path.join(root, 'cortex-abv', 'public-project-registry.v1.json');
const outputPath = process.argv.includes('--output') ? process.argv[process.argv.indexOf('--output') + 1] : undefined;

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'cortex-abv-public-repository-observer',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readRepositoryMetadata(entry) {
  const response = await fetch(`https://api.github.com/repos/${entry.repository.fullName}`, { headers: githubHeaders() });
  if (!response.ok) return { id: entry.id, status: 'unavailable', reason: `GitHub ${response.status}: ${entry.repository.fullName}` };
  const repository = await response.json();
  const defaultBranch = repository.default_branch;
  if (typeof defaultBranch !== 'string' || !defaultBranch) return { id: entry.id, status: 'unavailable', reason: `GitHub returned no default branch: ${entry.repository.fullName}` };
  const commitResponse = await fetch(`https://api.github.com/repos/${entry.repository.fullName}/commits/${encodeURIComponent(defaultBranch)}`, { headers: githubHeaders() });
  if (!commitResponse.ok) return { id: entry.id, status: 'unavailable', reason: `GitHub ${commitResponse.status}: ${entry.repository.fullName}@${defaultBranch}` };
  const commit = await commitResponse.json();
  if (typeof commit.sha !== 'string' || !commit.sha) return { id: entry.id, status: 'unavailable', reason: `GitHub returned no commit SHA: ${entry.repository.fullName}@${defaultBranch}` };
  return {
    id: entry.id,
    status: 'observed',
    metadata: {
      defaultBranch,
      headSha: commit.sha,
      pushedAt: repository.pushed_at || repository.updated_at,
      updatedAt: repository.updated_at || repository.pushed_at,
      visibility: repository.private ? 'private' : (repository.visibility || 'public'),
    },
  };
}

export async function run() {
  if (!outputPath) throw new Error('--output <path> is required');
  const registry = JSON.parse(readFileSync(inputPath, 'utf8'));
  const observations = await Promise.all(registry.entries.map(readRepositoryMetadata));
  const snapshot = buildRepositoryObservationSnapshot({ registry, observedAt: new Date().toISOString(), observations });
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Observed ${snapshot.coverage.observedRepositories}/${snapshot.coverage.allowlistedRepositories} allowlisted public repositories; ${snapshot.coverage.unavailableRepositories} unavailable.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(`CortexABV public repository observation failed: ${error.message}`);
    process.exitCode = 1;
  });
}
