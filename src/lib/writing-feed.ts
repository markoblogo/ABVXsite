import { getNativeWritingItems } from '@/content';
import { workingStoriesFeed } from '@/content/working-stories';
import discovery from '../../content/writing-discovery.json';
import publicIndex from '../../public/content-index.json';
import type { FeedItem } from './feed-types';
import { automaticVideoItems, publishedWritingItems, findVideoCompanion } from './youtube-pages.mjs';
import { mergeWritingItems } from './writing-chronology.mjs';

export function getPublishedNativeWritingItems(): ReturnType<typeof getNativeWritingItems> {
  return publishedWritingItems(getNativeWritingItems(), Date.now(), publicIndex.videoCompanions);
}

export function getWritingFeed(): FeedItem[] {
  const native: FeedItem[] = getPublishedNativeWritingItems().map(item => ({
    source: item.videoUrl ? 'youtube' : 'abvx', title: item.title, url: `/writing/${item.slug}`,
    publishedAt: item.videoUploadedAt || item.publishedAt || '',
    author: 'Anton BV', tags: item.tags, excerpt: item.summary,
    status: item.status, visibility: item.visibility,
    coverImage: item.coverImage?.src, videoUrl: item.videoUrl,
  }));
  return mergeWritingItems([...native, ...workingStoriesFeed()], discovery);
}

export function getVideoWritingItems(): FeedItem[] {
  return automaticVideoItems(discovery, getPublishedNativeWritingItems());
}

export function getVideoCompanion(id: string) {
  return findVideoCompanion(getPublishedNativeWritingItems(), id, Date.now(), publicIndex.videoRedirects);
}
