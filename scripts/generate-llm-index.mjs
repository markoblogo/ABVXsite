import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentFiles, parseContentFile } from './content-lib.mjs';

const SITE_URL = 'https://abvx.xyz';
const outputDir = path.join(process.cwd(), 'public');

function readItems(folder) {
  return contentFiles(folder)
    .map((filePath) => {
      const { data } = parseContentFile(filePath);
      return { folder, ...data };
    })
    .filter((item) => item.visibility !== 'private' && item.visibility !== 'draft');
}

function canonicalPath(item) {
  if (item.folder === 'work') return `/work/${item.slug}`;
  return `/books/${item.slug}`;
}

function canonicalUrl(item) {
  return `${SITE_URL}${canonicalPath(item)}`;
}

function itemSection(item) {
  if (item.folder === 'books' || item.folder === 'series') return 'books';
  return item.primarySection || item.appearsIn?.[0] || 'systems';
}

function itemKind(item) {
  if (item.folder === 'work') return 'work';
  if (item.folder === 'series') return 'series';
  return item.type || 'book';
}

function ecosystemLabel(item) {
  if (item.folder === 'series') return 'Publishing lines';
  if (item.folder === 'books') return item.group || item.series || 'Books';
  if (item.primarySection === 'focus' || item.appearsIn?.includes('focus')) return 'Agro Market Infrastructure Systems';
  if (['Publishing Companion Sites', 'Language Tools, Protocols & Experiments', 'Publishing systems & protocols'].includes(item.group)) {
    return 'Publishing & Language Systems';
  }
  if (['Workflow & Orchestration', 'Development Surfaces & Interfaces', 'Protocols & Decision Systems'].includes(item.group)) {
    return 'AI-native Development Systems';
  }
  if (item.group === 'Standalone Utilities & Experiments') return 'Standalone Utilities & Experiments';
  return item.group || item.primarySection || item.folder;
}

function cleanLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .filter((link) => link && typeof link === 'object' && link.url)
    .map((link) => ({
      type: String(link.type || 'other'),
      label: String(link.label || link.type || 'Link'),
      url: String(link.url),
    }));
}

function cleanTags(tags) {
  return Array.isArray(tags) ? tags.filter((tag) => typeof tag === 'string' && tag.trim()) : [];
}

function uniqueByUrl(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item.canonicalUrl || seen.has(item.canonicalUrl)) return false;
    seen.add(item.canonicalUrl);
    return true;
  });
}

const rawItems = [...readItems('work'), ...readItems('books'), ...readItems('series')];
const bySlug = new Map(rawItems.map((item) => [item.slug, item]));

function relationObjects(item) {
  const related = [];
  const explicit = Array.isArray(item.relatedSlugs) ? item.relatedSlugs : [];
  const seriesSlugs = Array.isArray(item.seriesSlugs) ? item.seriesSlugs : [];

  for (const slug of explicit) {
    const target = bySlug.get(slug);
    if (target) {
      related.push({
        title: target.title,
        canonicalUrl: canonicalUrl(target),
        relation: 'related',
      });
    }
  }

  if (item.translationOf) {
    const target = bySlug.get(item.translationOf);
    if (target) {
      related.push({
        title: target.title,
        canonicalUrl: canonicalUrl(target),
        relation: 'translationOf',
      });
    }
  }

  for (const slug of [item.primarySeriesSlug, ...seriesSlugs].filter(Boolean)) {
    const target = bySlug.get(slug);
    if (target) {
      related.push({
        title: target.title,
        canonicalUrl: canonicalUrl(target),
        relation: 'series',
      });
    }
  }

  if (item.folder === 'series') {
    for (const target of rawItems) {
      if (target.slug === item.slug) continue;
      const targetSeries = new Set([target.primarySeriesSlug, ...(target.seriesSlugs || [])].filter(Boolean));
      if (targetSeries.has(item.slug)) {
        related.push({
          title: target.title,
          canonicalUrl: canonicalUrl(target),
          relation: target.folder === 'work' ? 'companion' : 'member',
        });
      }
    }
  }

  return uniqueByUrl(related);
}

