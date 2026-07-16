const proposalActions = new Set(['project_copy_sync', 'site_link_refresh', 'social_post_draft']);
const forbiddenActions = new Set([
  'publish_external_post',
  'send_message',
  'send_email',
  'change_identity_fields',
  'store_private_profile',
]);

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

export function createProjectCopySyncProposal({ slug, repository, ref = 'main', paths, sourceCommit, createdAt }) {
  const normalizedSlug = projectSlug(slug, 'proposal.slug');
  const normalizedRepository = nonEmptyString(repository, 'proposal.repository');
  const normalizedCommit = nonEmptyString(sourceCommit, 'proposal.sourceCommit');
  const normalizedPaths = stringArray(paths, 'proposal.paths');
  const timestamp = nonEmptyString(createdAt, 'proposal.createdAt');

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
    createdAt: timestamp,
  };
}

export function createObservedEventBatch({ targets, observedAt }) {
  if (!Array.isArray(targets)) throw new Error('targets must be an array');
  const timestamp = nonEmptyString(observedAt, 'observedAt');
  const observedTargets = targets.map(({ slug, sync, sourceCommit }) => ({
    slug: projectSlug(slug, 'target.slug'),
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
    .map(({ slug, sync, sourceCommit }) => createProjectCopySyncProposal({
      slug,
      repository: sync.repository,
      ref: sync.ref,
      paths: sync.paths,
      sourceCommit,
      createdAt: timestamp,
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

export function renderEvidenceReceipt(batch) {
  if (!batch || batch.kind !== 'CortexABVObservedEventBatch') throw new Error('batch must be a CortexABVObservedEventBatch');
  if (!Array.isArray(batch.proposals) || !batch.proposals.length) throw new Error('batch must contain at least one proposal');

  const sources = batch.proposals.map((proposal) => {
    if (proposal.status !== 'pending_review' || proposal.authority !== 'proposal' || proposal.externalSideEffects !== false) {
      throw new Error('receipt proposals must remain pending-review, proposal-only, and side-effect free');
    }
    const evidence = proposal.evidence.map((item) => `  - ${markdownCode(item.path)}`).join('\n');
    const firstEvidence = proposal.evidence[0];
    return `- ${markdownCode(`${firstEvidence.repository}@${firstEvidence.commit}`)} for ${markdownCode(proposal.target.slug)}\n${evidence}`;
  }).join('\n');

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
    'The observed source SHA differs from the last applied provenance. Only the listed allowlisted files may support the bounded copy proposal.',
    '',
    '### Review decision',
    '- [ ] Approve this bounded copy proposal',
    '- [ ] Reject it and record the reason in the PR',
    '',
    'Merging remains the only publication action. This receipt does not authorize social posting, messages, email, or identity changes.',
  ].join('\n');
}
