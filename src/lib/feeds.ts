import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export type FeedItem = {
  source: 'medium' | 'substack' | 'mn7r';
  title: string;
  url: string;
  publishedAt: string; // ISO
  author?: string;
  tags?: string[];
  excerpt?: string;
  coverImage?: string;
};

const FEED_REVALIDATE_SECONDS = 900;
const IMAGE_FETCH_TIMEOUT_MS = 4500;

const sourceFallbackCover: Record<FeedItem['source'], string> = {
  medium: '/og/abvx-home.png',
  substack: '/og/abvx-home.png',
  mn7r: '/media/work/mn7r/hero.png',
};

const lastValidCoverBySource = new Map<FeedItem['source'], string>();

type CachedFeedImage = {
  source: FeedItem['source'];
  articleUrl: string;
  imageUrl: string;
  title?: string;
  updatedAt: string;
};

type FeedImageCache = {
  version: 1;
  updatedAt: string;
  sources: Partial<Record<FeedItem['source'], CachedFeedImage>>;
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
      if (entry?.imageUrl) lastValidCoverBySource.set(source as FeedItem['source'], entry.imageUrl);
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

function articleCacheKey(source: FeedItem['source'], articleUrl: string): string {
  try {
    const url = new URL(articleUrl);
    url.hash = '';
    return `${source}:${url.toString()}`;
  } catch {
    return `${source}:${articleUrl}`;
  }
}

function cachedCoverFor(item: FeedItem): string | undefined {
  const cache = feedImageCache();
  return cache.articles[articleCacheKey(item.source, item.url)]?.imageUrl || cache.sources[item.source]?.imageUrl;
}

function rememberValidCover(item: FeedItem, imageUrl: string) {
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

function safeHttpUrl(value: string | undefined, baseUrl?: string): string | null {
  if (!value) return null;
  const decoded = decodeHtmlEntities(decodeCdata(value.trim()));
  if (!decoded) return null;
  if (decoded.startsWith('/')) return decoded;

  try {
    const url = new URL(decoded, baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  return values.filter((value): value is string => {
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function withCoverFallback(item: FeedItem): FeedItem {
  const coverImage =
    safeHttpUrl(item.coverImage, item.url) ||
    cachedCoverFor(item) ||
    lastValidCoverBySource.get(item.source) ||
    sourceFallbackCover[item.source];
  if (coverImage) lastValidCoverBySource.set(item.source, coverImage);
  return { ...item, coverImage };
}

function stripHtml(html: string): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return decodeHtmlEntities(text);
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function decodeCdata(s: string): string {
  return s.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');
}

function getTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1] : null;
}

function getTags(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

function getTagAttribute(xml: string, tag: string, attribute: string): string | null {
  const re = new RegExp(`<${tag}[^>]*\\s${attribute}=["']([^"']+)["'][^>]*>`, 'i');
  const m = xml.match(re);
  return m ? m[1] : null;
}

function getTagAttributes(xml: string, tag: string, attribute: string): string[] {
  const re = new RegExp(`<${tag}[^>]*\\s${attribute}=["']([^"']+)["'][^>]*>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

function extractImgSources(html: string): string[] {
  const re = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

function extractMetaImage(html: string, baseUrl: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i,
  ];

  const match = patterns.map((pattern) => html.match(pattern)?.[1]).find(Boolean);
  if (!match) return null;

  try {
    return new URL(match, baseUrl).toString();
  } catch {
    return match;
  }
}

function deriveMn7rArticleImageCandidates(url: string): string[] {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'mn7r.com' || !parsed.pathname.startsWith('/blog/')) return [];
    const pathname = parsed.pathname.replace(/\/$/, '');
    if (/\.(?:avif|webp|png|jpe?g)$/i.test(pathname)) return [];
    return ['png', 'jpg', 'webp', 'avif'].map((extension) => `${parsed.origin}${pathname}.${extension}`);
  } catch {
    return [];
  }
}

function extractMediumSnippet(html: string): string | null {
  const m = html.match(/<p[^>]*class=["'][^"']*medium-feed-snippet[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
  return m ? stripHtml(m[1]) : null;
}

async function fetchArticleMetaImage(url: string): Promise<string | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
    const res = await fetch(url, { next: { revalidate: FEED_REVALIDATE_SECONDS }, signal: controller.signal });
    if (!res.ok) return null;
    const html = await res.text();
    return extractMetaImage(html, url);
  } catch {
    return null;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function imageUrlIfValid(url: string | undefined): Promise<string | null> {
  const candidate = safeHttpUrl(url);
  if (!candidate) return null;
  if (candidate.startsWith('/')) return candidate;

  const fetchWithTimeout = async (method: 'HEAD' | 'GET') => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
    try {
      return await fetch(candidate, {
        method,
        headers: method === 'GET' ? { Range: 'bytes=0-2048' } : undefined,
        next: { revalidate: FEED_REVALIDATE_SECONDS },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    let res = await fetchWithTimeout('HEAD');
    if (!res.ok || res.status === 405) res = await fetchWithTimeout('GET');
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    return contentType.toLowerCase().startsWith('image/') ? candidate : null;
  } catch {
    return null;
  }
}

async function firstValidImageUrl(candidates: Array<string | null | undefined>): Promise<string | null> {
  for (const candidate of candidates) {
    const imageUrl = await imageUrlIfValid(candidate || undefined);
    if (imageUrl) return imageUrl;
  }
  return null;
}

async function resolveArticleImage(item: FeedItem): Promise<string | null> {
  const metaImage = await fetchArticleMetaImage(item.url);
  const mn7rCandidates = item.source === 'mn7r' ? deriveMn7rArticleImageCandidates(item.url) : [];
  const image = await firstValidImageUrl([
    item.coverImage,
    metaImage,
    ...mn7rCandidates,
    cachedCoverFor(item),
    lastValidCoverBySource.get(item.source),
    sourceFallbackCover[item.source],
  ]);
  if (image) rememberValidCover(item, image);
  return image;
}

async function resolveFeedImages(items: FeedItem[], limit: number): Promise<FeedItem[]> {
  const withImages = await Promise.all(
    items.map(async (item, index) => {
      if (index >= limit) return item;
      const coverImage = await resolveArticleImage(item);
      return coverImage ? { ...item, coverImage } : item;
    }),
  );
  return withImages.map(withCoverFallback);
}

async function parseRssFeed(
  feedUrl: string,
  source: FeedItem['source'],
  options: { resolveArticleImages?: boolean; articleImageLimit?: number } = {},
): Promise<FeedItem[]> {
  const res = await fetch(feedUrl, { next: { revalidate: 900 } });
  const xml = await res.text();
  const items = xml.split(/<item>/i).slice(1).map((chunk) => chunk.split(/<\/item>/i)[0]);

  const parsed = items
    .map((it) => {
      const title = decodeCdata(getTag(it, 'title') || '').trim();
      const link = decodeHtmlEntities(decodeCdata(getTag(it, 'link') || '').trim());
      const pubDate = (getTag(it, 'pubDate') || getTag(it, 'published') || '').trim();
      const creator = decodeCdata(getTag(it, 'dc:creator') || '').trim();
      const cats = getTags(it, 'category').map((c) => decodeCdata(c).trim()).filter(Boolean);
      const content = getTag(it, 'content:encoded') || '';
      const description = getTag(it, 'description') || '';
      const contentHtml = decodeCdata(content);
      const descriptionHtml = decodeCdata(description);
      const cover = uniqueStrings([
        ...extractImgSources(contentHtml),
        ...extractImgSources(descriptionHtml),
        getTagAttribute(it, 'media:content', 'url'),
        getTagAttribute(it, 'media:thumbnail', 'url'),
        getTagAttribute(it, 'itunes:image', 'href'),
        ...getTagAttributes(it, 'enclosure', 'url'),
      ])
        .map((candidate) => safeHttpUrl(candidate, link))
        .find(Boolean);
      const excerpt = stripHtml(contentHtml || descriptionHtml).slice(0, 220);

      const dt = pubDate ? new Date(pubDate) : null;
      const publishedAt = dt && !Number.isNaN(dt.valueOf()) ? dt.toISOString() : new Date().toISOString();

      if (!title || !link) return null;

      return {
        source,
        title,
        url: link,
        publishedAt,
        author: creator || undefined,
        tags: cats.length ? cats : undefined,
        excerpt: excerpt || undefined,
        coverImage: cover || undefined,
      } satisfies FeedItem;
    })
    .filter(Boolean) as FeedItem[];

  if (!options.resolveArticleImages) return parsed.map(withCoverFallback);

  const limit = options.articleImageLimit ?? parsed.length;
  return resolveFeedImages(parsed, limit);
}

export async function fetchMediumFeed(feedUrl: string): Promise<FeedItem[]> {
  const res = await fetch(feedUrl, {
    // cache on server, refresh periodically
    next: { revalidate: FEED_REVALIDATE_SECONDS },
  });
  const xml = await res.text();
  const items = xml.split(/<item>/i).slice(1).map((chunk) => chunk.split(/<\/item>/i)[0]);

  const parsed = items
    .map((it) => {
      const title = decodeCdata(getTag(it, 'title') || '').trim();
      const link = (getTag(it, 'link') || '').trim();
      const pubDate = (getTag(it, 'pubDate') || '').trim();
      const creator = decodeCdata(getTag(it, 'dc:creator') || '').trim();
      const cats = getTags(it, 'category').map((c) => decodeCdata(c).trim()).filter(Boolean);

      const content = getTag(it, 'content:encoded') || '';
      const description = getTag(it, 'description') || '';
      const contentHtml = decodeCdata(content);
      const descriptionHtml = decodeCdata(description);
      const cover = uniqueStrings([...extractImgSources(contentHtml), ...extractImgSources(descriptionHtml)])
        .map((candidate) => safeHttpUrl(candidate, link))
        .find(Boolean);
      const excerpt = (extractMediumSnippet(descriptionHtml) || stripHtml(contentHtml || descriptionHtml)).slice(0, 220);

      const dt = pubDate ? new Date(pubDate) : null;
      const publishedAt = dt && !Number.isNaN(dt.valueOf()) ? dt.toISOString() : new Date().toISOString();

      if (!title || !link) return null;

      return {
        source: 'medium' as const,
        title,
        url: link,
        publishedAt,
        author: creator || undefined,
        tags: cats.length ? cats : undefined,
        excerpt: excerpt || undefined,
        coverImage: cover || undefined,
      } satisfies FeedItem;
    })
    .filter(Boolean) as FeedItem[];

  return resolveFeedImages(parsed, 3);
}

export async function fetchSubstackFeed(feedUrl: string): Promise<FeedItem[]> {
  // same RSS parsing approach; Substack feed is standard RSS.
  const res = await fetch(feedUrl, { next: { revalidate: FEED_REVALIDATE_SECONDS } });
  const xml = await res.text();
  const items = xml.split(/<item>/i).slice(1).map((chunk) => chunk.split(/<\/item>/i)[0]);

  const parsed = items
    .map((it) => {
      const title = decodeCdata(getTag(it, 'title') || '').trim();
      const link = (getTag(it, 'link') || '').trim();
      const pubDate = (getTag(it, 'pubDate') || '').trim();
      const content = getTag(it, 'content:encoded') || getTag(it, 'description') || '';
      const contentHtml = decodeCdata(content);
      const cover = uniqueStrings([
        ...extractImgSources(contentHtml),
        getTagAttribute(it, 'media:content', 'url'),
        getTagAttribute(it, 'media:thumbnail', 'url'),
        getTagAttribute(it, 'itunes:image', 'href'),
        ...getTagAttributes(it, 'enclosure', 'url'),
      ])
        .map((candidate) => safeHttpUrl(candidate, link))
        .find(Boolean);
      const excerpt = stripHtml(contentHtml).slice(0, 220);

      const dt = pubDate ? new Date(pubDate) : null;
      const publishedAt = dt && !Number.isNaN(dt.valueOf()) ? dt.toISOString() : new Date().toISOString();

      if (!title || !link) return null;

      return {
        source: 'substack' as const,
        title,
        url: link,
        publishedAt,
        excerpt: excerpt || undefined,
        coverImage: cover || undefined,
      } satisfies FeedItem;
    })
    .filter(Boolean) as FeedItem[];

  return resolveFeedImages(parsed, 3);
}

export async function fetchMn7rFeed(feedUrl: string): Promise<FeedItem[]> {
  return parseRssFeed(feedUrl, 'mn7r', { resolveArticleImages: true, articleImageLimit: 5 });
}

export function mergeFeeds(...lists: FeedItem[][]): FeedItem[] {
  const merged = lists.flat();
  merged.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  return merged;
}
