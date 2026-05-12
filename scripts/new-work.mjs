import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ensureMediaFolder, parseList, promptForBase, writeContentFile } from './content-lib.mjs';

const base = await promptForBase('web-service');
const rl = readline.createInterface({ input, output });
const today = new Date().toISOString().slice(0, 10);
try {
  const primarySection = (await rl.question('Primary section [focus/systems/books/writing] (systems): ')).trim() || 'systems';
  const appearsIn = parseList(await rl.question(`Appears in (${primarySection}): `));
  const group = (await rl.question('Group (optional): ')).trim();
  const data = {
    id: base.slug,
    slug: base.slug,
    type: base.type,
    status: base.status,
    visibility: 'draft',
    publishedAt: today,
    homepageEligible: true,
    title: base.title,
    summary: base.summary,
    primarySection,
    appearsIn: appearsIn.length ? appearsIn : [primarySection],
    ...(group ? { group } : {}),
    tags: base.tags,
    media: {
      src: `/media/work/${base.slug}/thumbnail.png`,
      alt: `${base.title} screenshot`,
      role: 'project-screenshot',
    },
    links: [],
    featured: false,
    sortRank: 999,
    needsCopyReview: true,
    needsMediaReview: true,
    needsLinkReview: true,
    editorialNotes: 'New draft created from generator.',
  };
  const filePath = writeContentFile('work', base.slug, data, 'Longer work/project description.');
  const mediaPath = ensureMediaFolder('work', base.slug);
  console.log(`Created ${filePath}`);
  console.log(`Created ${mediaPath}`);
  console.log('Next: add media, update links, run npm run content:validate, then npm run build.');
} finally {
  rl.close();
}
