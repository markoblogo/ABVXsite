const REQUIRED_FORBIDDEN_BEHAVIORS = [
  'autopublish',
  'direct_main_push',
  'automatic_merge',
  'social_post',
  'message_send',
  'email_send',
  'external_direct_execution',
  'source_repository_mutation',
];

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

export function validateExecutorWiringBoundary(boundary) {
  if (!boundary || boundary.schemaVersion !== 1 || boundary.kind !== 'CortexABVExecutorWiringBoundary') {
    throw new Error('boundary must be CortexABVExecutorWiringBoundary v1');
  }
  if (boundary.version !== 'v1') throw new Error('boundary.version must be v1');
  if (boundary.status !== 'design_only') throw new Error('boundary.status must be design_only');
  if (boundary.mode !== 'approved_review_pr_first_only') throw new Error('boundary.mode must be approved_review_pr_first_only');
  const forbidden = stringArray(boundary.forbiddenBehaviors, 'boundary.forbiddenBehaviors');
  for (const behavior of REQUIRED_FORBIDDEN_BEHAVIORS) {
    if (!forbidden.includes(behavior)) throw new Error(`boundary.forbiddenBehaviors must include ${behavior}`);
  }
  if (!boundary.activeSurface || typeof boundary.activeSurface !== 'object') throw new Error('boundary.activeSurface must be an object');
  const surface = boundary.activeSurface;
  if (nonEmptyString(surface.id, 'boundary.activeSurface.id') !== 'abvxsite-project-copy') throw new Error('boundary.activeSurface.id must be abvxsite-project-copy');
  if (nonEmptyString(surface.repository, 'boundary.activeSurface.repository') !== 'markoblogo/ABVXsite') throw new Error('boundary.activeSurface.repository must be markoblogo/ABVXsite');
  if (nonEmptyString(surface.baseBranch, 'boundary.activeSurface.baseBranch') !== 'main') throw new Error('boundary.activeSurface.baseBranch must be main');
  if (nonEmptyString(surface.allowedBranchPrefix, 'boundary.activeSurface.allowedBranchPrefix') !== 'cortexabv/write-side-') throw new Error('boundary.activeSurface.allowedBranchPrefix must be cortexabv/write-side-');
  if (nonEmptyString(surface.allowedReviewArtifactKind, 'boundary.activeSurface.allowedReviewArtifactKind') !== 'CortexABVWriteExecutorReviewArtifact') {
    throw new Error('boundary.activeSurface.allowedReviewArtifactKind must be CortexABVWriteExecutorReviewArtifact');
  }
  if (nonEmptyString(surface.requiredOwnerReviewStatus, 'boundary.activeSurface.requiredOwnerReviewStatus') !== 'approved') {
    throw new Error('boundary.activeSurface.requiredOwnerReviewStatus must be approved');
  }
  if (nonEmptyString(surface.mappedAction, 'boundary.activeSurface.mappedAction') !== 'owner_merge_pull_request') {
    throw new Error('boundary.activeSurface.mappedAction must be owner_merge_pull_request');
  }
  if (nonEmptyString(surface.publishPath, 'boundary.activeSurface.publishPath') !== 'pull_request_merge_only') {
    throw new Error('boundary.activeSurface.publishPath must be pull_request_merge_only');
  }
  return boundary;
}

export function validateApprovedReviewArtifactForWiring(artifact) {
  if (!artifact || artifact.kind !== 'CortexABVWriteExecutorReviewArtifact') {
    throw new Error('review artifact must be CortexABVWriteExecutorReviewArtifact');
  }
  if (artifact.authority !== 'write') throw new Error('review artifact authority must be write');
  if (artifact.externalSideEffects !== false) throw new Error('review artifact externalSideEffects must be false');
  if (!artifact.ownerReview || typeof artifact.ownerReview !== 'object') throw new Error('review artifact ownerReview must be an object');
  if (artifact.ownerReview.status !== 'approved') throw new Error('review artifact ownerReview.status must be approved');
  if (artifact.ownerReview.approved !== true) throw new Error('review artifact ownerReview.approved must be true');
  if (artifact.ownerReview.rejected !== false) throw new Error('review artifact ownerReview.rejected must be false');
  nonEmptyString(artifact.ownerReview.ownerDecision, 'review artifact ownerReview.ownerDecision');
  if (!artifact.policy || artifact.policy.kind !== 'CortexABVWriteSidePolicy') {
    throw new Error('review artifact must embed CortexABVWriteSidePolicy');
  }
  if (!Array.isArray(artifact.observedSources) || artifact.observedSources.length < 1) {
    throw new Error('review artifact observedSources must be a non-empty array');
  }
  return artifact;
}

export function mapApprovedReviewArtifactToPrAction({ artifact, boundary }) {
  const validatedBoundary = validateExecutorWiringBoundary(boundary);
  const validatedArtifact = validateApprovedReviewArtifactForWiring(artifact);
  return {
    schemaVersion: 1,
    kind: 'CortexABVExecutorWiringPlan',
    version: 'v1',
    authority: 'write',
    externalSideEffects: false,
    status: 'ready_for_owner_merge',
    mode: validatedBoundary.mode,
    targetSurfaceId: validatedBoundary.activeSurface.id,
    repository: validatedBoundary.activeSurface.repository,
    baseBranch: validatedBoundary.activeSurface.baseBranch,
    requiredBranchPrefix: validatedBoundary.activeSurface.allowedBranchPrefix,
    reviewArtifactKind: validatedBoundary.activeSurface.allowedReviewArtifactKind,
    reviewArtifactOwnerStatus: validatedBoundary.activeSurface.requiredOwnerReviewStatus,
    mappedAction: validatedBoundary.activeSurface.mappedAction,
    publishPath: validatedBoundary.activeSurface.publishPath,
    autopublish: false,
    ownerTriggerRequired: true,
    externalDirectExecution: false,
    observedSourceCount: validatedArtifact.observedSources.length,
    ownerDecision: validatedArtifact.ownerReview.ownerDecision,
  };
}
