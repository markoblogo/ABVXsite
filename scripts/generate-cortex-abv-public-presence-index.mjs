import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentFiles, parseContentFile } from './content-lib.mjs';
import { buildPublicPresenceIndex, parseRssItems } from './cortex-abv-public-presence-lib.mjs';

const root = process.cwd();
const configPath = path.join(root, 'cortex-abv', 'public-presence-sources.v1.json');
const outputPath = process.argv.includes('--output') ? process.argv[process.argv.indexOf('--output') + 1] : path.join(root, 'cortex-abv', 'public-presence-index.v1.json');
const withoutFeedItems = process.argv.includes('--without-feed-items');

function readPublicContent() {
  return ['work', 'books', 'series'].flatMap((folder) => contentFiles(folder).map((filePath) => ({ folder, filePath: path.relative(root, filePath), ...parseContentFile(filePath) })));
}

async function fetchFeedItems(feed) {
  if (withoutFeedItems) return [];
  try {
    const response = await fetch(feed.feedUrl, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'CortexABV-Public-Presence-Index/1.0' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseRssItems(await response.text());
  } catch (error) {
    const empty = [];
    empty.status = `unavailable:${error.message}`;
    return empty;
  }
}

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const feedEntries = await Promise.all(config.writingFeeds.map(async (feed) => [feed.id, await fetchFeedItems(feed)]));
const index = buildPublicPresenceIndex({
  config,
  contentItems: readPublicContent(),
  feedItemsBySource: Object.fromEntries(feedEntries),
  generatedAt: new Date().toISOString(),
});
writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`);
console.log(`Generated ${path.relative(root, outputPath)} with ${index.entities.length} public entities and ${index.relations.length} relations.`);
