import { getArtifacts, getBooks } from '@/content';
import type { MetadataRoute } from 'next';

const base = 'https://abvx.xyz';

export default function sitemap(): MetadataRoute.Sitemap {
  const artifacts = getArtifacts();
  const books = getBooks();

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

  const allContentDate = latestDate([...artifacts, ...books]);
  const focusDate = latestDate(artifacts.filter((artifact) => artifact.appearsIn.includes('focus')));
  const systemsDate = latestDate(artifacts.filter((artifact) => artifact.appearsIn.includes('systems')));
  const booksDate = latestDate(books);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}`, lastModified: allContentDate, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/ami`, lastModified: allContentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/fr/ami`, lastModified: allContentDate, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/focus`, lastModified: focusDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/systems`, lastModified: systemsDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/books`, lastModified: booksDate, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/writing`, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/llmo`, lastModified: allContentDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/work-with-me`, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${base}/toki-pona`, lastModified: booksDate, changeFrequency: 'monthly', priority: 0.65 },
  ];

  const workRoutes: MetadataRoute.Sitemap = artifacts.map((artifact) => ({
    url: `${base}/work/${artifact.slug}`,
    lastModified: contentDate(artifact),
    changeFrequency: 'monthly',
    priority: artifact.featured ? 0.75 : 0.6,
  }));

  const bookRoutes: MetadataRoute.Sitemap = books.map((book) => ({
    url: `${base}/books/${book.slug}`,
    lastModified: contentDate(book),
    changeFrequency: 'monthly',
    priority: book.featured ? 0.75 : 0.6,
  }));

  return [...staticRoutes, ...workRoutes, ...bookRoutes];
}
