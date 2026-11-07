import {renderFeedMarkdown, feedImage, renderFeedRecipe} from './feed-markdown.mjs';
import type {ContentImage, WritingIllustration, RecipeRecord} from '@/content/types';
import {getLiveWritingIndex} from './live-writing-discovery';
import {getPublishedNativeWritingItems} from './writing-feed';
import {getWorkingStories, workingStoryPath} from '@/content/working-stories';
import {getLiveCatalogue} from './live-catalogue';
import {writingTopicsFor} from '@/content/writing-topics.mjs';
import {renderRss, rssFeeds} from './rss.mjs';
import {SITE_URL} from './seo';

type Entry = {title: string; path: string; summary: string; body: string; publishedAt?: string; updatedAt?: string; image?: ContentImage; illustrations?: WritingIllustration[]; recipe?: RecipeRecord; categories: string[]; visibility?: string};

export async function publicRss(path: string) {
  const feed = rssFeeds.find(item => item.path === path);
  if (!feed) return null;
  const topic = 'topic' in feed ? feed.topic : undefined;
  const index = await getLiveWritingIndex();
  const admitted = new Set(index.items.map((item: {canonicalUrl: string}) => item.canonicalUrl));
  let entries: Entry[];
  if (feed.kind === 'writing') {
    const [native, stories] = await Promise.all([getPublishedNativeWritingItems(), getWorkingStories()]);
    entries = [
      ...native.map(item => ({...item, path: `/writing/${item.slug}`, image: item.coverImage || item.heroImage, categories: writingTopicsFor(item)})),
      ...stories.map(item => ({...item, path: workingStoryPath(item), publishedAt: item.date, image: item.coverImage, categories: writingTopicsFor(item)})),
    ].filter(item => !topic || item.categories.includes(topic));
  } else {
    const catalogue = await getLiveCatalogue();
    entries = (feed.kind === 'books' ? catalogue.getBooks() : catalogue.getArtifactsBySection('systems')).map(item => ({
      ...item, path: item.canonicalPath || (feed.kind === 'books' ? `/books/${item.slug}` : `/work/${item.slug}`),
      body: item.description || item.summary,
      image: 'coverImage' in item ? item.coverImage || item.heroImage : 'thumbnail' in item ? item.thumbnail || item.heroImage : item.heroImage,
      categories: item.tags,
    }));
  }
  const unique = new Map(entries.filter(item => admitted.has(new URL(item.path, SITE_URL).href)
    && !['private', 'draft'].includes(item.visibility || '')
    && (!item.publishedAt || Date.parse(item.publishedAt) <= Date.now())).map(item => [item.path, item]));
  const items = [...unique.values()].sort((a,b) => (Date.parse(b.publishedAt || '') || 0) - (Date.parse(a.publishedAt || '') || 0) || a.path.localeCompare(b.path)).map(item => {
    const url = new URL(item.path, SITE_URL).href;
    const image = item.image ? new URL(item.image.src, SITE_URL).href : undefined;
    return {...item, url, image, html: feedImage(item.image, url) + renderFeedMarkdown(item.body, url, item.illustrations) + renderFeedRecipe(item.recipe)};
  });
  return renderRss(feed, items, SITE_URL);
}
