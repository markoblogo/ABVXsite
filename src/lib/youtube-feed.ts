import { fetchAllowedText } from './feed-http';
import { decodeCdata, decodeHtmlEntities, getTag, getTagAttribute, stripHtml } from './feed-text';
import type { FeedItem } from './feed-types';

export type YoutubeFeedSettings = {
  channelId: string;
  publishedAfter: string;
  initialVideoId?: string;
  initialVideo?: { title: string; publishedAt: string; summary: string };
};

export function parseYoutubeFeed(xml: string, settings: YoutubeFeedSettings, now = Date.now()): FeedItem[] {
  const cutoff = Date.parse(settings.publishedAfter);
  if (!Number.isFinite(cutoff)) return [];
  const seen = new Set<string>();
  const items = xml.split(/<entry\b[^>]*>/i).slice(1).flatMap((chunk): FeedItem[] => {
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
  });
  const initial = settings.initialVideo;
  const id = settings.initialVideoId;
  const published = Date.parse(initial?.publishedAt || '');
  if (id && /^[\w-]{11}$/.test(id) && initial?.title.trim() && Number.isFinite(published) && published <= cutoff && published <= now && !seen.has(id)) {
    items.push({
      source: 'youtube',
      title: initial.title,
      url: `https://www.youtube.com/watch?v=${id}`,
      publishedAt: new Date(published).toISOString(),
      excerpt: initial.summary,
      coverImage: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    });
  }
  return items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function fetchYoutubeFeed(feedUrl: string, settings: YoutubeFeedSettings): Promise<FeedItem[]> {
  const xml = await fetchAllowedText(feedUrl, 'youtube', 'feed');
  return parseYoutubeFeed(xml || '', settings);
}
