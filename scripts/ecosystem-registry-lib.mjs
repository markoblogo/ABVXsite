import { createHash } from 'node:crypto';

const RELATION_TYPES = new Set([
  'catalogues',
  'companion',
  'governs_with',
  'integrates_with',
  'publishes_via',
  'supplies_data_to',
  'uses',
]);
const RELATION_STATUSES = new Set(['active', 'planned', 'reference']);
const VISIBILITIES = new Set(['public', 'private']);
const LIFECYCLES = new Set(['active', 'paused', 'archived']);
const SHORT_LINK_POLICIES = new Set(['disabled', 'campaigns_only']);
const SURFACES = new Set(['readme', 'website', 'shortener', 'release_social', 'contract_test']);

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
}

function validateNode(node) {
  requireString(node.id, 'node.id');
  requireString(node.name, `${node.id}.name`);
  requireString(node.repository, `${node.id}.repository`);
  requireString(node.summary, `${node.id}.summary`);
  requireString(node.canonicalUrl, `${node.id}.canonicalUrl`);
  if (!VISIBILITIES.has(node.visibility)) throw new Error(`${node.id}.visibility is invalid`);
  if (!LIFECYCLES.has(node.lifecycle)) throw new Error(`${node.id}.lifecycle is invalid`);
  if (!node.propagation || typeof node.propagation !== 'object') throw new Error(`${node.id}.propagation is required`);
  if (!SHORT_LINK_POLICIES.has(node.propagation.shortLinks)) throw new Error(`${node.id}.propagation.shortLinks is invalid`);
  if (node.visibility === 'private' && node.propagation.releaseSocial) {
    throw new Error(`private node ${node.id} cannot enable releaseSocial`);
  }
}

function validateRelation(relation, nodeIds) {
  requireString(relation.from, 'relation.from');
  requireString(relation.to, 'relation.to');
  if (!nodeIds.has(relation.from) || !nodeIds.has(relation.to)) {
    throw new Error(`relation references unknown node: ${relation.from} -> ${relation.to}`);
  }
  if (relation.from === relation.to) throw new Error(`relation cannot reference itself: ${relation.from}`);
  if (!RELATION_TYPES.has(relation.type)) throw new Error(`relation type is invalid: ${relation.type}`);
  if (!RELATION_STATUSES.has(relation.status)) throw new Error(`relation status is invalid: ${relation.status}`);
  requireString(relation.summary, `${relation.from}->${relation.to}.summary`);
  const propagation = relation.propagation;
  if (!propagation || !Array.isArray(propagation.watch) || !Array.isArray(propagation.surfaces)) {
    throw new Error(`${relation.from}->${relation.to}.propagation is invalid`);
  }
  for (const surface of propagation.surfaces) {
    if (!SURFACES.has(surface)) throw new Error(`relation surface is invalid: ${surface}`);
  }
  if (!['docs', 'contract', 'none'].includes(propagation.compatibility)) {
    throw new Error(`${relation.from}->${relation.to}.compatibility is invalid`);
  }
}

export function buildEcosystemRegistry({ graph, generatedAt }) {
  if (graph?.schemaVersion !== 1 || graph?.kind !== 'ABVXEcosystemGraph') {
    throw new Error('ecosystem graph must be ABVXEcosystemGraph v1');
  }
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.relations)) throw new Error('ecosystem graph is incomplete');
  graph.nodes.forEach(validateNode);
  const nodeIds = new Set(graph.nodes.map(({ id }) => id));
  if (nodeIds.size !== graph.nodes.length) throw new Error('ecosystem node ids must be unique');
  graph.relations.forEach((relation) => validateRelation(relation, nodeIds));
  const relationIds = graph.relations.map(({ from, type, to }) => `${from}:${type}:${to}`);
  if (new Set(relationIds).size !== relationIds.length) throw new Error('ecosystem relations must be unique');

  const nodes = structuredClone(graph.nodes).sort((a, b) => a.id.localeCompare(b.id));
  const relations = structuredClone(graph.relations).sort((a, b) => `${a.from}:${a.type}:${a.to}`.localeCompare(`${b.from}:${b.type}:${b.to}`));
  const stable = { schemaVersion: 1, kind: 'ABVXEcosystemRegistry', nodes, relations };
  return {
    schemaVersion: 1,
    kind: 'ABVXEcosystemRegistry',
    version: 'v1',
    authority: 'read',
    externalSideEffects: false,
    generatedAt,
    source: 'cortex-abv/ecosystem-graph.v1.json',
    sourceDigest: digest(stable),
    coverage: {
      nodes: nodes.length,
      publicNodes: nodes.filter(({ visibility }) => visibility === 'public').length,
      privateNodes: nodes.filter(({ visibility }) => visibility === 'private').length,
      activeRelations: relations.filter(({ status }) => status === 'active').length,
      plannedRelations: relations.filter(({ status }) => status === 'planned').length,
    },
    nodes,
    relations,
  };
}

