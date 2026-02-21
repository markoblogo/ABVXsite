import { getBooks, getEcosystems } from '@/lib/abvx-data';

export default async function sitemap() {
  const base = 'https://abvx.xyz';
  const now = new Date();

  let books: Awaited<ReturnType<typeof getBooks>> = [];
  let ecosystems: Awaited<ReturnType<typeof getEcosystems>> = [];

  try {
    books = await getBooks();
    ecosystems = await getEcosystems();
  } catch {
    // Build fallback: keep a valid sitemap even when Notion env is unavailable.
    books = [];
    ecosystems = [];
  }

  const urls = [
    { url: `${base}`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/projects`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/books`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/writing`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/work-with-me`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/ecosystems`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/llmo`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/links`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/toki-pona`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/cropto`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  for (const b of books) {
    if (!b.slug) continue;
    urls.push({
      url: `${base}/books/${b.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  for (const e of ecosystems) {
    if (!e.slug) continue;
    urls.push({
      url: `${base}/ecosystems/${e.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  return urls;
}
