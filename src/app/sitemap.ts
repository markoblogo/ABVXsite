import {staticPaths,staticLocales,localizedPath,staticAlternates,staticUpdatedAt} from '@/lib/static-locales.mjs';
import type {NativeWriting} from '@/content/types';
import type {FeedItem} from '@/lib/feed-types';
import discovery from '../../content/writing-discovery.json';
import {automaticVideoItems,publishedWritingItems} from '@/lib/youtube-pages.mjs';
import kitchenNotes from '../../content/kitchen-notes.json';
import pageMetadata from '../../content/pages.json';
import {getLiveWritingBundle} from '@/lib/live-writing-discovery';
import {getLiveCatalogue} from '@/lib/live-catalogue';
import { servicePages } from '@/content/service-pages';
import { getEditorialArticles } from '@/content/editorials';
import { getWorkingStories, workingStoryPath } from '@/content/working-stories';
import workingStoriesSeries from '../../content/working-stories.json';
import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';
const base = 'https://abvx.xyz';
const trafficLandingUpdatedAt = new Date('2026-09-16T00:00:00.000Z');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const {index:publicIndex,native} = await getLiveWritingBundle();
  const {getArtifacts,getBooks} = await getLiveCatalogue();
  const artifacts = getArtifacts();
  const books = getBooks();
  const releasedNative = publishedWritingItems(native,Date.now(),publicIndex.videoCompanions) as NativeWriting[];
  const releasedVideos = new Set(releasedNative.filter(item => item.videoUrl).map(item => item.slug));
  const writing = native.filter(item => !item.videoUrl || releasedVideos.has(item.slug));
  const videos: FeedItem[] = automaticVideoItems(discovery,releasedNative);
  const videoDates = videos.map(item=>({publishedAt:item.publishedAt}));
  const stories = await getWorkingStories();
  const storyDates = stories.map((story) => ({ publishedAt: story.date, updatedAt: story.updatedAt }));
  const editorialArticles = getEditorialArticles();
  const editorialRoutes: MetadataRoute.Sitemap = editorialArticles.map((article) => ({
    url: `${base}${article.href}`,
    lastModified: contentDate(article),
    ...(article.translationGroup ? { alternates: { languages: Object.fromEntries(
      editorialArticles.filter((translation) => translation.translationGroup === article.translationGroup && translation.language)
        .map((translation) => [translation.language!, `${base}${translation.href}`]),
    ) } } : {}),
    changeFrequency: 'monthly',
    priority: 0.55,
  }));

  function contentDate(item: { updatedAt?: string; publishedAt?: string }): Date | undefined {
    const value = item.updatedAt || item.publishedAt;
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isFinite(date.valueOf()) ? date : undefined;
  }

  function latestDate(items: Array<{ updatedAt?: string; publishedAt?: string }>): Date | undefined {
    return items
      .map(contentDate)
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => b.valueOf() - a.valueOf())[0];
  }

  const allContentDate = latestDate([...artifacts, ...books, ...writing, ...storyDates, ...videoDates, workingStoriesSeries, ...editorialArticles, ...Object.values(pageMetadata)]);
  const focusDate = latestDate([
    ...artifacts.filter((artifact) => artifact.appearsIn.includes('focus')),
    ...editorialArticles.filter((article) => article.section === 'focus'),pageMetadata['/focus'],
  ]);
  const systemsDate = latestDate([
    ...artifacts.filter((artifact) => artifact.appearsIn.includes('systems')),
    ...editorialArticles.filter((article) => article.section === 'systems'),pageMetadata['/systems'],
  ]);
  const booksDate = latestDate([...books, ...editorialArticles.filter((article) => article.section === 'books'), pageMetadata['/books']]);
  const writingDate = latestDate([...writing, ...storyDates, ...videoDates, workingStoriesSeries, ...editorialArticles.filter((article) => article.section === 'writing')]);
  const aboutDate = latestDate([pageMetadata['/about'], ...editorialArticles.filter((article) => article.section === 'about')]);
  const tokiPonaDate = latestDate([...books.filter(book => ['the-strange-case-of-dr-jekyll-and-mr-hyde-in-toki-pona','stoic-wisdom-toki-pona'].includes(book.slug)),...artifacts.filter(item=>item.slug==='toki-pona-ai-translator'), pageMetadata['/toki-pona']]);

  const staticRoutes: MetadataRoute.Sitemap = [
    ...staticPaths.flatMap(path=>staticLocales.map(locale=>({url:base+(path==='/'&&locale==='en'?'':localizedPath(path,locale)),lastModified:path==='/'?allContentDate:path==='/about'?aboutDate:new Date(staticUpdatedAt),alternates:{languages:staticAlternates(path)},changeFrequency:'monthly' as const,priority:path==='/'?1:0.75}))),
    { url: `${base}/ami`, lastModified: contentDate(pageMetadata['/ami']), alternates:{languages:{en:`${base}/ami`,fr:`${base}/fr/ami`}}, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/fr/ami`, lastModified: contentDate(pageMetadata['/fr/ami']), alternates:{languages:{en:`${base}/ami`,fr:`${base}/fr/ami`}}, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/focus`, lastModified: focusDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/systems`, lastModified: systemsDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/books`, lastModified: booksDate, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/writing/archive`, lastModified: contentDate({updatedAt:publicIndex.items.find((item: {canonicalUrl:string;updatedAt?:string|null})=>item.canonicalUrl===`${base}/writing/archive`)?.updatedAt||pageMetadata['/writing/archive'].updatedAt}),changeFrequency:'weekly',priority:0.55 },
    { url: `${base}/writing`, lastModified: writingDate, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${base}${workingStoriesSeries.canonicalPath}`, lastModified: latestDate([...storyDates, workingStoriesSeries]), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}${kitchenNotes.canonicalPath}`, lastModified: latestDate([...writing.filter(item => item.collection === kitchenNotes.id), kitchenNotes]), changeFrequency: 'monthly', priority: 0.55 },
    { url: `${base}/llmo`, lastModified: contentDate(pageMetadata['/llmo']), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/toki-pona`, lastModified: tokiPonaDate, changeFrequency: 'monthly', priority: 0.65 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = servicePages.map((page) => ({
    url: `${base}/work-with-me/${page.slug}`,
    lastModified: trafficLandingUpdatedAt,
    changeFrequency: 'monthly',
    priority: 0.68,
  }));

  const workRoutes: MetadataRoute.Sitemap = artifacts.map((artifact) => ({
    url: `${base}/work/${artifact.slug}`,
    lastModified: contentDate(artifact),
    changeFrequency: 'monthly',
    priority: artifact.featured ? 0.75 : 0.6,
  }));

  const bookRoutes: MetadataRoute.Sitemap = books.map((book) => ({
    url: `${base}${book.canonicalPath || `/books/${book.slug}`}`,
    lastModified: contentDate(book),
    changeFrequency: 'monthly',
    priority: book.featured ? 0.75 : 0.6,
  }));

  const writingRoutes: MetadataRoute.Sitemap = writing.map((item) => ({
    url: `${base}/writing/${item.slug}`,
    ...(item.translationGroup ? { alternates: { languages: Object.fromEntries(
      writing.filter((translation) => translation.translationGroup === item.translationGroup && translation.language)
        .map((translation) => [translation.language!, `${base}/writing/${translation.slug}`]),
    ) } } : {}),
    lastModified: contentDate(item),
    changeFrequency: 'monthly',
    priority: 0.55,
  }));

  const storyRoutes: MetadataRoute.Sitemap = stories.map((story) => ({
    url: `${base}${workingStoryPath(story)}`, lastModified: contentDate({ publishedAt: story.date, updatedAt: story.updatedAt }),
    changeFrequency: 'monthly', priority: 0.55,
  }));
  const videoRoutes: MetadataRoute.Sitemap = videos.map(item => ({
    url: base + item.url, lastModified: new Date(item.publishedAt), changeFrequency: 'monthly', priority: 0.55,
  }));
  return [...videoRoutes, ...staticRoutes, ...serviceRoutes, ...workRoutes, ...bookRoutes, ...writingRoutes, ...editorialRoutes, ...storyRoutes];
}
