import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REQUIRED_FORBIDDEN_BEHAVIORS = [
  'direct_main_push',
  'automatic_merge',
  'autonomous_social_post',
  'message_send',
  'email_send',
  'source_repository_mutation',
  'identity_field_change',
  'unbounded_content_rewrite',
];

const EXPECTED_SURFACES = new Map([
  ['abvxsite-project-copy', {
    repository: 'markoblogo/ABVXsite',
    implementationState: 'active_pr_only',
    allowedPaths: ['content/work/*.md'],
    allowedPatchFields: ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'],
    proposalKinds: ['CortexABVCopyProposal'],
  }],
  ['lab-home-ledger', {
    repository: 'markoblogo/lab.abvx',
    implementationState: 'design_only_pr_required',
    allowedPaths: ['docs/index.html', 'docs/assets/home-ledger-snapshot.v1.json'],
    allowedPatchFields: ['freshnessLedger', 'freshnessSnapshotProvenance'],
    proposalKinds: ['CortexABVLabLedgerProposal'],
  }],
]);

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value.trim();
}

function stringArray(value, label) {
  if (!Array.isArray(value) || !value.length || !value.every((item) => typeof item === 'string' && item.trim())) {
    throw new Error(`${label} must be a non-empty string array`);
  }
  return value.map((item) => item.trim());
}

function sameArray(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function validateWriteSideExecutorDesign(design) {
  if (!design || design.schemaVersion !== 1 || design.kind !== 'CortexABVWriteSideExecutorDesign') {
    throw new Error('design must be CortexABVWriteSideExecutorDesign v1');
  }
  nonEmptyString(design.version, 'design.version');
  if (design.status !== 'design_only') throw new Error('design.status must be design_only');
  if (design.mode !== 'owner_review_pr_only') throw new Error('design.mode must be owner_review_pr_only');

  const forbiddenBehaviors = stringArray(design.forbiddenExecutorBehaviors, 'design.forbiddenExecutorBehaviors');
  for (const behavior of REQUIRED_FORBIDDEN_BEHAVIORS) {
    if (!forbiddenBehaviors.includes(behavior)) throw new Error(`design.forbiddenExecutorBehaviors must include ${behavior}`);
  }

  if (!design.reviewGate || typeof design.reviewGate !== 'object') throw new Error('design.reviewGate must be an object');
  if (design.reviewGate.ownerReviewRequired !== true) throw new Error('design.reviewGate.ownerReviewRequired must be true');
  if (design.reviewGate.initialStatus !== 'pending_review') throw new Error('design.reviewGate.initialStatus must be pending_review');
  if (!sameArray(stringArray(design.reviewGate.terminalStatuses, 'design.reviewGate.terminalStatuses'), ['approved', 'rejected'])) {
    throw new Error('design.reviewGate.terminalStatuses must be ["approved","rejected"]');
  }
  if (design.reviewGate.mergeIsOnlyPublicationAction !== true) throw new Error('design.reviewGate.mergeIsOnlyPublicationAction must be true');

  if (!Array.isArray(design.surfaces) || design.surfaces.length !== EXPECTED_SURFACES.size) {
    throw new Error(`design.surfaces must contain exactly ${EXPECTED_SURFACES.size} entries`);
  }

  for (const surface of design.surfaces) {
    const id = nonEmptyString(surface?.id, 'surface.id');
    const expected = EXPECTED_SURFACES.get(id);
    if (!expected) throw new Error(`unexpected surface id: ${id}`);
    if (nonEmptyString(surface.repository, `${id}.repository`) !== expected.repository) throw new Error(`${id}.repository must be ${expected.repository}`);
    if (nonEmptyString(surface.branch, `${id}.branch`) !== 'main') throw new Error(`${id}.branch must be main`);
    if (surface.implementationState !== expected.implementationState) throw new Error(`${id}.implementationState must be ${expected.implementationState}`);
    if (!sameArray(stringArray(surface.allowedPaths, `${id}.allowedPaths`), expected.allowedPaths)) throw new Error(`${id}.allowedPaths do not match the bounded design`);
    if (!sameArray(stringArray(surface.allowedPatchFields, `${id}.allowedPatchFields`), expected.allowedPatchFields)) throw new Error(`${id}.allowedPatchFields do not match the bounded design`);
    if (!sameArray(stringArray(surface.proposalKinds, `${id}.proposalKinds`), expected.proposalKinds)) throw new Error(`${id}.proposalKinds do not match the bounded design`);
    stringArray(surface.requiredArtifacts, `${id}.requiredArtifacts`);
    if (surface.publishPath !== 'pull_request_merge_only') throw new Error(`${id}.publishPath must be pull_request_merge_only`);
    if (surface.rollbackPath !== 'close_pr_or_revert_merge') throw new Error(`${id}.rollbackPath must be close_pr_or_revert_merge`);
  }

  return design;
}

export function run(argv = process.argv.slice(2)) {
  const explicitPathIndex = argv.indexOf('--input');
  const inputPath = explicitPathIndex >= 0
    ? argv[explicitPathIndex + 1]
    : new URL('../cortex-abv/write-side-executor-design.v1.json', import.meta.url).pathname;
  if (!inputPath) throw new Error('--input <path> is required');

  const design = JSON.parse(readFileSync(inputPath, 'utf8'));
  validateWriteSideExecutorDesign(design);
  console.log(`Write-side executor design valid: ${inputPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    run();
  } catch (error) {
    console.error(`CortexABV write-side executor design check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
