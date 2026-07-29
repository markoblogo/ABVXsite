import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { applyOwnerReviewDecisionToArtifact } from './cortex-abv-write-side-policy-lib.mjs';
import { mapApprovedReviewArtifactToPrAction } from './cortex-abv-executor-wiring-boundary-lib.mjs';

function requiredArg(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`${name} <value> is required`);
  return process.argv[index + 1];
}

function optionalArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function buildOwnerReviewDecisionArtifacts({ inputPath, status, ownerDecision, outputPath, planOutputPath, boundaryPath }) {
  const pendingArtifact = readJson(inputPath);
  const reviewedArtifact = applyOwnerReviewDecisionToArtifact(pendingArtifact, { status, ownerDecision });
  writeJson(outputPath, reviewedArtifact);

  let plan = null;
  if (reviewedArtifact.ownerReview.status === 'approved') {
    const boundary = readJson(boundaryPath);
    plan = mapApprovedReviewArtifactToPrAction({ artifact: reviewedArtifact, boundary });
    if (!planOutputPath) throw new Error('approved owner review requires --plan-output');
    writeJson(planOutputPath, plan);
  }

  return {
    reviewArtifact: reviewedArtifact,
    plan,
  };
}

export function run() {
  const inputPath = requiredArg('--input');
  const outputPath = requiredArg('--output');
  const status = requiredArg('--status');
  const ownerDecision = requiredArg('--owner-decision');
  const boundaryPath = optionalArg('--boundary') || 'cortex-abv/executor-wiring-boundary.v1.json';
  const planOutputPath = optionalArg('--plan-output');

  const { reviewArtifact, plan } = buildOwnerReviewDecisionArtifacts({
    inputPath,
    status,
    ownerDecision,
    outputPath,
    planOutputPath,
    boundaryPath,
  });

  console.log(`Wrote owner review artifact to ${outputPath}`);
  if (plan) {
    console.log(`Wrote executor wiring plan to ${planOutputPath}`);
  } else {
    console.log(`No executor wiring plan generated for ${reviewArtifact.ownerReview.status} decision`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`CortexABV owner review decision failed: ${error.message}`);
    process.exitCode = 1;
  }
}
