import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ensureMediaFolder, parseList, promptForBase, writeContentFile } from './content-lib.mjs';

const base = await promptForBase('series');
const rl = readline.createInterface({ input, output });
try {
  const group = (await rl.question('Group/publishing line (optional): ')).trim();
  const appearsIn = parseList(await rl.question('Appears in (books): '));
  const data = {
    id: base.slug,
    slug: base.slug,
    type: 'series',
    status: base.status,
    visibility: 'draft',
    title: base.title,
    summary: base.summary,
    ...(group ? { group } : {}),
    tags: base.tags,
    appearsIn: appearsIn.length ? appearsIn : ['books'],
    media: {
      src: `/media/series/${base.slug}/cover.png`,
      alt: `${base.title} series media`,
      role: 'mockup',
    },
    links: [],
    featured: false,
    sortRank: 999,
    needsCopyReview: true,
    needsMediaReview: true,
    needsLinkReview: true,
    editorialNotes: 'New draft created from generator.',
  };
  const filePath = writeContentFile('series', base.slug, data, 'Longer series description.');
  const mediaPath = ensureMediaFolder('series', base.slug);
  console.log(`Created ${filePath}`);
  console.log(`Created ${mediaPath}`);
  console.log('Next: add media, update links, run npm run content:validate, then npm run build.');
} finally {
  rl.close();
}
