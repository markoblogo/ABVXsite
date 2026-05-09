import { getArtifacts, getBooks } from '@/content';
import type { MetadataRoute } from 'next';

const base = 'https://abvx.xyz';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/focus`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/systems`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/books`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/writing`, lastModified: now, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const workRoutes: MetadataRoute.Sitemap = getArtifacts().map((artifact) => ({
    url: `${base}/work/${artifact.slug}`,
    lastModified: artifact.updatedAt ? new Date(artifact.updatedAt) : now,
    changeFrequency: 'monthly',
    priority: artifact.featured ? 0.75 : 0.6,
  }));

  const bookRoutes: MetadataRoute.Sitemap = getBooks().map((book) => ({
    url: `${base}/books/${book.slug}`,
    lastModified: book.updatedAt ? new Date(book.updatedAt) : now,
    changeFrequency: 'monthly',
    priority: book.featured ? 0.75 : 0.6,
  }));

  return [...staticRoutes, ...workRoutes, ...bookRoutes];
}
