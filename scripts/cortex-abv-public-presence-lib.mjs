import { createHash } from 'node:crypto';

const SITE_URL = 'https://abvx.xyz';

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

function publicItems(contentItems) {
  return contentItems.filter(({ data }) => data?.visibility !== 'private' && data?.visibility !== 'draft');
}

function canonicalUrl(folder, slugValue) {
  return `${SITE_URL}/${folder === 'work' ? 'work' : 'books'}/${slugValue}`;
}

function contentEntity({ folder, filePath, data }) {
  const entityKind = folder === 'work' ? 'project' : folder === 'series' ? 'series' : 'publication';
  return {
    id: `${entityKind}:${data.slug}`,
    kind: entityKind,
    name: data.title,
    canonicalUrl: canonicalUrl(folder, data.slug),
    summary: data.summary,
    attributes: {
      status: data.status || null,
      section: folder === 'work' ? data.primarySection || null : 'books',
      tags: Array.isArray(data.tags) ? data.tags : [],
      links: Array.isArray(data.links) ? data.links.filter((link) => link?.url).map(({ type, label, url }) => ({ type, label, url })) : [],
      updatedAt: data.updatedAt || data.publishedAt || null,
    },
    provenance: [{ kind: 'content_frontmatter', path: filePath, digest: digest(data) }],
  };
}

function relation(from, type, to) {
  return { from, type, to };
}

export function buildPublicPresenceIndex({ config, contentItems, feedItemsBySource = {}, generatedAt }) {
  if (config?.schemaVersion !== 1 || config?.kind !== 'CortexABVPublicPresenceSources') {
    throw new Error('public presence source config must be CortexABVPublicPresenceSources v1');
  }
  if (!config.person?.id || !config.site?.id || !config.lab?.id || !Array.isArray(config.writingFeeds)) {
    throw new Error('public presence source config is incomplete');
  }

  const entities = [
    {
      id: config.person.id,
      kind: 'person',
      name: config.person.name,
      canonicalUrl: config.person.canonicalUrl,
      summary: config.person.summary,
      attributes: {},
      provenance: [{ kind: 'source_config', path: 'cortex-abv/public-presence-sources.v1.json', digest: digest(config.person) }],
    },
    {
      id: config.site.id,
      kind: 'site',
      name: config.site.name,
      canonicalUrl: config.site.canonicalUrl,
      summary: config.site.summary,
      attributes: { publicRoutes: ['/', '/about', '/focus', '/systems', '/books', '/writing'] },
      provenance: [{ kind: 'source_config', path: 'cortex-abv/public-presence-sources.v1.json', digest: digest(config.site) }],
    },
    {
      id: config.lab.id,
      kind: 'lab',
      name: config.lab.name,
      canonicalUrl: config.lab.canonicalUrl,
      summary: config.lab.summary,
      attributes: { currentRoute: '/systems', legacyRoutes: ['/tech-lab', '/lang-lab'] },
      provenance: [{ kind: 'source_config', path: 'cortex-abv/public-presence-sources.v1.json', digest: digest(config.lab) }],
    },
    ...publicItems(contentItems).map(contentEntity),
  ];

  const relations = [
    relation(config.person.id, 'publicly_represented_by', config.site.id),
    relation(config.person.id, 'maintains', config.lab.id),
    relation(config.site.id, 'contains', config.lab.id),
  ];

  for (const entity of entities.filter(({ kind }) => ['project', 'publication', 'series'].includes(kind))) {
    relations.push(relation(config.site.id, 'contains', entity.id));
    if (entity.kind === 'project' && entity.attributes.section === 'systems') relations.push(relation(config.lab.id, 'catalogues', entity.id));
  }

  for (const feed of config.writingFeeds) {
    const feedItems = feedItemsBySource[feed.id] || [];
    entities.push({
      id: feed.id,
      kind: 'writing_feed',
      name: feed.name,
      canonicalUrl: feed.archiveUrl,
      summary: `Configured public writing feed: ${feed.name}.`,
      attributes: { feedUrl: feed.feedUrl, sourceStatus: feedItems.status || 'available' },
      provenance: [{ kind: 'rss_feed', path: feed.feedUrl, digest: digest(feed) }],
    });
    relations.push(relation(config.site.id, 'aggregates', feed.id));
    for (const item of Array.isArray(feedItems) ? feedItems : []) {
      const itemId = `writing-item:${feed.id.split(':')[1]}:${slug(item.title)}`;
      entities.push({
        id: itemId,
        kind: 'writing_item',
        name: item.title,
        canonicalUrl: item.url,
        summary: item.excerpt || null,
        attributes: { publishedAt: item.publishedAt || null },
        provenance: [{ kind: 'rss_item', path: feed.feedUrl, digest: digest({ title: item.title, url: item.url, publishedAt: item.publishedAt || null }) }],
      });
      relations.push(relation(feed.id, 'publishes', itemId));
    }
  }

  entities.sort((a, b) => a.id.localeCompare(b.id));
  relations.sort((a, b) => `${a.from}:${a.type}:${a.to}`.localeCompare(`${b.from}:${b.type}:${b.to}`));
  const stable = { schemaVersion: 1, kind: 'CortexABVPublicPresenceIndex', config, entities, relations };
  return {
    schemaVersion: 1,
    kind: 'CortexABVPublicPresenceIndex',
    version: 'v1',
    authority: 'read',
    externalSideEffects: false,
    generatedAt,
    sourceDigest: digest(stable),
    sources: {
      site: ['README.md', 'content/**', 'src/app/writing/page.tsx'],
      lab: ['src/app/tech-lab/page.tsx', 'src/app/lang-lab/page.tsx', 'content/work/**'],
      writingFeeds: config.writingFeeds.map(({ id, feedUrl }) => ({ id, feedUrl })),
    },
    entities,
    relations,
  };
}

export function parseRssItems(xml, limit = 12) {
  const decode = (value) => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').trim();
  const tag = (value, name) => new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(value)?.[1] || '';
  return xml.split(/<item>/i).slice(1).map((chunk) => {
    const item = chunk.split(/<\/item>/i)[0];
    return { title: decode(tag(item, 'title')), url: decode(tag(item, 'link')), publishedAt: decode(tag(item, 'pubDate')) || null };
  }).filter(({ title, url }) => title && /^https:\/\//.test(url)).slice(0, limit);
}
