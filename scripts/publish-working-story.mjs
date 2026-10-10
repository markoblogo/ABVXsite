import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseMarkdownSource } from '../src/content/markdown-source.mjs';
import { readWorkingStories, validateWorkingStory, workingStoryPath } from '../src/content/working-stories-lib.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (message) => { throw new Error(message); };

function safeTarget(root, relative) {
  const absolute = path.join(root, relative);
  // Existing symlink parents must not redirect writes outside this checkout.
  let current = root;
  if (lstatSync(root).isSymbolicLink()) fail('Checkout root must not be a symlink');
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) fail(`Symlink target refused: ${relative}`);
  }
  return absolute;
}

export function planWorkingStory(packet, root = process.cwd()) {
  root = path.resolve(root);
  if (packet.schema_version !== 'v1' || packet.mode !== 'REPORT_ONLY_HANDOFF'
    || packet.project !== 'abvxsite' || packet.surface !== 'working-stories' || packet.kind !== 'working-story'
    || packet.consumer_operation?.id !== 'abvx.publish-working-story'
    || packet.consumer_operation?.target_surface !== 'abvx.working-story') fail('Wrong Working Story packet contract');
  const source = packet.payload?.source_markdown;
  if (typeof source !== 'string' || hash(source) !== packet.payload.source_sha256) fail('Approved source hash mismatch');
  const { data, body } = parseMarkdownSource(source, 'packet source');
  const errors = validateWorkingStory(data, body);
  if (errors.length) fail(errors.join('; '));
  if (data.title !== packet.title || data.slug !== packet.slug || data.date !== packet.payload.date_published
    || (data.language || 'en') !== packet.payload.language
    || body !== packet.payload.body_lines?.join('\n\n')) fail('Packet metadata/body conflicts with approved source');
  if (data.visibility !== 'public' || data.date > new Date().toISOString().slice(0, 10)) fail('Only ready public stories dated on/before today may be published');
  const stories = readWorkingStories(path.join(root, 'content/working-stories'));
  if (stories.some(story => story.story_id === data.story_id || story.slug === data.slug)) fail('Story ID or slug already exists');
  const targetFile = safeTarget(root, `content/working-stories/${data.story_id}-${data.slug}.md`);
  if (existsSync(targetFile)) fail('Story file already exists');
  const referenced = new Set([data.coverImage, ...(data.illustrations || [])].filter(Boolean).map(image => image.src));
  const media = [];
  const targets = new Set();
  for (const asset of packet.payload.media_assets || []) {
    if (!referenced.has(asset.target) || targets.has(asset.target)) fail('Unreferenced or duplicate media destination');
    if (!path.isAbsolute(asset.source)) fail('Media source must be an absolute local path');
    const bytes = readFileSync(asset.source);
    if (hash(bytes) !== asset.sha256) fail('Approved media hash mismatch');
    const image = bytes.subarray(0, 12);
    const recognized = asset.target.endsWith('.png') ? image.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : /\.jpe?g$/.test(asset.target) ? image[0] === 255 && image[1] === 216 && image[2] === 255
      : image.subarray(0, 4).toString() === 'RIFF' && image.subarray(8, 12).toString() === 'WEBP';
    if (!recognized) fail('Media bytes do not match the declared image type');
    const target = safeTarget(root, `public${asset.target}`);
    if (existsSync(target) && !readFileSync(target).equals(bytes)) fail('Media destination contains different bytes');
    media.push({ target, bytes, reused: existsSync(target) });
    targets.add(asset.target);
  }
  for (const src of referenced) {
    if (!targets.has(src)) fail(`Missing approved media: ${src}`);
  }
  return { source, targetFile, media, report: {
    operation: 'abvx.publish-working-story', slug: data.slug, storyId: data.story_id,
    canonicalPath: workingStoryPath(data), targetFile, sourceSha256: packet.payload.source_sha256,
    media: media.map(({ target, reused }) => ({ target, reused })),
    next: 'npm run content:release-check; review generated indexes and use the existing PR/release flow',
  } };
}

export function applyWorkingStory(plan) {
  const created = [];
  try {
    for (const asset of plan.media.filter(asset => !asset.reused)) {
      mkdirSync(path.dirname(asset.target), { recursive: true });
      writeFileSync(asset.target, asset.bytes, { flag: 'wx' });
      created.push(asset.target);
    }
    mkdirSync(path.dirname(plan.targetFile), { recursive: true });
    writeFileSync(plan.targetFile, plan.source, { flag: 'wx' });
    created.push(plan.targetFile);
  } catch (error) {
    for (const file of created.reverse()) unlinkSync(file);
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length !== 3 || args[0] !== '--packet' || !['--write', '--dry-run'].includes(args[2])) {
    fail('Usage: node scripts/publish-working-story.mjs --packet <path> --dry-run|--write');
  }
  const plan = planWorkingStory(JSON.parse(readFileSync(args[1], 'utf8')));
  if (args[2] === '--write') applyWorkingStory(plan);
  console.log(JSON.stringify({ ...plan.report, mode: args[2] === '--write' ? 'WRITE' : 'DRY_RUN' }, null, 2));
}