export function buildImpactPlan({ registry, changedNode, changedFields }) {
  if (!registry.nodes.some(({ id }) => id === changedNode)) throw new Error(`unknown changed node: ${changedNode}`);
  const changed = [...new Set(changedFields)].sort();
  const impacts = registry.relations
    .filter(({ to, status, propagation }) => to === changedNode && status === 'active'
      && propagation.watch.some((field) => changed.includes(field)))
    .map((relation) => ({
      consumer: relation.from,
      provider: relation.to,
      relation: relation.type,
      changedFields: changed.filter((field) => relation.propagation.watch.includes(field)),
      surfaces: relation.propagation.surfaces,
      compatibility: relation.propagation.compatibility,
    }));
  return { schemaVersion: 1, kind: 'ABVXEcosystemImpactPlan', changedNode, changedFields: changed, impacts };
}

export function renderReadmeBlock({ registry, nodeId }) {
  const nodeById = new Map(registry.nodes.map((node) => [node.id, node]));
  if (!nodeById.has(nodeId)) throw new Error(`unknown node: ${nodeId}`);
  const relations = registry.relations.filter(({ from, status, propagation }) => from === nodeId && status === 'active' && propagation.surfaces.includes('readme'));
  const lines = ['<!-- ABVX:ECOSYSTEM:BEGIN -->', '## ABVX ecosystem', ''];
  if (!relations.length) lines.push('This project is listed in the [ABVX ecosystem](https://abvx.xyz/systems).');
  for (const relation of relations) {
    const target = nodeById.get(relation.to);
    const release = target.release?.tag ? ` Current release: \`${target.release.tag}\`.` : '';
    lines.push(`- [${target.name}](${target.canonicalUrl}) — ${relation.summary}${release}`);
  }
  lines.push('', '_This block is generated from the reviewed ABVX ecosystem registry._', '<!-- ABVX:ECOSYSTEM:END -->');
  return `${lines.join('\n')}\n`;
}

export function applyRepositoryObservations({ graph, observations, observedAt }) {
  const byRepository = new Map(observations.map((observation) => [observation.repository, observation]));
  const changedNodes = [];
  const nodes = graph.nodes.map((node) => {
    const observed = byRepository.get(node.repository);
    if (!observed) return node;
    const changedFields = [];
    const next = structuredClone(node);
    if (observed.description && observed.description !== node.summary) {
      next.summary = observed.description;
      changedFields.push('summary');
    }
    if (observed.homepageUrl && observed.homepageUrl !== node.observedHomepageUrl) {
      next.observedHomepageUrl = observed.homepageUrl;
      changedFields.push('canonicalUrl');
    }
    const previousTag = node.release?.tag || null;
    const nextTag = observed.latestRelease?.tag || null;
    if (previousTag !== nextTag) {
      next.release = observed.latestRelease || null;
      changedFields.push('release');
    }
    if (changedFields.length) changedNodes.push({ nodeId: node.id, changedFields });
    return next;
  });
  return {
    graph: { ...graph, updatedAt: changedNodes.length ? observedAt : graph.updatedAt, nodes },
    changes: changedNodes,
  };
}

export function upsertManagedReadmeBlock({ readme, block }) {
  const begin = '<!-- ABVX:ECOSYSTEM:BEGIN -->';
  const end = '<!-- ABVX:ECOSYSTEM:END -->';
  const start = readme.indexOf(begin);
  const finish = readme.indexOf(end);
  if ((start >= 0) !== (finish >= 0) || (start >= 0 && finish < start)) {
    throw new Error('README has an incomplete ABVX ecosystem block');
  }
  if (start >= 0) {
    const after = finish + end.length;
    return `${readme.slice(0, start)}${block.trimEnd()}${readme.slice(after)}`;
  }
  return `${readme.trimEnd()}\n\n${block}`;
}
