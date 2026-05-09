import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SITE = 'https://abvx.xyz';
const ROOT = process.cwd();

const records = [
  // ABVX Press / books
  ['book', 'Dark Gestalt: How Brands Hijack Emotions, Distort Perception, and Manufacture Desire', 'dark-gestalt'],
  ['book', 'Future-Proof Your Productivity: Navigating the AI Decade to Accelerate Your Output, Innovate Your Role, and Thrive', 'future-proof'],
  ['book', 'LLMO: The Next SEO Revolution — How to Stay Visible to AI in the Age of Zero Clicks', 'llmo-seo-revolution'],
  ['book', 'Toki Pona and the Machine Mind: Designing cleaner prompts, smaller models, and better systems with the world’s simplest language', 'toki-pona-machine-mind'],
  ['book', 'A Christmas Carol — in Toki Pona: Translated into the minimalist language Toki Pona', 'christmas-carol-toki-pona'],
  ['book', 'Cicero: On Duties (De Officiis) in toki pona', 'cicero-toki-pona'],
  ['book', 'Dao De Jing (Tao Te Ching): Chinese text with Toki Pona in sitelen pona', 'dao-de-jing-toki-pona'],
  ['book', 'Epictetus: The Enchiridion — in toki pona: A Stoic handbook in the world’s simplest language (with sitelen pona)', 'epictetus-enchiridion-toki-pona'],
  ['book', 'Free Kit / Reader’s Guide Chinese Wisdom in toki pona', 'chinese-wisdom-reader-guide'],
  ['book', 'Heart Sūtra in toki pona / sitelen pona', 'heart-sutra-toki-pona'],
  ['book', 'Hryhorii Kosynka: Dans les seigles et autres nouvelles', 'hryhorii-kosynka-dans-les-seigles'],
  ['book', 'Iouri Ianovski: Le Maître du navire', 'iouri-ianovski-le-maitre-du-navire'],
  ['book', 'Maik Johansen: Le Voyage du savant docteur Leonardo (et autres paysages textuels)', 'maik-johansen-le-voyage-du-savant-docteur-leonardo'],
  ['book', 'Meditations of Marcus Aurelius — in Toki Pona: A minimalist Stoic classic, reimagined in the world’s simplest language', 'marcus-aurelius-meditations-toki-pona'],
  ['book', 'Mykola Khvylovy: La zone du sanatorium: Et autres récits de la renaissance fusillée', 'mykola-khvylovy-la-zone-du-sanatorium'],
  ['book', 'Seneca: On the Shortness of Life — in toki pona', 'seneca-shortness-of-life-toki-pona'],
  ['book', 'Sunzi: The Art of War in toki pona', 'sunzi-art-of-war-toki-pona'],
  ['book', 'The Toki Pona Reader’s Kit', 'toki-pona-readers-kit'],
  ['book', 'Valerian Pidmohylny: La Ville: Roman ukrainien', 'valerian-pidmohylny-la-ville'],
  // Press companions and systems artifacts
  ['project', 'Chinese Wisdom in toki pona', 'chinese-wisdom-toki-pona-landing'],
  ['project', 'sitelen-emoji-truth', 'sitelen-emoji-truth'],
  ['project', 'Stoic Wisdom in Toki Pona - landing', 'stoic-wisdom-toki-pona-landing'],
  ['project', 'Toki Pona AI translator', 'toki-pona-ai-translator'],
  ['project', 'Toki Pona free kits landing', 'toki-pona-free-kits-landing'],
  ['project', 'Ukrainian Modernism — Landing', 'ukrainian-modernism-landing'],
  ['project', 'ABVX shortener', 'abvx-shortener'],
  ['project', 'AGENTS.md Generator (agentsgen)', 'agents-md-generator'],
  ['project', 'AsciiTheme', 'ascii-theme'],
  ['project', 'Deck: Cropto brings local market risk tools into modern digital infrastructure.', 'cropto-market-risk-deck'],
  ['project', 'Liqua: builds structured market liquidity for physical commodity trading', 'liqua'],
  ['project', 'Trade Solution EU', 'trade-solution-eu'],
  ['project', 'YTMamp', 'ytmamp'],
  ['project', 'Cropto Monitor: Commodity Signals Terminal', 'cropto-monitor'],
  ['project', 'Cropto — Human-Centred Crypto Clarity', 'cropto'],
  ['project', 'LLMO — The Next SEO Revolution', 'llmo-site'],
];

