import { promptForBase, writeContentFile } from './content-lib.mjs';

const base = await promptForBase('note');
const filePath = writeContentFile(
  'writing',
  base.slug,
  {
    id: base.slug,
    slug: base.slug,
    title: base.title,
    type: base.type || 'note',
    primarySection: 'writing',
    appearsIn: ['writing'],
    status: 'live',
    visibility: 'draft',
    summary: base.summary,
    tags: base.tags,
    links: [],
    featured: false,
    sortRank: 500,
    needsReview: false,
    homepageEligible: false,
    publishedAt: new Date().toISOString().slice(0, 10),
  },
  '',
);

console.log(`Created ${filePath}`);
