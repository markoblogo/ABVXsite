import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
  createWriteSidePolicyContract,
  validateWriteSideCopyProposal,
  validateWriteSideReviewArtifact,
} from './cortex-abv-write-side-policy-lib.mjs';

function requiredArg(name) {
  const value = process.argv.indexOf(name);
  if (value < 0 || !process.argv[value + 1]) throw new Error(`${name} <path> is required`);
  return process.argv[value + 1];
}

function asString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value.trim();
}

function loadCopyClaims(directory) {
  if (!directory || !existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => JSON.parse(readFileSync(`${directory}/${entry.name}`, 'utf8')));
}

export function buildArtifact({ batchPath, claimsDirectory }) {
  const batch = JSON.parse(readFileSync(batchPath, 'utf8'));
  if (!batch || batch.kind !== 'CortexABVObservedEventBatch' || !Array.isArray(batch.proposals) || !batch.proposals.length) {
    throw new Error('input batch must be a non-empty CortexABVObservedEventBatch');
  }

  const observedBySlug = new Map(batch.proposals.map((proposal) => [proposal.target.slug, proposal]));
  const copyProposals = loadCopyClaims(claimsDirectory)
    .filter((claim) => claim && claim.kind === 'CortexABVCopyProposal');

  const claimAnchors = [];
  const sourceSummaries = [];
  for (const copyProposal of copyProposals) {
    const sourceSlug = asString(copyProposal.slug, 'copyProposal.slug');
    const observed = observedBySlug.get(sourceSlug);
    if (!observed) {
      throw new Error(`copy proposal references unknown slug: ${sourceSlug}`);
    }
    validateWriteSideCopyProposal(copyProposal, observed);
    if (!Array.isArray(copyProposal.claims)) {
      throw new Error(`copy proposal ${sourceSlug} must include claim anchors`);
    }
    if (!Array.isArray(copyProposal.claims) || copyProposal.claims.length === 0) {
      throw new Error(`copy proposal ${sourceSlug} must include at least one claim`);
    }
    const sourceCommit = asString(copyProposal.sourceCommit, 'copyProposal.sourceCommit');
    if (sourceCommit !== observed.evidence[0].commit) {
      throw new Error(`copy proposal for ${sourceSlug} must match observed source commit`);
    }
    for (const claim of copyProposal.claims) {
      const evidencePath = asString(claim.evidencePath, `claim.evidencePath (${sourceSlug})`);
      if (!observed.evidence.some((item) => item.path === evidencePath)) {
        throw new Error(`claim evidence path is not allowed for ${sourceSlug}: ${evidencePath}`);
      }
      claimAnchors.push({
        slug: sourceSlug,
        field: asString(claim.field, `claim.field (${sourceSlug})`),
        evidencePath,
        lineStart: claim.lineStart,
        lineEnd: claim.lineEnd,
      });
    }
    sourceSummaries.push({
      slug: sourceSlug,
      repository: observed.target.repository,
      commit: observed.evidence[0].commit,
      paths: observed.evidence.map((item) => item.path),
      decisionTrace: observed.decisionTrace || null,
      claimCount: copyProposal.claims.length,
    });
  }

  const artifact = {
    schemaVersion: 1,
    kind: 'CortexABVWriteExecutorReviewArtifact',
    version: 'v1',
    authority: 'write',
    externalSideEffects: false,
    status: 'pending_review',
    ownerReview: {
      status: 'pending_review',
      approved: false,
      rejected: false,
      ownerDecision: null,
    },
    requiredReviewActions: {
      approve: {
        status: 'required',
        notes: 'Set ownerReview.status to approved and merge the PR.',
      },
      reject: {
        status: 'required',
        notes: 'Set ownerReview.status to rejected and write the reason in the PR body/comments.',
      },
    },
    policy: createWriteSidePolicyContract(),
    observedSources: sourceSummaries,
    claimAnchors,
    createdAt: new Date().toISOString(),
  };
  return validateWriteSideReviewArtifact(artifact);
}

export function run() {
  const inputPath = requiredArg('--input');
  const outputPath = requiredArg('--output');
  const claimsDirectory = process.argv.includes('--claims-dir')
    ? process.argv[process.argv.indexOf('--claims-dir') + 1]
    : undefined;

  const artifact = buildArtifact({ batchPath: inputPath, claimsDirectory });
  if (!artifact.observedSources.length) {
    artifact.notes = ['No bounded candidate proposals were generated for the current observed commit set.'];
  }

  mkdirSync(process.cwd(), { recursive: true });
  const outputDir = outputPath.split('/').slice(0, -1).join('/');
  if (outputDir) mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(`Wrote write-side owner review artifact to ${outputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`CortexABV write-side review artifact generation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
