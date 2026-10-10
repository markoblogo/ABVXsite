import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { serializeFrontmatter } from './content-lib.mjs';

function parseArgs(argv) {
  const args = { packet: '', dryRun: false, write: false };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--packet') args.packet = argv[++index] || '';
    else if (token === '--dry-run') args.dryRun = true;
    else if (token === '--write') args.write = true;
  }
  if (!args.packet) throw new Error('Usage: node scripts/publish-writing.mjs --packet <path> [--dry-run|--write]');
  if (args.dryRun && args.write) throw new Error('Choose dry-run or write, not both');
  if (!args.dryRun && !args.write) args.dryRun = true;
  return args;
}

function loadPacket(packetPath) {
  return JSON.parse(readFileSync(packetPath, 'utf8'));
}

function filePathFor(slug) {
  return path.join(process.cwd(), 'content', 'writing', `${slug}.md`);
}

function bodyFrom(packet) {
  return packet.payload.body_lines.join('\n\n');
}

function frontmatterFrom(packet) {
  return {
    id: packet.slug,
    slug: packet.slug,
    ...(packet.title ? { title: packet.title } : {}),
    type: packet.kind || 'note',
    primarySection: 'writing',
    appearsIn: ['writing'],
    status: 'live',
    visibility: 'public',
    summary: packet.enrichment.meta_description,
    tags: packet.enrichment.tags,
    links: [],
    featured: false,
    sortRank: 500,
    needsReview: false,
    homepageEligible: false,
    publishedAt: packet.enrichment.date_published,
    updatedAt: packet.enrichment.date_modified,
    language: packet.payload.language || 'en',
    ...(packet.payload.cover_image
      ? { media: { src: packet.payload.cover_image, alt: packet.payload.image_alt || `${packet.title} cover` } }
      : {}),
  };
}

const args = parseArgs(process.argv);
const packet = loadPacket(args.packet);
if (packet.project !== 'abvxsite' || packet.surface !== 'writing'
  || packet.consumer_operation?.id !== 'abvx.publish-writing'
  || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(packet.slug || '')) {
  throw new Error('Invalid native Writing packet target or slug');
}
if (!packet.title || !Array.isArray(packet.payload?.body_lines) || !packet.payload.body_lines.length
  || !packet.payload.body_lines.every(line => typeof line === 'string' && line.trim())
  || !packet.enrichment?.meta_description || !Array.isArray(packet.enrichment.tags)
  || !['en', 'fr', 'uk'].includes(packet.payload.language || 'en')) {
  throw new Error('Invalid native Writing text, metadata or language');
}
if (packet.payload.source_markdown || packet.payload.media_assets?.length || packet.payload.video_url
  || packet.payload.subtitle || packet.payload.external_links?.length) {
  throw new Error('Unsupported native Writing fields require project-specific review');
}
const targetFile = filePathFor(packet.slug);
const exists = existsSync(targetFile);
if (exists) throw new Error(`Refusing to overwrite existing writing item: ${targetFile}`);
const report = {
  operation: 'abvx.publish-writing',
  mode: args.write ? 'WRITE' : 'DRY_RUN',
  targetFile,
  exists,
  slug: packet.slug,
  title: packet.title,
  validationTier: packet.validation_tier,
};

if (args.dryRun) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

if (exists) {
  throw new Error(`Refusing to overwrite existing writing item: ${targetFile}`);
}

mkdirSync(path.dirname(targetFile), { recursive: true });
writeFileSync(targetFile, serializeFrontmatter(frontmatterFrom(packet), bodyFrom(packet)), { flag: 'wx' });
console.log(JSON.stringify({ ...report, written: true }, null, 2));
