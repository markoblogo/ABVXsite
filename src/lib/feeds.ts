import { fetchAllowedText, isAllowedFeedUrl, safeHttpUrl } from './feed-http';
import { applyFeedImageFallbacks, resolveFeedImages } from './feed-image-resolver';
import {
  decodeCdata,
  decodeHtmlEntities,
  extractImgSources,
  extractMediumSnippet,
  getTag,
  getTagAttribute,
  getTagAttributes,
  getTags,
  stripHtml,
  uniqueStrings,
} from './feed-text';
import type { FeedItem, FeedSource } from './feed-types';

export type { FeedItem } from './feed-types';

type ParseOptions = {
  resolveArticleImages?: boolean;
  articleImageLimit?: number;
  mediumSnippet?: boolean;
};

function itemChunks(xml: string): string[] {
  return xml.split(/<item>/i).slice(1).map((chunk) => chunk.split(/<\/item>/i)[0]);
}

function isoDate(value: string): string {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.valueOf()) ? date.toISOString() : new Date().toISOString();
}

function rssImages(xml: string, htmlBlocks: string[], baseUrl: string, source: FeedSource): string | undefined {
  const image = uniqueStrings([
    ...htmlBlocks.flatMap(extractImgSources),
    getTagAttribute(xml, 'media:content', 'url'),
    getTagAttribute(xml, 'media:thumbnail', 'url'),
    getTagAttribute(xml, 'itunes:image', 'href'),
    ...getTagAttributes(xml, 'enclosure', 'url'),
  ])
    .map((candidate) => safeHttpUrl(candidate, baseUrl))
    .find((candidate) => Boolean(candidate && (candidate.startsWith('/') || isAllowedFeedUrl(candidate, source, 'image'))));
  return image || undefined;
}

function parseRssItem(xml: string, source: FeedSource, options: ParseOptions): FeedItem | null {
  const title = decodeCdata(getTag(xml, 'title') || '').trim();
  const link = decodeHtmlEntities(decodeCdata(getTag(xml, 'link') || '').trim());
  if (!title || !link) return null;
  if (!isAllowedFeedUrl(link, source, 'article')) return null;

  const pubDate = (getTag(xml, 'pubDate') || getTag(xml, 'published') || '').trim();
  const creator = decodeCdata(getTag(xml, 'dc:creator') || '').trim();
  const categories = getTags(xml, 'category').map((category) => decodeCdata(category).trim()).filter(Boolean);
  const contentHtml = decodeCdata(getTag(xml, 'content:encoded') || '');
  const descriptionHtml = decodeCdata(getTag(xml, 'description') || '');
  const primaryHtml = contentHtml || descriptionHtml;
  const excerpt = (
    options.mediumSnippet ? extractMediumSnippet(descriptionHtml) || stripHtml(primaryHtml) : stripHtml(primaryHtml)
  ).slice(0, 220);

  return {
    source,
    title,
    url: link,
    publishedAt: isoDate(pubDate),
    author: creator || undefined,
    tags: categories.length ? categories : undefined,
    excerpt: excerpt || undefined,
    coverImage: rssImages(xml, [contentHtml, descriptionHtml], link, source),
  };
}

async function parseRssFeed(source: FeedSource, feedUrl: string, options: ParseOptions = {}): Promise<FeedItem[]> {
  const xml = await fetchAllowedText(feedUrl, source, 'feed');
  if (!xml) return [];

  const parsed = itemChunks(xml)
    .map((item) => parseRssItem(item, source, options))
    .filter((item): item is FeedItem => Boolean(item));

  if (!options.resolveArticleImages) return applyFeedImageFallbacks(parsed);
  return resolveFeedImages(parsed, options.articleImageLimit ?? parsed.length);
}

export async function fetchMediumFeed(feedUrl: string): Promise<FeedItem[]> {
  return parseRssFeed('medium', feedUrl, {
    resolveArticleImages: true,
    articleImageLimit: 3,
    mediumSnippet: true,
  });
}

export async function fetchSubstackFeed(feedUrl: string): Promise<FeedItem[]> {
  return parseRssFeed('substack', feedUrl, {
    resolveArticleImages: true,
    articleImageLimit: 3,
  });
}

export async function fetchMn7rFeed(feedUrl: string): Promise<FeedItem[]> {
  return parseRssFeed('mn7r', feedUrl, {
    resolveArticleImages: true,
    articleImageLimit: 5,
  });
}

export function mergeFeeds(...lists: FeedItem[][]): FeedItem[] {
  const merged = lists.flat();
  merged.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  return merged;
}
