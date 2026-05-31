import { cachedCoverFor, lastValidCoverFor, rememberSourceCover, rememberValidCover } from './feed-image-cache';
import { fetchAllowedText, imageUrlIfValid, safeHttpUrl } from './feed-http';
import { extractMetaImage } from './feed-text';
import { sourceFallbackCover, type FeedItem } from './feed-types';

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

function withCoverFallback(item: FeedItem): FeedItem {
  const coverImage =
    safeHttpUrl(item.coverImage, item.url) ||
    cachedCoverFor(item) ||
    lastValidCoverFor(item.source) ||
    sourceFallbackCover[item.source];
  if (coverImage) rememberSourceCover(item.source, coverImage);
  return { ...item, coverImage };
}

async function fetchArticleMetaImage(item: FeedItem): Promise<string | null> {
  const html = await fetchAllowedText(item.url, item.source, 'article');
  return html ? extractMetaImage(html, item.url) : null;
}

async function firstValidImageUrl(item: FeedItem, candidates: Array<string | null | undefined>): Promise<string | null> {
  for (const candidate of candidates) {
    const imageUrl = await imageUrlIfValid(candidate || undefined, item.source);
    if (imageUrl) return imageUrl;
  }
  return null;
}

async function resolveArticleImage(item: FeedItem): Promise<string | null> {
  const metaImage = await fetchArticleMetaImage(item);
  const mn7rCandidates = item.source === 'mn7r' ? deriveMn7rArticleImageCandidates(item.url) : [];
  const image = await firstValidImageUrl(item, [
    item.coverImage,
    metaImage,
    ...mn7rCandidates,
    cachedCoverFor(item),
    lastValidCoverFor(item.source),
    sourceFallbackCover[item.source],
  ]);
  if (image) rememberValidCover(item, image);
  return image;
}

export async function resolveFeedImages(items: FeedItem[], limit: number): Promise<FeedItem[]> {
  const withImages = await Promise.all(
    items.map(async (item, index) => {
      if (index >= limit) return item;
      const coverImage = await resolveArticleImage(item);
      return coverImage ? { ...item, coverImage } : item;
    }),
  );
  return withImages.map(withCoverFallback);
}

export function applyFeedImageFallbacks(items: FeedItem[]): FeedItem[] {
  return items.map(withCoverFallback);
}
