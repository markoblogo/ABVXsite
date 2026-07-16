import { createHash } from 'node:crypto';

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function observationForEntry(entry, observation) {
  if (!observation || observation.id !== entry.id) throw new Error(`missing observation for allowlisted repository: ${entry.id}`);
  const base = {
    id: entry.id,
    repository: entry.repository,
    project: entry.project,
    landing: entry.landing,
    status: observation.status,
  };
  if (observation.status === 'unavailable') {
    return { ...base, reason: nonEmptyString(observation.reason, `${entry.id}.reason`), provenance: entry.provenance };
  }
  if (observation.status !== 'observed') throw new Error(`${entry.id}.status must be observed or unavailable`);
  const metadata = observation.metadata || {};
  const headSha = nonEmptyString(metadata.headSha, `${entry.id}.metadata.headSha`);
  if (!/^[a-f0-9]{40,64}$/i.test(headSha)) throw new Error(`${entry.id}.metadata.headSha must be a Git SHA`);
  return {
    ...base,
    metadata: {
      defaultBranch: nonEmptyString(metadata.defaultBranch, `${entry.id}.metadata.defaultBranch`),
      headSha,
      pushedAt: nonEmptyString(metadata.pushedAt, `${entry.id}.metadata.pushedAt`),
      updatedAt: nonEmptyString(metadata.updatedAt, `${entry.id}.metadata.updatedAt`),
      visibility: nonEmptyString(metadata.visibility, `${entry.id}.metadata.visibility`),
    },
    provenance: entry.provenance,
  };
}

export function buildRepositoryObservationSnapshot({ registry, observedAt, observations }) {
  if (registry?.schemaVersion !== 1 || registry?.kind !== 'CortexABVPublicProjectRegistry') {
    throw new Error('repository observer requires CortexABVPublicProjectRegistry v1');
  }
  const entries = registry.entries || [];
  const eligibleEntries = entries.filter((entry) => entry.observer?.enabled !== false);
  const excluded = entries.filter((entry) => entry.observer?.enabled === false).map((entry) => ({
    id: entry.id,
    repository: entry.repository,
    reason: entry.observer.reason,
  }));
  const byId = new Map((observations || []).map((observation) => [observation.id, observation]));
  if (byId.size !== observations?.length) throw new Error('repository observations must not duplicate an allowlisted repository');
  for (const observation of observations || []) {
    if (!eligibleEntries.some((entry) => entry.id === observation.id)) throw new Error(`repository observation is not allowlisted for public read: ${observation.id}`);
  }
  const snapshotObservations = eligibleEntries.map((entry) => observationForEntry(entry, byId.get(entry.id)));
  const observedRepositories = snapshotObservations.filter((observation) => observation.status === 'observed').length;
  const stable = { sourceDigest: registry.sourceDigest, observations: snapshotObservations };
  return {
    schemaVersion: 1,
    kind: 'CortexABVRepositoryObservationSnapshot',
    version: 'v1',
    authority: 'read',
    externalSideEffects: false,
    observedAt: nonEmptyString(observedAt, 'observedAt'),
    sourceRegistry: { path: 'cortex-abv/public-project-registry.v1.json', sourceDigest: registry.sourceDigest },
    sourceDigest: digest(stable),
    coverage: {
      registeredRepositories: entries.length,
      observerEligibleRepositories: eligibleEntries.length,
      observedRepositories,
      unavailableRepositories: snapshotObservations.length - observedRepositories,
      excludedRepositories: excluded.length,
    },
    observations: snapshotObservations,
    excluded,
  };
}
