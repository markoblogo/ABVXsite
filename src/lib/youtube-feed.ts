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
  return (await fetchYoutubeFeedWithStatus(feedUrl, settings)).items;
}

// Availability must come from a complete Atom envelope, never the pinned item.
function hasCompleteAtomDocument(xml: string): boolean {
  const tags = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/?[A-Za-z_][\w:.-]*(?:\s+[A-Za-z_][\w:.-]*\s*=\s*(?:"[^"<]*"|'[^'<]*'))*\s*\/?>/g;
  const stack: string[] = [];
  let end = 0;
  let rootSeen = false;
  let match: RegExpExecArray | null;
  while ((match = tags.exec(xml))) {
    const between = xml.slice(end, match.index);
    if (between.includes('<') || (!stack.length && between.trim())) return false;
    end = match.index + match[0].length;
    const tag = match[0];
    if (tag.startsWith('<!--') || tag.startsWith('<?')) continue;
    if (tag.startsWith('<![CDATA[')) {
      if (!stack.length) return false;
      continue;
    }
    const name = /^<\/?([\w:.-]+)/.exec(tag)![1];
    if (tag.startsWith('</')) {
      if (!/^<\/[\w:.-]+\s*>$/.test(tag) || stack.pop() !== name) return false;
    } else {
      if (!stack.length) {
        if (rootSeen || name !== 'feed') return false;
        rootSeen = true;
      }
      if (!tag.endsWith('/>')) stack.push(name);
    }
  }
  return rootSeen && !stack.length && !xml.slice(end).trim();
}

export async function fetchYoutubeFeedWithStatus(feedUrl: string, settings: YoutubeFeedSettings) {
  const xml = await fetchAllowedText(feedUrl, 'youtube', 'feed');
  return {
    items: parseYoutubeFeed(xml || '', settings),
    upstreamAvailable: Boolean(xml && hasCompleteAtomDocument(xml) && getTag(xml, 'yt:channelId')?.trim() === settings.channelId),
  };
}
