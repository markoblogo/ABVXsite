import { createHash } from 'node:crypto';

const comparableFields = ['status', 'defaultBranch', 'headSha', 'pushedAt', 'updatedAt', 'visibility', 'reason'];

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function assertSnapshot(snapshot, label) {
  if (snapshot?.schemaVersion !== 1 || snapshot?.kind !== 'CortexABVRepositoryObservationSnapshot') {
    throw new Error(`${label} must be CortexABVRepositoryObservationSnapshot v1`);
  }
  if (!snapshot.sourceRegistry?.sourceDigest || !Array.isArray(snapshot.observations)) {
    throw new Error(`${label} is missing registry evidence or observations`);
  }
}

function comparable(observation) {
  return observation.status === 'observed'
    ? { status: 'observed', ...observation.metadata }
    : { status: observation.status, reason: observation.reason || null };
}

function changedFields(before, after) {
  return comparableFields.filter((field) => (before[field] ?? null) !== (after[field] ?? null));
}

export function buildRepositoryChangeProposal({ baseline, candidate, createdAt }) {
  assertSnapshot(baseline, 'baseline snapshot');
  assertSnapshot(candidate, 'candidate snapshot');
  if (baseline.sourceRegistry.sourceDigest !== candidate.sourceRegistry.sourceDigest) {
    throw new Error('repository snapshots must use the same registry source digest');
  }
  const baselineById = new Map(baseline.observations.map((observation) => [observation.id, observation]));
  const candidateById = new Map(candidate.observations.map((observation) => [observation.id, observation]));
  if (baselineById.size !== baseline.observations.length || candidateById.size !== candidate.observations.length) {
    throw new Error('repository snapshots must not duplicate observations');
  }
  if (baselineById.size !== candidateById.size || [...baselineById.keys()].some((id) => !candidateById.has(id))) {
    throw new Error('repository snapshots must cover the same public-read repositories');
  }
  const changes = [...baselineById.keys()].sort().flatMap((id) => {
    const beforeObservation = baselineById.get(id);
    const afterObservation = candidateById.get(id);
    const before = comparable(beforeObservation);
    const after = comparable(afterObservation);
    const fields = changedFields(before, after);
    if (!fields.length) return [];
    return [{
      id,
      repository: afterObservation.repository,
      project: afterObservation.project,
      landing: afterObservation.landing,
      changedFields: fields,
      before,
      after,
      provenance: afterObservation.provenance,
    }];
  });
  const evidence = {
    baseline: { observedAt: baseline.observedAt, sourceDigest: baseline.sourceDigest },
    candidate: { observedAt: candidate.observedAt, sourceDigest: candidate.sourceDigest },
    registrySourceDigest: baseline.sourceRegistry.sourceDigest,
  };
  const stable = { evidence, changes };
  return {
    schemaVersion: 1,
    kind: 'CortexABVRepositoryChangeProposal',
    version: 'v1',
    authority: 'proposal',
    externalSideEffects: false,
    createdAt: nonEmptyString(createdAt, 'createdAt'),
    reviewStatus: changes.length ? 'pending_review' : 'no_changes',
    sourceDigest: digest(stable),
    evidence,
    changes,
  };
}
