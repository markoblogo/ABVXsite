import { contentFiles, parseContentFile } from './content-lib.mjs';

const items = [];

for (const folder of ['books', 'work', 'series']) {
  for (const file of contentFiles(folder)) {
    const parsed = parseContentFile(file);
    items.push({ folder, file, ...parsed });
  }
}

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

section('Needs copy review', items.filter((item) => item.data.needsCopyReview));
section('Needs media review', items.filter((item) => item.data.needsMediaReview));
section('Needs link review', items.filter((item) => item.data.needsLinkReview));
section('No body / long description', items.filter((item) => !item.body));
section('Books without purchase links', items.filter((item) => item.folder === 'books' && !hasLink(item, ['kindle', 'paperback', 'amazon'])));
section(
  'Released books without Kindle/Paperback',
  items.filter((item) => item.folder === 'books' && item.data.status === 'released' && !hasLink(item, ['kindle', 'paperback'])),
);
section('Work without public action link', items.filter((item) => item.folder === 'work' && !hasLink(item, ['site', 'demo', 'github', 'youtube', 'pdf', 'deck'])));
section('Items without media', items.filter((item) => !item.data.media));
section('Items using generic-thumbnail', items.filter((item) => item.data.media?.role === 'generic-thumbnail'));
section('Very short summaries', items.filter((item) => typeof item.data.summary === 'string' && item.data.summary.length < 60));

console.log(`\nTotal content files reviewed: ${items.length}`);
