import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSyncTargets } from './project-description-sync-lib.mjs';
import { validatePublicPolicy } from './cortex-abv-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const policyPath = path.join(root, 'cortex-abv', 'public-policy.example.json');
const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
const validatedPolicy = validatePublicPolicy(policy);

const targets = getSyncTargets().map((target) => ({
  slug: target.data.slug,
  repository: target.sync.repository,
  ref: target.sync.ref,
  evidencePaths: target.sync.paths,
  publicCopy: target.sync.publicCopy,
  lastAppliedCommit: target.data.sync.lastAppliedCommit || null,
  proposalStatus: 'awaiting_observed_repository_event',
}));

console.log(JSON.stringify({
  schemaVersion: 1,
  kind: 'CortexABVPublicAdapterStatus',
  mode: policy.mode,
  approvedSources: validatedPolicy.sources,
  allowedProposalActions: validatedPolicy.allowedActions,
  automaticActions: policy.automaticActions,
  registeredProjectSyncTargets: targets,
}, null, 2));
