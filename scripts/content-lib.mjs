import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export const contentRoot = path.join(process.cwd(), 'content');
export const mediaRoot = path.join(process.cwd(), 'public', 'media');

export const validVisibility = new Set(['public', 'draft', 'private']);
export const validStatus = new Set(['live', 'released', 'building', 'research', 'archive']);
export const validSections = new Set(['focus', 'systems', 'books', 'writing']);
export const validMediaRoles = new Set([
  'book-cover',
  'project-screenshot',
  'landing-screenshot',
  'mockup',
  'rss-image',
  'video-thumbnail',
  'generic-thumbnail',
]);
export const validLinkTypes = new Set([
  'site',
  'github',
  'demo',
  'youtube',
  'amazon',
  'kindle',
  'paperback',
  'pdf',
  'series',
  'bluesky',
  'x',
  'linkedin',
  'telegram',
  'discord',
  'youtube-channel',
  'medium',
  'substack',
  'deck',
  'other',
]);

export function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function parseList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeFrontmatter(data, body = '') {
  return `---\n${JSON.stringify(data, null, 2)}\n---\n\n${body.trim()}\n`;
}

export function parseContentFile(filePath) {
  const source = readFileSync(filePath, 'utf8');
  if (!source.startsWith('---')) {
    throw new Error(`${filePath}: missing frontmatter`);
  }
  const end = source.indexOf('\n---', 3);
  if (end === -1) {
    throw new Error(`${filePath}: unterminated frontmatter`);
  }
  const raw = source.slice(3, end).trim();
  const body = source.slice(end + 4).replace(/^\s*\n/, '').trim();
  return { data: JSON.parse(raw), body };
}

export function contentFiles(folder) {
  const dir = path.join(contentRoot, folder);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
    .map((file) => path.join(dir, file));
}

export function writeContentFile(folder, slug, data, body = '') {
  const dir = path.join(contentRoot, folder);
  mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${slug}.md`);
  writeFileSync(filePath, serializeFrontmatter(data, body));
  return filePath;
}

export function ensureMediaFolder(folder, slug) {
  const dir = path.join(mediaRoot, folder, slug);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export async function promptForBase(kind) {
  const rl = readline.createInterface({ input, output });
  try {
    const title = (await rl.question('Title: ')).trim();
    if (!title) throw new Error('Title is required.');
    const suggestedSlug = slugify(title);
    const slug = (await rl.question(`Slug (${suggestedSlug}): `)).trim() || suggestedSlug;
    const summary = (await rl.question('Summary: ')).trim();
    if (!summary) throw new Error('Summary is required.');
    const type = (await rl.question(`Type (${kind}): `)).trim() || kind;
    const status = (await rl.question('Status [live/released/building/research/archive] (building): ')).trim() || 'building';
    const tags = parseList(await rl.question('Tags (comma-separated): '));
    return { title, slug, summary, type, status, tags };
  } finally {
    rl.close();
  }
}
