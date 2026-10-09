import pageMetadata from '../../content/pages.json';
import { getArtifacts, getBooks, getNativeWritingItems } from '@/content';
import { servicePages } from '@/content/service-pages';
import { getEditorialArticles } from '@/content/editorials';
import type { MetadataRoute } from 'next';

const base = 'https://abvx.xyz';
const trafficLandingUpdatedAt = new Date('2026-09-16T00:00:00.000Z');

export default function sitemap(): MetadataRoute.Sitemap {
  const artifacts = getArtifacts();
  const books = getBooks();
  const writing = getNativeWritingItems();
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

  const allContentDate = latestDate([...artifacts, ...books, ...writing, ...editorialArticles, ...Object.values(pageMetadata)]);
  const focusDate = latestDate([
    ...artifacts.filter((artifact) => artifact.appearsIn.includes('focus')),
    ...editorialArticles.filter((article) => article.section === 'focus'),
  ]);
  const systemsDate = latestDate([
    ...artifacts.filter((artifact) => artifact.appearsIn.includes('systems')),
    ...editorialArticles.filter((article) => article.section === 'systems'),
  ]);
  const booksDate = latestDate([...books, ...editorialArticles.filter((article) => article.section === 'books'), pageMetadata['/books']]);
  const writingDate = latestDate([...writing, ...editorialArticles.filter((article) => article.section === 'writing')]);
  const aboutDate = latestDate([pageMetadata['/about'], ...editorialArticles.filter((article) => article.section === 'about')]);
  const tokiPonaDate = latestDate([...books, pageMetadata['/toki-pona']]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}`, lastModified: allContentDate, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/ami`, lastModified: allContentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/fr/ami`, lastModified: allContentDate, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/focus`, lastModified: focusDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/systems`, lastModified: systemsDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/books`, lastModified: booksDate, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/writing`, lastModified: writingDate, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${base}/about`, lastModified: aboutDate, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${base}/llmo`, lastModified: allContentDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/work-with-me`, lastModified: trafficLandingUpdatedAt, changeFrequency: 'monthly', priority: 0.72 },
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

  return [...staticRoutes, ...serviceRoutes, ...workRoutes, ...bookRoutes, ...writingRoutes, ...editorialRoutes];
}
