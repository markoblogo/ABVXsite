import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import vm from 'node:vm';
import { writeContentFile } from './content-lib.mjs';

function loadTsExport(filePath, exportName) {
  const source = readFileSync(filePath, 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const sandbox = { exports: {}, require: () => ({}) };
  vm.runInNewContext(js, sandbox, { filename: filePath });
  return sandbox.exports[exportName];
}

function mapLinkType(type) {
  const mapping = {
    website: 'site',
    'book-site': 'site',
    'series-site': 'series',
    'amazon-kindle': 'kindle',
    'amazon-paperback': 'paperback',
  };
  return mapping[type] || type;
}

function mapImage(image) {
  if (!image) return undefined;
  return {
    src: image.src,
    alt: image.alt,
    role: image.mediaRole || image.role || 'generic-thumbnail',
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {}),
  };
}

function mapLinks(links = []) {
  return links.map((link) => ({
    type: mapLinkType(link.type),
    label: link.label,
    url: link.url,
  }));
}

function commonFields(item) {
  return {
    id: item.id,
    slug: item.slug,
    type: item.type,
    status: item.status,
    visibility: item.visibility || 'public',
    title: item.title,
    ...(item.shortTitle ? { shortTitle: item.shortTitle } : {}),
    ...(item.subtitle ? { subtitle: item.subtitle } : {}),
    summary: item.summary,
    ...(item.publishedAt ? { publishedAt: item.publishedAt } : {}),
    ...(item.updatedAt ? { updatedAt: item.updatedAt } : {}),
    tags: item.tags || [],
    appearsIn: item.appearsIn || ['books'],
    links: mapLinks(item.links),
    featured: Boolean(item.featured),
    sortRank: item.sortRank ?? 999,
    needsCopyReview: Boolean(item.needsReview),
    needsMediaReview: Boolean(item.mediaNeedsReview || (!item.coverImage && !item.thumbnail && item.type !== 'series')),
    needsLinkReview: Boolean(item.needsLinkReview || !(item.links || []).length),
    ...(item.needsReview || item.mediaNeedsReview ? { editorialNotes: 'Migrated from TypeScript registry; review copy/media/links before final polish.' } : {}),
  };
}

const root = process.cwd();
const books = loadTsExport(path.join(root, 'src/content/books.ts'), 'books');
const artifacts = loadTsExport(path.join(root, 'src/content/artifacts.ts'), 'artifacts');
const overwrite = process.argv.includes('--overwrite');

mkdirSync(path.join(root, 'content/books'), { recursive: true });
mkdirSync(path.join(root, 'content/work'), { recursive: true });
mkdirSync(path.join(root, 'content/series'), { recursive: true });

let bookCount = 0;
let workCount = 0;
let seriesCount = 0;
let skippedCount = 0;

function writeIfMissing(folder, slug, data, body = '') {
  const filePath = path.join(root, 'content', folder, `${slug}.md`);
  if (!overwrite && existsSync(filePath)) {
    skippedCount += 1;
    return false;
  }
  writeContentFile(folder, slug, data, body);
  return true;
}

for (const item of books) {
  const data = {
    ...commonFields(item),
    ...(item.series ? { series: item.series } : {}),
    ...(item.category ? { group: item.category } : {}),
    ...(item.formats ? { formats: item.formats.map(mapLinkType) } : {}),
    ...(mapImage(item.coverImage) ? { media: mapImage(item.coverImage) } : {}),
    ...(mapImage(item.heroImage) ? { heroImage: mapImage(item.heroImage) } : {}),
  };

  if (item.type === 'series') {
    if (writeIfMissing('series', item.slug, data, item.description || '')) seriesCount += 1;
  } else {
    if (writeIfMissing('books', item.slug, data, item.description || '')) bookCount += 1;
  }
}

for (const item of artifacts) {
  const data = {
    ...commonFields(item),
    primarySection: item.primarySection,
    ...(item.group ? { group: item.group } : {}),
    ...(mapImage(item.thumbnail) ? { media: mapImage(item.thumbnail) } : {}),
    ...(mapImage(item.heroImage) ? { heroImage: mapImage(item.heroImage) } : {}),
  };
  if (writeIfMissing('work', item.slug, data, item.description || '')) workCount += 1;
}

console.log(`Migrated ${bookCount} books, ${workCount} work items, ${seriesCount} series files.`);
if (skippedCount) console.log(`Skipped ${skippedCount} existing content files. Pass --overwrite to replace them.`);
