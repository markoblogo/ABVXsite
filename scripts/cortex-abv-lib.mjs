const proposalActions = new Set(['project_copy_sync', 'site_link_refresh', 'social_post_draft']);
const forbiddenActions = new Set([
  'publish_external_post',
  'send_message',
  'send_email',
  'change_identity_fields',
  'store_private_profile',
]);
const AUTONOMOUS_PATCH_FIELDS = ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'];

function nonEmptyString(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a non-empty string`);
  return value.trim();
}

function stringArray(value, field) {
  if (!Array.isArray(value) || !value.length || !value.every((item) => typeof item === 'string' && item.trim())) {
    throw new Error(`${field} must be a non-empty string array`);
  }
  return value.map((item) => item.trim());
}

function projectSlug(value, field) {
  const normalized = nonEmptyString(value, field);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) throw new Error(`${field} must be a normalized project slug`);
  return normalized;
}

function safeDecisionTrace(decisionTrace) {
  if (!decisionTrace) {
    return {
      policySource: 'base',
      reason: 'base public-sync profile policy is applied',
      basePolicy: { allowedPatchFields: [...AUTONOMOUS_PATCH_FIELDS] },
      sourceOverride: null,
      sourceKind: null,
      sourceId: null,
    };
  }
  if (typeof decisionTrace !== 'object' || Array.isArray(decisionTrace)) throw new Error('proposal.decisionTrace must be an object');
  const policySource = decisionTrace.policySource === 'source_specific_override' ? 'source_specific_override' : 'base';
  const sourceKind = typeof decisionTrace.sourceKind === 'string' && decisionTrace.sourceKind.trim() ? decisionTrace.sourceKind.trim() : null;
  const sourceId = typeof decisionTrace.sourceId === 'string' && decisionTrace.sourceId.trim() ? decisionTrace.sourceId.trim() : null;
  if (policySource === 'source_specific_override' && (!sourceKind || !sourceId)) {
    throw new Error('proposal.decisionTrace with source_specific_override requires sourceKind and sourceId');
  }
  const reason = decisionTrace.reason || (policySource === 'source_specific_override'
    ? `source-specific override from ${sourceKind}#${sourceId} is applied`
    : 'base public-sync profile policy is applied');

  const sourceOverridePatchFields = Array.isArray(decisionTrace.sourceOverride?.allowedPatchFields)
    ? decisionTrace.sourceOverride.allowedPatchFields
    : AUTONOMOUS_PATCH_FIELDS;
  return {
    policySource,
    reason,
    sourceKind,
    sourceId,
    basePolicy: {
      allowedPatchFields: [...AUTONOMOUS_PATCH_FIELDS],
    },
    sourceOverride: policySource === 'source_specific_override' ? { allowedPatchFields: [...sourceOverridePatchFields] } : null,
  };
}

function markdownCode(value) {
  return `\`${String(value).replace(/`/g, '\\`')}\``;
}

export function validatePublicPolicy(policy) {
  if (!policy || policy.schemaVersion !== 1) throw new Error('policy.schemaVersion must be 1');
  nonEmptyString(policy.name, 'policy.name');
  if (policy.mode !== 'proposal_only') throw new Error('policy.mode must be proposal_only for the public-site adapter');

  const sources = stringArray(policy.approvedSources, 'policy.approvedSources');
  const allowedActions = stringArray(policy.allowedProposalActions, 'policy.allowedProposalActions');
  if (!allowedActions.every((action) => proposalActions.has(action))) throw new Error('policy.allowedProposalActions contains an unsupported action');
  if (!Array.isArray(policy.automaticActions) || policy.automaticActions.length) {
    throw new Error('policy.automaticActions must be empty while mode is proposal_only');
  }
  const deniedActions = stringArray(policy.forbiddenActions, 'policy.forbiddenActions');
  if (![...forbiddenActions].every((action) => deniedActions.includes(action))) {
    throw new Error('policy.forbiddenActions must retain all public-site safety denials');
  }

  return { sources, allowedActions, deniedActions };
}

