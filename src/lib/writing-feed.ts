import { getLiveNativeWritingItems } from './live-writing';
import { getWorkingStories, workingStoriesFeed, workingStoryPath } from '@/content/working-stories';
import discovery from '../../content/writing-discovery.json';
import {getLiveWritingIndex} from './live-writing-discovery';
import type { NativeWriting } from '@/content/types';
import type { FeedItem } from './feed-types';
import { automaticVideoItems, publishedWritingItems, findVideoCompanion } from './youtube-pages.mjs';
import { mergeWritingItems } from './writing-chronology.mjs';

export async function getPublishedNativeWritingItems(): Promise<NativeWriting[]> {
  return publishedWritingItems(await getLiveNativeWritingItems(), Date.now(), (await getLiveWritingIndex()).videoCompanions);
}

export async function getWritingFeed(): Promise<FeedItem[]> {
  const native: FeedItem[] = (await getPublishedNativeWritingItems()).map(item => ({
    source: item.videoUrl ? 'youtube' : 'abvx', title: item.title, url: `/writing/${item.slug}`,
    publishedAt: item.videoUploadedAt || item.publishedAt || '',
    addedAt:item.addedAt, author: 'Anton BV', tags: item.tags, excerpt: item.summary,
    status: item.status, visibility: item.visibility,
    coverImage: item.coverImage?.src, videoUrl: item.videoUrl,
  }));
  return mergeWritingItems([...native, ...workingStoriesFeed()], discovery);
}

export async function getVideoWritingItems(): Promise<FeedItem[]> {
  return automaticVideoItems(discovery, await getPublishedNativeWritingItems());
}

// Stay on the server: search never sends the complete article corpus to the browser.
export async function getWritingSearchBodies(): Promise<Map<string, string>> {
  return new Map([
    ...(await getPublishedNativeWritingItems()).map(item => [`/writing/${item.slug}`, item.body] as const),
    ...getWorkingStories().map(story => [workingStoryPath(story), story.body] as const),
  ]);
}

export async function getVideoCompanion(id: string) {
  return findVideoCompanion(await getPublishedNativeWritingItems(), id, Date.now(), (await getLiveWritingIndex()).videoRedirects);
}
