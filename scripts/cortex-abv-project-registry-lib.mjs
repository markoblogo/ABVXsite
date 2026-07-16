import { createHash } from 'node:crypto';

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function githubRepository(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com') return null;
    const [owner, repository] = parsed.pathname.split('/').filter(Boolean);
    if (!owner || !repository) return null;
    return { provider: 'github', fullName: `${owner}/${repository}`, url: `https://github.com/${owner}/${repository}` };
  } catch {
    return null;
  }
}

export function buildPublicProjectRegistry({ presenceIndex, generatedAt }) {
  if (presenceIndex?.schemaVersion !== 1 || presenceIndex?.kind !== 'CortexABVPublicPresenceIndex') {
    throw new Error('project registry requires CortexABVPublicPresenceIndex v1');
  }
  const lab = presenceIndex.entities.find((entity) => entity.id === 'lab:abvx' && entity.kind === 'lab');
  if (!lab) throw new Error('public presence index must include lab:abvx');
  const cataloguedProjects = new Set(presenceIndex.relations.filter((relation) => relation.from === lab.id && relation.type === 'catalogues').map(({ to }) => to));
  const entries = presenceIndex.entities
    .filter((entity) => entity.kind === 'project')
    .flatMap((project) => (project.attributes?.links || [])
      .map((link) => githubRepository(link.url))
      .filter(Boolean)
      .map((repository) => ({
        id: `repository:github:${repository.fullName}`,
        repository,
        project: { id: project.id, name: project.name, canonicalUrl: project.canonicalUrl, summary: project.summary },
        landing: { canonicalUrl: project.canonicalUrl, host: new URL(project.canonicalUrl).hostname },
        lab: { catalogued: cataloguedProjects.has(project.id), canonicalUrl: lab.canonicalUrl },
        publicChannels: (project.attributes.links || []).filter((link) => !githubRepository(link.url)),
        provenance: project.provenance,
      })));

  const uniqueEntries = [...new Map(entries.map((entry) => [entry.id, entry])).values()].sort((a, b) => a.id.localeCompare(b.id));
  const relations = uniqueEntries.flatMap((entry) => [
    { from: entry.id, type: 'maps_to', to: entry.project.id },
    { from: entry.project.id, type: 'has_abvx_landing', to: entry.landing.canonicalUrl },
    ...(entry.lab.catalogued ? [{ from: entry.project.id, type: 'catalogued_by', to: 'lab:abvx' }] : []),
  ]);
  const stable = { sourceDigest: presenceIndex.sourceDigest, entries: uniqueEntries, relations };
  return {
    schemaVersion: 1,
    kind: 'CortexABVPublicProjectRegistry',
    version: 'v1',
    authority: 'read',
    externalSideEffects: false,
    generatedAt,
    sourceIndex: { path: 'cortex-abv/public-presence-index.v1.json', sourceDigest: presenceIndex.sourceDigest },
    sourceDigest: digest(stable),
    coverage: {
      publicProjectEntities: presenceIndex.entities.filter((entity) => entity.kind === 'project').length,
      explicitlyLinkedRepositories: uniqueEntries.length,
      cataloguedProjects: uniqueEntries.filter((entry) => entry.lab.catalogued).length,
    },
    entries: uniqueEntries,
    relations,
  };
}
