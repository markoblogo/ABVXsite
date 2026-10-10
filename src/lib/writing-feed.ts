import { getNativeWritingItems } from '@/content';
import { workingStoriesFeed } from '@/content/working-stories';
import discovery from '../../content/writing-discovery.json';
import type { FeedItem } from './feed-types';
import { mergeWritingItems } from './writing-chronology.mjs';

export function getWritingFeed(): FeedItem[] {
  const native: FeedItem[] = getNativeWritingItems().filter(item =>
    Boolean(item.publishedAt) && Date.parse(item.publishedAt!) <= Date.now()).map(item => ({
    source: item.videoUrl ? 'youtube' : 'abvx', title: item.title, url: `/writing/${item.slug}`,
    publishedAt: item.videoUploadedAt || item.publishedAt || '',
    author: 'Anton BV', tags: item.tags, excerpt: item.summary,
    coverImage: item.coverImage?.src, videoUrl: item.videoUrl,
  }));
  return mergeWritingItems([...native, ...workingStoriesFeed()], discovery);
}