function publicIndexItem(item) {
  return {
    type: itemKind(item),
    section: itemSection(item),
    ecosystem: ecosystemLabel(item),
    group: item.group || item.series || null,
    status: item.status || null,
    title: item.title,
    summary: item.summary,
    canonicalUrl: canonicalUrl(item),
    tags: cleanTags(item.tags),
    links: cleanLinks(item.links),
    updatedAt: item.updatedAt || item.publishedAt || null,
    related: relationObjects(item),
  };
}

const indexItems = rawItems
  .map(publicIndexItem)
  .sort((a, b) => a.section.localeCompare(b.section) || a.title.localeCompare(b.title));

function isFocus(item) {
  return item.folder === 'work' && (item.primarySection === 'focus' || item.appearsIn?.includes('focus'));
}

function isAiNative(item) {
  return (
    item.folder === 'work' &&
    ['Workflow & Orchestration', 'Development Surfaces & Interfaces', 'Protocols & Decision Systems'].includes(item.group)
  );
}

function isStandaloneUtility(item) {
  return item.folder === 'work' && item.group === 'Standalone Utilities & Experiments';
}

function isPublishingLine(item) {
  return item.folder === 'series' && item.group === 'Official publishing lines';
}

function isBooksEcosystemItem(item) {
  return item.folder === 'books' || (item.folder === 'work' && item.appearsIn?.includes('books'));
}

function llmsLine(item) {
  const tags = cleanTags(item.tags).slice(0, 8).join(', ');
  const group = item.group || item.series || item.primarySection || item.folder;
  return [
    `- ${item.title}`,
    `  URL: ${canonicalUrl(item)}`,
    `  Summary: ${item.summary}`,
    `  Group: ${group}`,
    tags ? `  Tags: ${tags}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}

function llmsSection(title, items) {
  const lines = items
    .sort((a, b) => (a.sortRank ?? 999) - (b.sortRank ?? 999) || a.title.localeCompare(b.title))
    .map(llmsLine)
    .join('\n\n');
  return `## ${title}\n\n${lines || '- No public items.'}`;
}

const llms = [
  '# ABVX public LLM index',
  '',
  'Site: https://abvx.xyz',
  'Name: ABVX / Anton Biletskyi-Volokh',
  'Summary: ABVX is the public ecosystem site for focus infrastructure, publishing lines, books, AI-native systems, language tools and standalone utilities.',
  'Machine-readable index: https://abvx.xyz/content-index.json',
  'Primary layers: Focus = market infrastructure; Systems = operational systems architecture; Books = publishing and intellectual layer; Writing = essays and field notes.',
  '',
  llmsSection('Focus systems', rawItems.filter(isFocus)),
  '',
  llmsSection('Publishing lines', rawItems.filter(isPublishingLine)),
  '',
  llmsSection('Books', rawItems.filter(isBooksEcosystemItem)),
  '',
  llmsSection('AI-native systems', rawItems.filter(isAiNative)),
  '',
  llmsSection('Standalone utilities', rawItems.filter(isStandaloneUtility)),
  '',
  '## Notes for crawlers and LLM agents',
  '',
  '- Canonical pages use https://abvx.xyz URLs.',
  '- Public content source files live under /content in the repository.',
  '- Review flags and editorial notes are intentionally excluded from this public index.',
  '- Use /content-index.json when a structured public inventory is needed.',
  '',
].join('\n');

writeFileSync(path.join(outputDir, 'llms.txt'), llms);
writeFileSync(
  path.join(outputDir, 'content-index.json'),
  `${JSON.stringify(
    {
      site: SITE_URL,
      generatedFrom: '/content',
      items: indexItems,
    },
    null,
    2,
  )}\n`,
);

console.log(`Generated public/llms.txt and public/content-index.json with ${indexItems.length} items.`);
