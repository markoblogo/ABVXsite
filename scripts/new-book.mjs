import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ensureMediaFolder, parseList, promptForBase, writeContentFile } from './content-lib.mjs';

const base = await promptForBase('book');
const rl = readline.createInterface({ input, output });
const today = new Date().toISOString().slice(0, 10);
try {
  const shortTitle = (await rl.question('Short title (optional): ')).trim();
  const subtitle = (await rl.question('Subtitle (optional): ')).trim();
  const series = (await rl.question('Series (optional): ')).trim();
  const group = (await rl.question('Group/publishing line (optional): ')).trim();
  const formats = parseList(await rl.question('Formats (kindle,paperback,pdf,site): '));
  const data = {
    id: base.slug,
    slug: base.slug,
    type: base.type,
    status: base.status,
    visibility: 'draft',
    publishedAt: today,
    homepageEligible: true,
    title: base.title,
    ...(shortTitle ? { shortTitle } : {}),
    ...(subtitle ? { subtitle } : {}),
    summary: base.summary,
    ...(series ? { series } : {}),
    ...(group ? { group } : {}),
    tags: base.tags,
    appearsIn: ['books'],
    formats,
    media: {
      src: `/media/books/${base.slug}/cover.png`,
      alt: `${base.title} cover`,
      role: 'book-cover',
    },
    links: [],
    featured: false,
    sortRank: 999,
    needsCopyReview: true,
    needsMediaReview: true,
    needsLinkReview: true,
    editorialNotes: 'New draft created from generator.',
  };
  const filePath = writeContentFile('books', base.slug, data, 'Longer book description.');
  const mediaPath = ensureMediaFolder('books', base.slug);
  console.log(`Created ${filePath}`);
  console.log(`Created ${mediaPath}`);
  console.log('Next: add media, update links, run npm run content:validate, then npm run build.');
} finally {
  rl.close();
}
