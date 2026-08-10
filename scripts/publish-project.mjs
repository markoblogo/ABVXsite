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
  if (!args.packet) throw new Error('Usage: node scripts/publish-project.mjs --packet <path> [--dry-run|--write]');
  if (!args.dryRun && !args.write) args.dryRun = true;
  return args;
}

function loadPacket(packetPath) {
  return JSON.parse(readFileSync(packetPath, 'utf8'));
}

function filePathFor(slug) {
  return path.join(process.cwd(), 'content', 'work', `${slug}.md`);
}

function bodyFrom(packet) {
  return packet.payload.body_lines.join('\n\n');
}

function frontmatterFrom(packet) {
  return {
    id: packet.slug,
    slug: packet.slug,
    title: packet.title,
    type: 'research',
    primarySection: 'systems',
    appearsIn: ['systems'],
    status: 'live',
    visibility: 'public',
    summary: packet.enrichment.meta_description,
    description: packet.payload.excerpt,
    tags: packet.enrichment.tags,
    links: [],
    featured: false,
    sortRank: 500,
    needsReview: false,
    homepageEligible: false,
    publishedAt: packet.enrichment.date_published,
    updatedAt: packet.enrichment.date_modified,
    media: packet.payload.cover_image
      ? { src: packet.payload.cover_image, alt: packet.payload.image_alt || `${packet.title} cover` }
      : undefined,
  };
}

const args = parseArgs(process.argv);
const packet = loadPacket(args.packet);
const targetFile = filePathFor(packet.slug);
const exists = existsSync(targetFile);
const report = {
  operation: 'abvx.publish-project',
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
  throw new Error(`Refusing to overwrite existing work item: ${targetFile}`);
}

mkdirSync(path.dirname(targetFile), { recursive: true });
writeFileSync(targetFile, serializeFrontmatter(frontmatterFrom(packet), bodyFrom(packet)));
console.log(JSON.stringify({ ...report, written: true }, null, 2));
