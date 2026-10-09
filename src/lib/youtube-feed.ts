import { fetchAllowedText } from './feed-http';
import { decodeCdata, decodeHtmlEntities, getTag, getTagAttribute, stripHtml } from './feed-text';
import type { FeedItem } from './feed-types';

export type YoutubeFeedSettings = {
  channelId: string;
  publishedAfter: string;
  initialVideoId?: string;
};

export function parseYoutubeFeed(xml: string, settings: YoutubeFeedSettings, now = Date.now()): FeedItem[] {
  const cutoff = Date.parse(settings.publishedAfter);
  if (!Number.isFinite(cutoff)) return [];
  const seen = new Set<string>();
  return xml.split(/<entry\b[^>]*>/i).slice(1).flatMap((chunk): FeedItem[] => {
    const entry = chunk.split(/<\/entry>/i)[0];
    const videoId = getTag(entry, 'yt:videoId')?.trim() || '';
    const channelId = getTag(entry, 'yt:channelId')?.trim();
    const title = decodeHtmlEntities(decodeCdata(getTag(entry, 'title') || '')).trim();
    const published = Date.parse(getTag(entry, 'published') || '');
    if (!/^[\w-]{11}$/.test(videoId) || channelId !== settings.channelId || !title || !Number.isFinite(published) || published > now || seen.has(videoId)) return [];
    if (published <= cutoff && videoId !== settings.initialVideoId) return [];
    seen.add(videoId);
    return [{
      source: 'youtube',
      title,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      publishedAt: new Date(published).toISOString(),
      author: decodeHtmlEntities(getTag(getTag(entry, 'author') || '', 'name') || '').trim() || undefined,
      excerpt: stripHtml(decodeCdata(getTag(entry, 'media:description') || '')).slice(0, 220) || undefined,
      coverImage: getTagAttribute(entry, 'media:thumbnail', 'url')?.startsWith('https://i.ytimg.com/')
        ? decodeHtmlEntities(getTagAttribute(entry, 'media:thumbnail', 'url')!)
        : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    }];
  }).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function fetchYoutubeFeed(feedUrl: string, settings: YoutubeFeedSettings): Promise<FeedItem[]> {
  const xml = await fetchAllowedText(feedUrl, 'youtube', 'feed');
  return xml ? parseYoutubeFeed(xml, settings) : [];
}