export function createProjectCopySyncProposal({ slug, repository, ref = 'main', paths, sourceCommit, createdAt, decisionTrace }) {
  const normalizedSlug = projectSlug(slug, 'proposal.slug');
  const normalizedRepository = nonEmptyString(repository, 'proposal.repository');
  const normalizedCommit = nonEmptyString(sourceCommit, 'proposal.sourceCommit');
  const normalizedPaths = stringArray(paths, 'proposal.paths');
  const timestamp = nonEmptyString(createdAt, 'proposal.createdAt');

  const safeTrace = safeDecisionTrace(decisionTrace);

  return {
    schemaVersion: 1,
    kind: 'CortexABVProposal',
    id: `project-copy-sync:${normalizedSlug}:${normalizedCommit.slice(0, 12)}`,
    status: 'pending_review',
    authority: 'proposal',
    action: 'project_copy_sync',
    target: { slug: normalizedSlug, repository: normalizedRepository, ref },
    evidence: normalizedPaths.map((sourcePath) => ({ repository: normalizedRepository, ref, path: sourcePath, commit: normalizedCommit })),
    allowedPatchFields: ['summary', 'body', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'],
    externalSideEffects: false,
    decisionTrace: safeTrace,
    createdAt: timestamp,
  };
}

export function createObservedEventBatch({ targets, observedAt }) {
  if (!Array.isArray(targets)) throw new Error('targets must be an array');
  const timestamp = nonEmptyString(observedAt, 'observedAt');
  const observedTargets = targets.map(({ slug, sync, sourceCommit, decisionTrace }) => ({
    slug: projectSlug(slug, 'target.slug'),
    decisionTrace,
    sync: {
      repository: nonEmptyString(sync?.repository, 'target.sync.repository'),
      ref: typeof sync?.ref === 'string' && sync.ref ? sync.ref : 'main',
      paths: stringArray(sync?.paths, 'target.sync.paths'),
      lastAppliedCommit: typeof sync?.lastAppliedCommit === 'string' ? sync.lastAppliedCommit : null,
    },
    sourceCommit: nonEmptyString(sourceCommit, 'sourceCommit'),
  }));
  const proposals = observedTargets
    .filter(({ sourceCommit, sync }) => sourceCommit !== sync.lastAppliedCommit)
    .map(({ slug, sync, sourceCommit, decisionTrace }) => createProjectCopySyncProposal({
      slug,
      repository: sync.repository,
      ref: sync.ref,
      paths: sync.paths,
      sourceCommit,
      createdAt: timestamp,
      decisionTrace,
    }));

  return {
    schemaVersion: 1,
    kind: 'CortexABVObservedEventBatch',
    authority: 'read',
    observedAt: timestamp,
    targetCount: targets.length,
    shouldRunCopySync: proposals.length > 0,
    proposals,
  };
}

export function createAutonomousApplyReceipt({ batch, copyProposals, targetRepository, targetBranch, previousCommit, appliedCommit, appliedAt }) {
  if (!batch || batch.kind !== 'CortexABVObservedEventBatch' || !Array.isArray(batch.proposals) || !batch.proposals.length) {
    throw new Error('autonomous receipt requires an observed event batch with proposals');
  }
  const target = { repository: nonEmptyString(targetRepository, 'targetRepository'), branch: nonEmptyString(targetBranch, 'targetBranch') };
  const sourceBySlug = new Map(batch.proposals.map((proposal) => [proposal.target.slug, proposal]));
  const claimAnchors = [];
  for (const copyProposal of copyProposals || []) {
    const observed = sourceBySlug.get(projectSlug(copyProposal?.slug, 'copyProposal.slug'));
    if (!observed || copyProposal.sourceCommit !== observed.evidence[0].commit || !Array.isArray(copyProposal.claims)) {
      throw new Error('autonomous receipt copy proposal must match observed source evidence');
    }
    for (const claim of copyProposal.claims) {
      if (!['summary', 'bodyAppendix'].includes(claim?.field) || !observed.evidence.some((item) => item.path === claim.evidencePath)) {
        throw new Error('autonomous receipt claim must use an allowed field and observed evidence path');
      }
      claimAnchors.push({ slug: copyProposal.slug, field: claim.field, evidencePath: claim.evidencePath, lineStart: claim.lineStart, lineEnd: claim.lineEnd });
    }
  }
  return {
    schemaVersion: 1,
    kind: 'CortexABVAutonomousPublicSyncReceipt',
    status: 'applied',
    authority: 'write',
    externalSideEffects: true,
    target,
    previousCommit: nonEmptyString(previousCommit, 'previousCommit'),
    appliedCommit: nonEmptyString(appliedCommit, 'appliedCommit'),
    appliedAt: nonEmptyString(appliedAt, 'appliedAt'),
    sources: batch.proposals.map((proposal) => ({
      slug: proposal.target.slug,
      repository: proposal.target.repository,
      commit: proposal.evidence[0].commit,
      paths: proposal.evidence.map((item) => item.path),
      decisionTrace: proposal.decisionTrace,
    })),
    claimAnchors,
    rollback: { strategy: 'git_revert', revertCommit: appliedCommit },
  };
}

export function renderEvidenceReceipt(batch, copyProposals = []) {
  if (!batch || batch.kind !== 'CortexABVObservedEventBatch') throw new Error('batch must be a CortexABVObservedEventBatch');
  if (!Array.isArray(batch.proposals) || !batch.proposals.length) throw new Error('batch must contain at least one proposal');

  if (!Array.isArray(copyProposals)) throw new Error('copyProposals must be an array');
  const observedBySlug = new Map(batch.proposals.map((proposal) => [proposal.target.slug, proposal]));
  const receiptProposals = copyProposals.length ? copyProposals.map((copyProposal) => {
    if (copyProposal?.schemaVersion !== 1 || copyProposal?.kind !== 'CortexABVCopyProposal') {
      throw new Error('copy proposal must use the CortexABVCopyProposal contract');
    }
    const observed = observedBySlug.get(projectSlug(copyProposal?.slug, 'copyProposal.slug'));
    if (!observed || copyProposal.sourceCommit !== observed.evidence[0].commit) throw new Error('copy proposal must match an observed source commit');
    if (!Array.isArray(copyProposal.claims) || !copyProposal.claims.length || copyProposal.claims.length > 2) throw new Error('copy proposal must include one or two claim anchors');
    const expectedFields = new Set(['summary', 'bodyAppendix']);
    for (const claim of copyProposal.claims) {
      if (!expectedFields.delete(claim?.field) || !observed.evidence.some((item) => item.path === claim.evidencePath)) {
        throw new Error('claim anchor must use each public field once and an observed source path');
      }
      if (!Number.isInteger(claim.lineStart) || !Number.isInteger(claim.lineEnd) || claim.lineStart < 1 || claim.lineEnd < claim.lineStart) {
        throw new Error('claim anchor must contain a valid line range');
      }
    }
    return { ...observed, claims: copyProposal.claims };
  }) : batch.proposals;

  const sources = receiptProposals.map((proposal) => {
    if (proposal.status !== 'pending_review' || proposal.authority !== 'proposal' || proposal.externalSideEffects !== false) {
      throw new Error('receipt proposals must remain pending-review, proposal-only, and side-effect free');
    }
    const evidence = proposal.evidence.map((item) => `  - ${markdownCode(item.path)}`).join('\n');
    const firstEvidence = proposal.evidence[0];
    return `- ${markdownCode(`${firstEvidence.repository}@${firstEvidence.commit}`)} for ${markdownCode(proposal.target.slug)}\n${evidence}`;
  }).join('\n');

  const claimAnchors = copyProposals.length ? [
    '',
    '### Claim-to-source anchors',
    ...receiptProposals.flatMap((proposal) => proposal.claims.map((claim) =>
      `- ${markdownCode(proposal.target.slug)} ${markdownCode(claim.field)} → ${markdownCode(`${claim.evidencePath}:L${claim.lineStart}-L${claim.lineEnd}`)}`,
    )),
  ] : [];

  const decisionTraces = ['### Decision trace', '', ...receiptProposals.map((proposal) => {
    const trace = proposal.decisionTrace || {};
    const source = trace.sourceKind && trace.sourceId ? ` (${markdownCode(`${trace.sourceKind}/${trace.sourceId}`)})` : '';
    const override = trace.policySource === 'source_specific_override'
      ? ` override = ${JSON.stringify(trace.sourceOverride || null)}`
      : ' no source override';
    return `- ${markdownCode(proposal.target.slug)} ${trace.policySource || 'base'}${source}: ${markdownCode(String(trace.reason || ''))}${override}`;
  })];

  return [
    '## CortexABV evidence receipt',
    '',
    'Status: `pending_review`  ',
    'Authority: `proposal`  ',
    'External side effects: `false`',
    '',
    '### Observed sources',
    sources,
    '',
    '### Basis',
    'The observed source SHA differs from the last applied provenance. Only the listed allowlisted files and claim anchors may support the bounded public-copy proposal.',
    ...claimAnchors,
    ...decisionTraces,
    '',
    '### Review decision',
    '- [ ] Approve this bounded copy proposal',
    '- [ ] Reject it and record the reason in the PR',
    '',
    'Merging remains the only publication action. This receipt does not authorize social posting, messages, email, or identity changes.',
  ].join('\n');
}
