const WRITE_SIDE_ALLOWED_PATCH_FIELDS = ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'];
const WRITE_SIDE_BLOCKED_PATCH_FIELDS = [
  'title',
  'shortTitle',
  'status',
  'visibility',
  'primarySection',
  'appearsIn',
  'group',
  'tags',
  'links',
  'media',
  'heroImage',
  'faqs',
  'relatedSlugs',
  'publishedAt',
  'sortRank',
];
const WRITE_SIDE_ALLOWED_ACTIONS = ['project_copy_sync'];
const WRITE_SIDE_BLOCKED_ACTIONS = [
  'site_link_refresh',
  'social_post_draft',
  'publish_external_post',
  'send_message',
  'send_email',
  'change_identity_fields',
  'store_private_profile',
];
const WRITE_SIDE_ALLOWED_CLAIM_FIELDS = ['summary', 'bodyAppendix'];

function nonEmptyString(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a non-empty string`);
  return value.trim();
}

function stringArray(values, field) {
  if (!Array.isArray(values) || !values.length) throw new Error(`${field} must be a non-empty array`);
  return values.map((value, index) => nonEmptyString(value, `${field}[${index}]`));
}

export function createWriteSidePolicyContract() {
  return {
    schemaVersion: 1,
    kind: 'CortexABVWriteSidePolicy',
    version: 'v1',
    mode: 'owner_review_pr_only',
    allowedPatchFields: [...WRITE_SIDE_ALLOWED_PATCH_FIELDS],
    blockedPatchFields: [...WRITE_SIDE_BLOCKED_PATCH_FIELDS],
    allowedActions: [...WRITE_SIDE_ALLOWED_ACTIONS],
    blockedActions: [...WRITE_SIDE_BLOCKED_ACTIONS],
    allowedClaimFields: [...WRITE_SIDE_ALLOWED_CLAIM_FIELDS],
    allowedProposalShapes: [
      {
        kind: 'CortexABVCopyProposal',
        bodyMode: 'append_only',
        summary: 'replace',
        bodyAppendix: 'single_paragraph_optional',
        requiredEvidence: 'claim_per_changed_field',
      },
    ],
    ownerReview: {
      requiredStatuses: ['pending_review', 'approved', 'rejected'],
      mergeIsOnlyPublicationAction: true,
    },
  };
}

export function validateWriteSideCopyProposal(copyProposal, observedProposal) {
  if (!copyProposal || copyProposal.kind !== 'CortexABVCopyProposal') {
    throw new Error('write-side contract requires CortexABVCopyProposal candidates');
  }
  if (!observedProposal || observedProposal.kind !== 'CortexABVProposal') {
    throw new Error('write-side contract requires an observed CortexABVProposal source');
  }
  if (!WRITE_SIDE_ALLOWED_ACTIONS.includes(observedProposal.action)) {
    throw new Error(`write-side contract does not allow proposal action: ${observedProposal.action}`);
  }
  if (observedProposal.externalSideEffects !== false || observedProposal.authority !== 'proposal' || observedProposal.status !== 'pending_review') {
    throw new Error('write-side contract requires proposal-only, pending-review, side-effect-free observed proposals');
  }
  const changedFields = [];
  if (typeof copyProposal.summary === 'string' && copyProposal.summary.trim()) changedFields.push('summary');
  if (typeof copyProposal.bodyAppendix === 'string' && copyProposal.bodyAppendix.trim()) changedFields.push('bodyAppendix');
  if (!changedFields.length) throw new Error('write-side contract requires at least one changed public field');
  if (typeof copyProposal.bodyAppendix === 'string' && copyProposal.bodyAppendix.includes('\n\n')) {
    throw new Error('write-side contract allows only a single appended body paragraph');
  }
  if (!Array.isArray(copyProposal.claims) || copyProposal.claims.length !== changedFields.length) {
    throw new Error('write-side contract requires one claim per changed public field');
  }

  const seenFields = new Set();
  for (const claim of copyProposal.claims) {
    const field = nonEmptyString(claim?.field, 'claim.field');
    if (!WRITE_SIDE_ALLOWED_CLAIM_FIELDS.includes(field)) throw new Error(`write-side contract blocks claim field: ${field}`);
    if (!changedFields.includes(field) || seenFields.has(field)) throw new Error(`write-side contract requires each changed field exactly once: ${field}`);
    seenFields.add(field);
    nonEmptyString(claim?.evidencePath, `claim.evidencePath (${field})`);
    if (!Number.isInteger(claim?.lineStart) || !Number.isInteger(claim?.lineEnd) || claim.lineStart < 1 || claim.lineEnd < claim.lineStart) {
      throw new Error(`write-side contract requires valid line anchors for ${field}`);
    }
  }

  return {
    changedFields,
    claimFields: [...seenFields],
  };
}

export function validateWriteSideReviewArtifact(artifact) {
  if (!artifact || artifact.kind !== 'CortexABVWriteExecutorReviewArtifact') {
    throw new Error('artifact must be a CortexABVWriteExecutorReviewArtifact');
  }
  if (artifact.authority !== 'write' || artifact.externalSideEffects !== false || artifact.status !== 'pending_review') {
    throw new Error('write-side review artifact must remain pending-review and side-effect-free');
  }
  if (!artifact.ownerReview || artifact.ownerReview.status !== 'pending_review' || artifact.ownerReview.approved !== false || artifact.ownerReview.rejected !== false) {
    throw new Error('write-side review artifact must start with pending owner review state');
  }
  if (!artifact.policy || artifact.policy.kind !== 'CortexABVWriteSidePolicy') {
    throw new Error('write-side review artifact must embed the active write-side policy contract');
  }

  const policy = createWriteSidePolicyContract();
  if (JSON.stringify(artifact.policy.allowedPatchFields) !== JSON.stringify(policy.allowedPatchFields)) {
    throw new Error('write-side review artifact policy must preserve the allowlisted patch fields');
  }
  if (JSON.stringify(artifact.policy.allowedActions) !== JSON.stringify(policy.allowedActions)) {
    throw new Error('write-side review artifact policy must preserve the allowlisted actions');
  }

  return artifact;
}

export function applyOwnerReviewDecisionToArtifact(artifact, { status, ownerDecision }) {
  const validated = validateWriteSideReviewArtifact(artifact);
  const normalizedStatus = nonEmptyString(status, 'status');
  const normalizedDecision = nonEmptyString(ownerDecision, 'ownerDecision');
  if (!['approved', 'rejected'].includes(normalizedStatus)) {
    throw new Error('owner review decision status must be approved or rejected');
  }

  return {
    ...validated,
    status: normalizedStatus,
    ownerReview: {
      status: normalizedStatus,
      approved: normalizedStatus === 'approved',
      rejected: normalizedStatus === 'rejected',
      ownerDecision: normalizedDecision,
    },
    requiredReviewActions: {
      approve: {
        status: normalizedStatus === 'approved' ? 'completed' : 'not_taken',
        notes: validated.requiredReviewActions.approve.notes,
      },
      reject: {
        status: normalizedStatus === 'rejected' ? 'completed' : 'not_taken',
        notes: validated.requiredReviewActions.reject.notes,
      },
    },
    reviewedAt: new Date().toISOString(),
  };
}

export {
  WRITE_SIDE_ALLOWED_ACTIONS,
  WRITE_SIDE_ALLOWED_CLAIM_FIELDS,
  WRITE_SIDE_ALLOWED_PATCH_FIELDS,
  WRITE_SIDE_BLOCKED_ACTIONS,
  WRITE_SIDE_BLOCKED_PATCH_FIELDS,
};
