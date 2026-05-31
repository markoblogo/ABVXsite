import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { sourceFallbackCover, type FeedItem, type FeedSource } from './feed-types';

const lastValidCoverBySource = new Map<FeedSource, string>();

type CachedFeedImage = {
  source: FeedSource;
  articleUrl: string;
  imageUrl: string;
  title?: string;
  updatedAt: string;
};

type FeedImageCache = {
  version: 1;
  updatedAt: string;
  sources: Partial<Record<FeedSource, CachedFeedImage>>;
  articles: Record<string, CachedFeedImage>;
};

const emptyFeedImageCache = (): FeedImageCache => ({
  version: 1,
  updatedAt: new Date(0).toISOString(),
  sources: {},
  articles: {},
});

const writableFeedImageCachePath =
  process.env.FEED_IMAGE_CACHE_PATH || path.join(process.cwd(), '.cache', 'feed-image-cache.json');
const seedFeedImageCachePath = path.join(process.cwd(), 'public', 'feed-image-cache.json');

let loadedFeedImageCache: FeedImageCache | undefined;

function readCacheFile(filePath: string): FeedImageCache | undefined {
  if (!existsSync(filePath)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<FeedImageCache>;
    if (parsed.version !== 1 || typeof parsed.articles !== 'object' || typeof parsed.sources !== 'object') return undefined;
    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
      sources: parsed.sources || {},
      articles: parsed.articles || {},
    };
  } catch {
    return undefined;
  }
}

function feedImageCache(): FeedImageCache {
  if (!loadedFeedImageCache) {
    loadedFeedImageCache =
      readCacheFile(writableFeedImageCachePath) ||
      readCacheFile(seedFeedImageCachePath) ||
      emptyFeedImageCache();

    for (const [source, entry] of Object.entries(loadedFeedImageCache.sources)) {
      if (entry?.imageUrl) lastValidCoverBySource.set(source as FeedSource, entry.imageUrl);
    }
  }
  return loadedFeedImageCache;
}

function writeFeedImageCache() {
  const cache = feedImageCache();
  try {
    mkdirSync(path.dirname(writableFeedImageCachePath), { recursive: true });
    const temporaryPath = `${writableFeedImageCachePath}.tmp`;
    writeFileSync(temporaryPath, `${JSON.stringify(cache, null, 2)}\n`);
    renameSync(temporaryPath, writableFeedImageCachePath);
  } catch {
    // Cache writes are best-effort because some production runtimes expose read-only filesystems.
  }
}

function articleCacheKey(source: FeedSource, articleUrl: string): string {
  try {
    const url = new URL(articleUrl);
    url.hash = '';
    return `${source}:${url.toString()}`;
  } catch {
    return `${source}:${articleUrl}`;
  }
}

export function cachedCoverFor(item: FeedItem): string | undefined {
  const cache = feedImageCache();
  return cache.articles[articleCacheKey(item.source, item.url)]?.imageUrl || cache.sources[item.source]?.imageUrl;
}

export function lastValidCoverFor(source: FeedSource): string | undefined {
  feedImageCache();
  return lastValidCoverBySource.get(source);
}

export function rememberValidCover(item: FeedItem, imageUrl: string) {
  if (imageUrl === sourceFallbackCover[item.source]) return;

  const cache = feedImageCache();
  const entry: CachedFeedImage = {
    source: item.source,
    articleUrl: item.url,
    imageUrl,
    title: item.title,
    updatedAt: new Date().toISOString(),
  };
  const key = articleCacheKey(item.source, item.url);
  if (cache.articles[key]?.imageUrl === imageUrl && cache.sources[item.source]?.imageUrl === imageUrl) return;

  cache.articles[key] = entry;
  cache.sources[item.source] = entry;
  cache.updatedAt = entry.updatedAt;
  lastValidCoverBySource.set(item.source, imageUrl);
  writeFeedImageCache();
}

export function rememberSourceCover(source: FeedSource, imageUrl: string) {
  lastValidCoverBySource.set(source, imageUrl);
}
