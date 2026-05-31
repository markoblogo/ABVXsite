import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { contentFiles, mediaRoot, parseContentFile } from './content-lib.mjs';

const items = [];

for (const folder of ['books', 'work', 'series']) {
  for (const file of contentFiles(folder)) {
    const parsed = parseContentFile(file);
    items.push({ folder, file, ...parsed });
  }
}

const publicItems = items.filter((item) => item.data.visibility !== 'private' && item.data.visibility !== 'draft');

function hasLink(item, types) {
  return Array.isArray(item.data.links) && item.data.links.some((link) => types.includes(link.type));
}

function isFreeBook(item) {
  return item.folder === 'books' && ['free-book', 'free-edition', 'companion'].includes(item.data.type);
}

function section(title, entries) {
  console.log(`\n${title} (${entries.length})`);
  if (!entries.length) {
    console.log('- none');
    return;
  }
  for (const item of entries) {
    console.log(`- ${item.folder}/${item.data.slug}: ${item.data.title}`);
  }
}

function localMediaMissing(item) {
  const src = item.data.media?.src || item.data.heroImage?.src;
  if (!src?.startsWith('/media/')) return false;
  return !existsSync(path.join(mediaRoot, src.replace(/^\/media\//, '')));
}

function legacySlugs(file) {
  if (!existsSync(file)) return new Set();
  const source = readFileSync(file, 'utf8');
  return new Set([...source.matchAll(/slug:\s*['"`]([^'"`]+)['"`]/g)].map((match) => match[1]));
}

const fallbackWorkSlugs = legacySlugs(path.join(process.cwd(), 'src', 'content', 'artifacts.ts'));
const fallbackBookSlugs = legacySlugs(path.join(process.cwd(), 'src', 'content', 'books.ts'));

function overridesLegacyFallback(item) {
  if (item.folder === 'work') return fallbackWorkSlugs.has(item.data.slug);
  if (item.folder === 'books' || item.folder === 'series') return fallbackBookSlugs.has(item.data.slug);
  return false;
}

section('Needs copy review', publicItems.filter((item) => item.data.needsCopyReview));
section('Needs media review', publicItems.filter((item) => item.data.needsMediaReview));
section('Needs link review', publicItems.filter((item) => item.data.needsLinkReview));
section('Content files overriding legacy TS fallback', publicItems.filter(overridesLegacyFallback));
section('No body / long description', publicItems.filter((item) => !item.body));
section(
  'Books without purchase links',
  publicItems.filter((item) => item.folder === 'books' && !isFreeBook(item) && !hasLink(item, ['kindle', 'paperback', 'amazon'])),
);
section(
  'Released books without Kindle/Paperback',
  publicItems.filter(
    (item) => item.folder === 'books' && item.data.status === 'released' && !isFreeBook(item) && !hasLink(item, ['kindle', 'paperback']),
  ),
);
section('Work without public action link', publicItems.filter((item) => item.folder === 'work' && !hasLink(item, ['site', 'demo', 'github', 'youtube', 'pdf', 'deck'])));
section('Items without media', publicItems.filter((item) => !item.data.media && !item.data.rssFeed?.enabled));
section('Items with missing local media files', publicItems.filter(localMediaMissing));
section('Items using generic-thumbnail', publicItems.filter((item) => item.data.media?.role === 'generic-thumbnail'));
section('Very short summaries', publicItems.filter((item) => typeof item.data.summary === 'string' && item.data.summary.length < 60));

console.log(`\nTotal public content files reviewed: ${publicItems.length}`);
console.log(`Total content files scanned: ${items.length}`);
