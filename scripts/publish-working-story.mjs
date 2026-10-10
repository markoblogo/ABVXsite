import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseMarkdownSource } from '../src/content/markdown-source.mjs';
import { readWorkingStories, validateWorkingStory, workingStoryPath } from '../src/content/working-stories-lib.mjs';

import { safePublicationTarget as safeTarget, planApprovedMedia, applyPublication } from './publication-media.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (message) => { throw new Error(message); };

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
  const media = planApprovedMedia(referenced, packet.payload.media_assets, root);
  return { source, targetFile, media, report: {
    operation: 'abvx.publish-working-story', slug: data.slug, storyId: data.story_id,
    canonicalPath: workingStoryPath(data), targetFile, sourceSha256: packet.payload.source_sha256,
    media: media.map(({ target, reused }) => ({ target, reused })),
    next: 'npm run content:release-check; review generated indexes and use the existing PR/release flow',
  } };
}

export const applyWorkingStory = applyPublication;

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length !== 3 || args[0] !== '--packet' || !['--write', '--dry-run'].includes(args[2])) {
    fail('Usage: node scripts/publish-working-story.mjs --packet <path> --dry-run|--write');
  }
  const plan = planWorkingStory(JSON.parse(readFileSync(args[1], 'utf8')));
  if (args[2] === '--write') applyWorkingStory(plan);
  console.log(JSON.stringify({ ...plan.report, mode: args[2] === '--write' ? 'WRITE' : 'DRY_RUN' }, null, 2));
}
