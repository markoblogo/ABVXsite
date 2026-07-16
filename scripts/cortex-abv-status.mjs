import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSyncTargets } from './project-description-sync-lib.mjs';
import { validatePublicPolicy } from './cortex-abv-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const policyPath = path.join(root, 'cortex-abv', 'public-policy.example.json');
const autonomousProfilePath = path.join(root, 'cortex-abv', 'autonomous-public-sync.v1.json');
const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
const autonomousProfile = JSON.parse(readFileSync(autonomousProfilePath, 'utf8'));
const validatedPolicy = validatePublicPolicy(policy);
if (autonomousProfile.schemaVersion !== 1 || autonomousProfile.kind !== 'CortexABVAutonomousPublicSyncProfile' || autonomousProfile.authority !== 'write' || !Array.isArray(autonomousProfile.targets)) {
  throw new Error('invalid CortexABV autonomous public sync profile');
}

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
  autonomousException: {
    scope: autonomousProfile.scope,
    targets: autonomousProfile.targets,
    requiredGates: autonomousProfile.requiredGates,
    rollback: autonomousProfile.rollback,
  },
  registeredProjectSyncTargets: targets,
}, null, 2));
