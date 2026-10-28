import {getLiveWritingState} from '@/lib/live-writing';
import {currentSources} from './runtime-writing.mjs';
import {parseMarkdownSource} from './markdown-source.mjs';
import { cache } from 'react';
import { compareWorkingStories, indexedWorkingStories, queryWorkingStories, readWorkingStories, relatedWorkingStories, workingStoryPath } from './working-stories-lib.mjs';
import publicIndex from '../../public/content-index.json';
import type { FeedItem } from '@/lib/feed-types';

export type WorkingStory = ReturnType<typeof readWorkingStories>[number] & {addedAt?: string};
export { workingStoryPath };

const readIndexedStories = cache(() => indexedWorkingStories(readWorkingStories(), publicIndex));

export async function getWorkingStories(query: { topic?: string; cluster?: string; sourceSession?: string } = {}): Promise<WorkingStory[]> {
  const state=await getLiveWritingState();
  const legacy=readIndexedStories().filter((story: WorkingStory)=>!state||!Object.hasOwn(state.records,story.slug));
  const live=state?currentSources(state).map(source=>{const {data,body}=parseMarkdownSource(source);return {...data,body,summary:data.summary??data.title,language:data.language??'en',book:{...data.book,include:data.book?.include??true},source:'runtime',addedAt:state.records[data.slug]?.firstAddedAt};}).filter(story=>story.type==='working-story'):[];
  return queryWorkingStories(([...legacy,...live] as WorkingStory[]).sort((a,b)=>-compareWorkingStories(a,b)), query);
}

export async function getWorkingStoryBySlug(slug: string): Promise<WorkingStory | undefined> {
  return (await getWorkingStories()).find((story) => story.slug === slug);
}

export async function getRelatedWorkingStories(story: WorkingStory): Promise<WorkingStory[]> {
  return relatedWorkingStories(story, await getWorkingStories());
}

export async function workingStoriesFeed(): Promise<FeedItem[]> {
  return (await getWorkingStories()).map((story) => ({
    source: 'abvx', title: story.title, url: workingStoryPath(story),
    publishedAt: story.date, addedAt: story.addedAt, excerpt: story.summary, tags: story.topics,
    author: 'Anton Biletskyi-Volokh',
    ...(story.coverImage ? { coverImage: story.coverImage.src } : {}),
  }));
}