const pages = ['/abvx-press', '/projects', '/books', '/tech-lab', '/lang-lab', '/cropto'];

function decodeHtml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&#x27;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&rsquo;', '’')
    .replaceAll('&mdash;', '—')
    .replaceAll('&nbsp;', ' ');
}

function stripHtml(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function fetchMedia(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  return {
    bytes,
    contentType: res.headers.get('content-type') || null,
  };
}

async function writeMedia(filePath, media) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, media.bytes);
  return {
    bytes: media.bytes.length,
    sha256: createHash('sha256').update(media.bytes).digest('hex'),
    contentType: media.contentType,
  };
}

function extensionFor(contentType, fallback = 'bin') {
  if (contentType?.includes('image/png')) return 'png';
  if (contentType?.includes('image/jpeg')) return 'jpg';
  if (contentType?.includes('image/webp')) return 'webp';
  if (contentType?.includes('application/pdf')) return 'pdf';
  return fallback;
}

function sourceHash(url) {
  return createHash('sha256').update(url).digest('hex');
}

function mediaEntry(url, payload) {
  return {
    sourceHash: sourceHash(url),
    ...payload,
  };
}

function findCard(html, title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const titleMatch = html.match(new RegExp(`>(\\s*)${escaped}(\\s*)<`));
  if (!titleMatch || titleMatch.index === undefined) return null;
  const titleIndex = titleMatch.index;
  const imgStart = html.lastIndexOf('<img', titleIndex);
  const imgEnd = imgStart >= 0 ? html.indexOf('>', imgStart) : -1;
  const imgTag = imgStart >= 0 && imgEnd >= 0 ? html.slice(imgStart, imgEnd + 1) : '';
  const imageSrc = imgTag.match(/src="([^"]+)"/)?.[1];
  const nextTitle = html.indexOf('text-base font-semibold leading-snug', titleIndex + title.length);
  const chunk = html.slice(titleIndex, nextTitle > titleIndex ? nextTitle : titleIndex + 4000);
  const links = [...chunk.matchAll(/<a[^>]+href="(https?:[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
    .map((match) => ({ label: stripHtml(match[2]), url: decodeHtml(match[1]) }))
    .filter((link) => link.label);
  return { imageSrc: imageSrc ? decodeHtml(imageSrc) : null, links };
}

const htmlByPage = new Map();
for (const page of pages) {
  htmlByPage.set(page, await fetchText(`${SITE}${page}`));
}

const mediaMap = [];
const missing = [];

for (const [kind, title, slug] of records) {
  let card = null;
  let sourcePage = null;
  for (const [page, html] of htmlByPage) {
    card = findCard(html, title);
    if (card?.imageSrc) {
      sourcePage = page;
      break;
    }
  }

  if (!card?.imageSrc) {
    missing.push({ title, slug, reason: 'image not found in public pages' });
    continue;
  }

  const imageUrl = card.imageSrc.startsWith('/') ? `${SITE}${card.imageSrc}` : card.imageSrc;
  const folder = kind === 'book' ? 'books' : 'projects';
  const imageMedia = await fetchMedia(imageUrl);
  const imageExtension = extensionFor(imageMedia.contentType, 'jpg');
  const publicPath = `/media/${folder}/${slug}.${imageExtension}`;
  const localPath = path.join(ROOT, 'public', 'media', folder, `${slug}.${imageExtension}`);
  const result = await writeMedia(localPath, imageMedia);
  mediaMap.push(mediaEntry(imageUrl, { localPath: publicPath, title, slug, sourcePage, ...result }));

  for (const link of card.links.filter((item) => item.label === 'PDF')) {
    const pdfPath = `/media/books/${slug}.pdf`;
    const pdfLocalPath = path.join(ROOT, 'public', 'media', 'books', `${slug}.pdf`);
    const pdfMedia = await fetchMedia(link.url);
    const pdfResult = await writeMedia(pdfLocalPath, pdfMedia);
    mediaMap.push(mediaEntry(link.url, {
      localPath: pdfPath,
      title,
      slug,
      sourcePage,
      ...pdfResult,
    }));
  }
}

await mkdir(path.join(ROOT, 'content-migration'), { recursive: true });
await writeFile(
  path.join(ROOT, 'content-migration', 'media-map.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), mediaMap, missing }, null, 2)}\n`,
);

console.log(`Downloaded ${mediaMap.length} media assets.`);
if (missing.length) {
  console.log(`Missing ${missing.length} images.`);
}
