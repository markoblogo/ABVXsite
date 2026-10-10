import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { contentFiles, parseContentFile } from './content-lib.mjs';
import { readWorkingStories, workingStoryPath } from '../src/content/working-stories-lib.mjs';
import { registerWritingItems, validateWritingDiscovery } from '../src/lib/writing-chronology.mjs';
import { loadFeedModule } from './load-feed-modules.mjs';

export function nativeDiscoveryItems(now = Date.now()) {
  const writing = contentFiles('writing').flatMap(file => {
    const { data } = parseContentFile(file);
    if (data.visibility !== 'public' || data.status !== 'live' || !data.publishedAt || Date.parse(data.publishedAt) > now) return [];
    return [{ source: data.videoUrl ? 'youtube' : 'abvx', title: data.title, url: `/writing/${data.slug}`,
      publishedAt: data.videoUploadedAt || data.publishedAt, excerpt: data.summary,
      coverImage: data.media?.src || data.heroImage?.src, videoUrl: data.videoUrl }];
  });
  const stories = readWorkingStories().filter(story => story.visibility === 'public' && Date.parse(story.date) <= now)
    .map(story => ({ source: 'abvx', title: story.title, url: workingStoryPath(story),
      publishedAt: story.date, excerpt: story.summary, coverImage: story.coverImage?.src }));
  return [...writing, ...stories];
}

export async function syncWritingFeed({ external = false, bootstrap = false } = {}) {
  const file = path.resolve('content/writing-discovery.json');
  const registry = JSON.parse(readFileSync(file, 'utf8'));
  const now = new Date().toISOString();
  const items = nativeDiscoveryItems(Date.parse(now));
  if (external) {
    const { fetchMediumFeed, fetchSubstackFeed } = loadFeedModule(path.resolve('src/lib/feeds.ts'));
    const { fetchYoutubeFeed } = loadFeedModule(path.resolve('src/lib/youtube-feed.ts'));
    const youtube = JSON.parse(readFileSync('content/youtube.json', 'utf8'));
    const responses = await Promise.allSettled([
      fetchMediumFeed('https://abvcreative.medium.com/feed'),
      fetchSubstackFeed('https://abvx.substack.com/feed'),
      fetchYoutubeFeed(youtube.feedUrl, youtube),
    ]);
    for (const [index, result] of responses.entries()) {
      if (result.status === 'fulfilled' && result.value.length) items.push(...result.value);
      else console.warn(`Writing source ${['Medium', 'Substack', 'YouTube'][index]} unavailable/empty; preserving stored posts.`);
    }
  }
  const updated = registerWritingItems(registry, items, { now, bootstrap });
  const errors = validateWritingDiscovery(updated);
  if (errors.length) throw new Error(errors.join('\n'));
  const bytes = JSON.stringify(updated, null, 2) + '\n';
  const changed = readFileSync(file, 'utf8') !== bytes;
  if (changed) writeFileSync(file, bytes);
  console.log(`Writing discovery: ${updated.items.length} records; ${changed ? 'updated' : 'unchanged'}.`);
  return changed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--external', '--bootstrap'].includes(arg))) throw new Error('Unsupported Writing sync option');
  await syncWritingFeed({ external: args.includes('--external'), bootstrap: args.includes('--bootstrap') });
}
