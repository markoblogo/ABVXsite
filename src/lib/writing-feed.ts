import { getNativeWritingItems } from '@/content';
import { getWorkingStories, workingStoriesFeed, workingStoryPath } from '@/content/working-stories';
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

// Stay on the server: search never sends the complete article corpus to the browser.
export function getWritingSearchBodies(): Map<string, string> {
  return new Map([
    ...getPublishedNativeWritingItems().map(item => [`/writing/${item.slug}`, item.body] as const),
    ...getWorkingStories().map(story => [workingStoryPath(story), story.body] as const),
  ]);
}

export function getVideoCompanion(id: string) {
  return findVideoCompanion(getPublishedNativeWritingItems(), id, Date.now(), publicIndex.videoRedirects);
}
