import { contentFiles, parseContentFile } from './content-lib.mjs';

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

section('Needs copy review', publicItems.filter((item) => item.data.needsCopyReview));
section('Needs media review', publicItems.filter((item) => item.data.needsMediaReview));
section('Needs link review', publicItems.filter((item) => item.data.needsLinkReview));
section('No body / long description', publicItems.filter((item) => !item.body));
section('Books without purchase links', publicItems.filter((item) => item.folder === 'books' && !hasLink(item, ['kindle', 'paperback', 'amazon'])));
section(
  'Released books without Kindle/Paperback',
  publicItems.filter((item) => item.folder === 'books' && item.data.status === 'released' && !hasLink(item, ['kindle', 'paperback'])),
);
section('Work without public action link', publicItems.filter((item) => item.folder === 'work' && !hasLink(item, ['site', 'demo', 'github', 'youtube', 'pdf', 'deck'])));
section('Items without media', publicItems.filter((item) => !item.data.media));
section('Items using generic-thumbnail', publicItems.filter((item) => item.data.media?.role === 'generic-thumbnail'));
section('Very short summaries', publicItems.filter((item) => typeof item.data.summary === 'string' && item.data.summary.length < 60));

console.log(`\nTotal public content files reviewed: ${publicItems.length}`);
console.log(`Total content files scanned: ${items.length}`);
