#!/usr/bin/env node

import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const NOTION_VERSION = '2025-09-03';
const NOTION_API_BASE = 'https://api.notion.com/v1';

const DATA_SOURCES = {
  ecosystems: '2f83d845-eb21-80f3-ae17-000b19f8a8c8',
  projects: '2b43d845-eb21-80be-9968-000b982244a7',
  books: '2853d845-eb21-800e-a5ae-000b6a38ddd4',
};

const OUT_DIR = 'content-migration';

function requireNotionToken() {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    console.error(
      [
        'Missing NOTION_TOKEN.',
        'Legacy content export reads public-facing fields from Notion locally.',
        'Run it with NOTION_TOKEN set in your shell or .env loader; do not commit the token.',
      ].join('\n'),
    );
    process.exitCode = 1;
    return null;
  }
  return token;
}

async function notionFetch(token, pathName, init = {}) {
  const response = await fetch(`${NOTION_API_BASE}${pathName}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const json = await response.json();
  if (!response.ok) {
    const message = json?.message || response.statusText;
    throw new Error(`Notion API error ${response.status}: ${message}`);
  }
  return json;
}

async function queryDataSource(token, dataSourceId) {
  const results = [];
  let startCursor;

  do {
    const body = { page_size: 100 };
    if (startCursor) body.start_cursor = startCursor;

    const response = await notionFetch(token, `/data_sources/${dataSourceId}/query`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    results.push(...(response.results || []));
    startCursor = response.has_more ? response.next_cursor : undefined;
  } while (startCursor);

  return results;
}

function propText(prop) {
  if (!prop) return '';
  if (prop.type === 'title') return (prop.title || []).map((item) => item.plain_text).join('');
  if (prop.type === 'rich_text') return (prop.rich_text || []).map((item) => item.plain_text).join('');
  if (prop.type === 'url') return prop.url || '';
  if (prop.type === 'select') return prop.select?.name || '';
  if (prop.type === 'multi_select') return (prop.multi_select || []).map((item) => item.name).join(', ');
  if (prop.type === 'number') return prop.number === null || prop.number === undefined ? '' : String(prop.number);
  if (prop.type === 'checkbox') return prop.checkbox ? 'true' : 'false';
  return '';
}

function propUrl(prop) {
  if (!prop) return undefined;
  if (prop.type === 'url') return prop.url || undefined;
  if (prop.type === 'files') {
    const file = (prop.files || [])[0];
    if (!file) return undefined;
    if (file.type === 'external') return file.external?.url || undefined;
    return undefined;
  }
  return propText(prop) || undefined;
}

function cleanLabel(value) {
  if (!value) return undefined;
  const out = value
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return out || undefined;
}

function splitLabels(value) {
  if (!value) return undefined;
  const out = value
    .split(',')
    .map((item) => cleanLabel(item))
    .filter(Boolean);
  return out.length ? out : undefined;
}

function propUrlAny(props, keys) {
  for (const key of keys) {
    const value = propUrl(props[key]);
    if (value) return value;
  }
  return undefined;
}

function publicCoverUrl(page) {
  const cover = page?.cover;
  if (!cover) return undefined;
  if (cover.type === 'external') return cover.external?.url || undefined;
  // Intentionally do not export Notion file URLs because they are temporary signed URLs.
  return undefined;
}

function grouping(props) {
  return compactObject({
    primaryDirection: cleanLabel(propText(props['Primary Direction'])),
    relatedDirections: splitLabels(
      cleanLabel(propText(props['Related Directions Text'])) ||
        cleanLabel(propText(props['Related Directions'])),
    ),
    initiative: cleanLabel(propText(props.Initiative)),
    parentInitiative: cleanLabel(propText(props['Parent Initiative'])),
    pressCluster: cleanLabel(propText(props['Press Cluster'])),
    pressSubcluster: cleanLabel(propText(props['Press Subcluster'])),
    langCluster: cleanLabel(propText(props['Lang Cluster'])),
    langSubcluster: cleanLabel(propText(props['Lang Subcluster'])),
    techCluster: cleanLabel(propText(props['Tech Cluster'])),
    techSubcluster: cleanLabel(propText(props['Tech Subcluster'])),
    croptoCluster: cleanLabel(propText(props['Cropto Cluster'])),
    croptoSubcluster: cleanLabel(propText(props['Cropto Subcluster'])),
  });
}

function compactObject(value) {
  if (Array.isArray(value)) {
    const out = value
      .map((item) => compactObject(item))
      .filter((item) => item !== undefined);
    return out.length ? out : undefined;
  }

  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, entry] of Object.entries(value)) {
      const compacted = compactObject(entry);
      if (compacted !== undefined) out[key] = compacted;
    }
    return Object.keys(out).length ? out : undefined;
  }

  if (value === '' || value === null || value === undefined) return undefined;
  return value;
}

function mapProject(page) {
  const props = page.properties || {};
  return compactObject({
    name: cleanLabel(propText(props.Name)),
    summary: cleanLabel(propText(props.Tagline)),
    type:
      cleanLabel(propText(props['Asset Type V2'])) ||
      cleanLabel(propText(props.Type)) ||
      cleanLabel(propText(props['Artifact Type'])),
    stage: cleanLabel(propText(props.Stage)),
    status: cleanLabel(propText(props.Status)),
    urls: {
      website: propUrl(props.Website),
      github: propUrl(props.GitHub),
      demo: propUrlAny(props, [
        'Demo',
        'Video',
        'Teaser',
        'Teaser video',
        'YouTube demo',
        'Youtube demo',
      ]),
    },
    coverImage: publicCoverUrl(page),
    grouping: grouping(props),
  });
}

function mapBook(page) {
  const props = page.properties || {};
  return compactObject({
    name: cleanLabel(propText(props.Name)),
    slug: cleanLabel(propText(props.Slug)),
    summary: cleanLabel(propText(props['Раздел'])),
    type: cleanLabel(propText(props['Asset Type V2'])) || cleanLabel(propText(props['Artifact Type'])),
    status: cleanLabel(propText(props.Status)),
    urls: {
      site: propUrl(props.Site),
      teaser: propUrlAny(props, [
        'Teaser',
        'Teaser video',
        'Video',
        'Video teaser',
        'YouTube teaser',
        'Youtube teaser',
      ]),
      pdf: propUrl(props.Pdf),
      amazon: propUrl(props['e-book Amazon']),
      paper: propUrl(props['Paper book']),
    },
    coverImage: publicCoverUrl(page),
    grouping: grouping(props),
  });
}

function mapEcosystemContext(page) {
  const props = page.properties || {};
  return compactObject({
    name: cleanLabel(propText(props.Name)),
    slug: cleanLabel(propText(props.Slug)),
    tagline: cleanLabel(propText(props.Tagline)),
    status: cleanLabel(propText(props.Status)),
    primaryUrl: propUrl(props['Primary URL']),
    coverImage: publicCoverUrl(page),
  });
}

async function writeJson(fileName, data) {
  const filePath = path.join(process.cwd(), OUT_DIR, fileName);
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await rename(tmpPath, filePath);
}

async function main() {
  const token = requireNotionToken();
  if (!token) return;

  const [projects, books, ecosystems] = await Promise.all([
    queryDataSource(token, DATA_SOURCES.projects),
    queryDataSource(token, DATA_SOURCES.books),
    queryDataSource(token, DATA_SOURCES.ecosystems),
  ]);

  await mkdir(path.join(process.cwd(), OUT_DIR), { recursive: true });

  await Promise.all([
    writeJson('legacy-projects.json', projects.map(mapProject).filter(Boolean)),
    writeJson('legacy-books.json', books.map(mapBook).filter(Boolean)),
    writeJson(
      'legacy-ecosystems-context.json',
      ecosystems.map(mapEcosystemContext).filter(Boolean),
    ),
  ]);

  console.log(`Exported ${projects.length} projects to ${OUT_DIR}/legacy-projects.json`);
  console.log(`Exported ${books.length} books to ${OUT_DIR}/legacy-books.json`);
  console.log(
    `Exported ${ecosystems.length} ecosystem context records to ${OUT_DIR}/legacy-ecosystems-context.json`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
