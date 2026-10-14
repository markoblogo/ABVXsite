import { validateKitchenNotes } from '../src/content/kitchen-notes.mjs';
import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { serializeFrontmatter } from './content-lib.mjs';
import { createHash } from 'node:crypto';
import { parseMarkdownSource } from '../src/content/markdown-source.mjs';
import { safePublicationTarget, planApprovedMedia, applyPublication } from './publication-media.mjs';
import { validateNativeWritingVideo } from '../src/content/native-writing-video.mjs';
import { staticPublicationRoutes } from './publication-routes.mjs';

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

function bodyFrom(packet) {
  return packet.payload.body_lines.join('\n\n');
}

function frontmatterFrom(packet) {
  return {
    id: packet.slug,
    slug: packet.slug,
    ...(packet.title ? { title: packet.title } : {}),
    ...(packet.enrichment.seo_title ? { seoTitle: packet.enrichment.seo_title } : {}),
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

export function planWriting(packet, root = process.cwd()) {
  root = path.resolve(root);
  if(staticPublicationRoutes(root).has('/writing/'+packet.slug)) throw Error('Writing slug is reserved for a static hub');
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
  if (!packet.payload.source_markdown && (packet.payload.cover_image || packet.payload.media_assets?.length || packet.payload.video_url
    || packet.payload.subtitle || packet.payload.external_links?.length)) {
    throw new Error('Unsupported native Writing fields require project-specific review');
  }
  const targetFile = safePublicationTarget(root, `content/writing/${packet.slug}.md`);
  const exists = existsSync(targetFile);
  if (exists) throw new Error(`Refusing to overwrite existing writing item: ${targetFile}`);
  let source = serializeFrontmatter(frontmatterFrom(packet), bodyFrom(packet));
  let media = [];
  if (!packet.payload.source_markdown && packet.kind === 'recipe') throw new Error('Recipes require approved structured source Markdown');
  if (packet.payload.source_markdown) {
    source = packet.payload.source_markdown;
    if (packet.schema_version !== 'v1' || packet.mode !== 'REPORT_ONLY_HANDOFF'
      || createHash('sha256').update(source).digest('hex') !== packet.payload.source_sha256) throw new Error('Approved source hash mismatch');
    const { data, body } = parseMarkdownSource(source, 'packet source');
    if (data.slug !== packet.slug || data.id !== packet.slug || data.title !== packet.title
      || body !== bodyFrom(packet) || data.primarySection !== 'writing' || data.type !== packet.kind
      || (data.language || 'en') !== (packet.payload.language || 'en')
      || data.publishedAt !== packet.payload.date_published) throw new Error('Packet metadata/body conflicts with approved source');
    if (data.visibility !== 'public' || data.status !== 'live'
      || !Number.isFinite(Date.parse(data.publishedAt)) || Date.parse(data.publishedAt) > Date.now()) throw new Error('Only ready public writing dated on/before today may be published');
    const videoErrors = [...validateNativeWritingVideo(data), ...validateKitchenNotes(data, body)];
    if (videoErrors.length) throw new Error(`Invalid YouTube video fields: ${videoErrors.join('; ')}`);
    const referenced = new Set([data.media, data.heroImage].filter(Boolean).map(image => image.src).filter(src => !src.startsWith('https://')));
    for (const image of [data.media, data.heroImage].filter(Boolean)) {
      if (!image.alt || !(image.width > 0) || !(image.height > 0)) throw new Error('Image alt text and dimensions required');
      if (image.src.startsWith('https://') && !(data.videoUrl && image.src === `https://i.ytimg.com/vi/${new URL(data.videoUrl).searchParams.get('v')}/hqdefault.jpg`)) throw new Error('Only the matching YouTube thumbnail may be remote');
    }
    media = planApprovedMedia(referenced, packet.payload.media_assets, root);
  }
  return { targetFile, source, media, report: { operation: 'abvx.publish-writing', targetFile, exists, slug: packet.slug, title: packet.title, validationTier: packet.validation_tier, media: media.map(({ target, reused }) => ({ target, reused })) } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const args = parseArgs(process.argv);
  const plan = planWriting(loadPacket(args.packet));
  if (args.write) applyPublication(plan);
  console.log(JSON.stringify({ ...plan.report, mode: args.write ? 'WRITE' : 'DRY_RUN', ...(args.write ? {written:true} : {}) }, null, 2));
}
