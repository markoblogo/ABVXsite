import { cache } from 'react';
import { indexedWorkingStories, queryWorkingStories, readWorkingStories, relatedWorkingStories, workingStoryPath } from './working-stories-lib.mjs';
import publicIndex from '../../public/content-index.json';
import type { FeedItem } from '@/lib/feed-types';

export type WorkingStory = ReturnType<typeof readWorkingStories>[number];
export { workingStoryPath };

const readIndexedStories = cache(() => indexedWorkingStories(readWorkingStories(), publicIndex));

export function getWorkingStories(query: { topic?: string; cluster?: string; sourceSession?: string } = {}): WorkingStory[] {
  return queryWorkingStories(readIndexedStories(), query);
}

export function getWorkingStoryBySlug(slug: string): WorkingStory | undefined {
  return getWorkingStories().find((story) => story.slug === slug);
}

export function getRelatedWorkingStories(story: WorkingStory): WorkingStory[] {
  return relatedWorkingStories(story, getWorkingStories());
}

export function workingStoriesFeed(): FeedItem[] {
  return getWorkingStories().map((story) => ({
    source: 'abvx', title: story.title, url: workingStoryPath(story),
    publishedAt: story.date, excerpt: story.summary, tags: story.topics,
    author: 'Anton Biletskyi-Volokh',
    ...(story.coverImage ? { coverImage: story.coverImage.src } : {}),
  }));
}
