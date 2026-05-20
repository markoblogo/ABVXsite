export type FeedItem = {
  source: 'medium' | 'substack' | 'mn7r';
  title: string;
  url: string;
  publishedAt: string; // ISO
  author?: string;
  tags?: string[];
  excerpt?: string;
  coverImage?: string;
};

function stripHtml(html: string): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return decodeHtmlEntities(text);
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function decodeCdata(s: string): string {
  return s.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');
}

function getTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1] : null;
}

function getTags(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

function getTagAttribute(xml: string, tag: string, attribute: string): string | null {
  const re = new RegExp(`<${tag}[^>]*\\s${attribute}=["']([^"']+)["'][^>]*>`, 'i');
  const m = xml.match(re);
  return m ? m[1] : null;
}

function extractFirstImg(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  return m ? m[1] : null;
}

function extractMetaImage(html: string, baseUrl: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i,
  ];

  const match = patterns.map((pattern) => html.match(pattern)?.[1]).find(Boolean);
  if (!match) return null;

  try {
    return new URL(match, baseUrl).toString();
  } catch {
    return match;
  }
}

function deriveMn7rArticleImage(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'mn7r.com' || !parsed.pathname.startsWith('/blog/')) return null;
    const pathname = parsed.pathname.replace(/\/$/, '');
    if (/\.(?:avif|webp|png|jpe?g)$/i.test(pathname)) return null;
    return `${parsed.origin}${pathname}.jpg`;
  } catch {
    return null;
  }
}

function extractMediumSnippet(html: string): string | null {
  const m = html.match(/<p[^>]*class=["'][^"']*medium-feed-snippet[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
  return m ? stripHtml(m[1]) : null;
}

async function fetchArticleImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    const html = await res.text();
    return extractMetaImage(html, url);
  } catch {
    return null;
  }
}

async function parseRssFeed(
  feedUrl: string,
  source: FeedItem['source'],
  options: { resolveArticleImages?: boolean; articleImageLimit?: number } = {},
): Promise<FeedItem[]> {
  const res = await fetch(feedUrl, { next: { revalidate: 900 } });
  const xml = await res.text();
  const items = xml.split(/<item>/i).slice(1).map((chunk) => chunk.split(/<\/item>/i)[0]);

  const parsed = items
    .map((it) => {
      const title = decodeCdata(getTag(it, 'title') || '').trim();
      const link = decodeHtmlEntities(decodeCdata(getTag(it, 'link') || '').trim());
      const pubDate = (getTag(it, 'pubDate') || getTag(it, 'published') || '').trim();
      const creator = decodeCdata(getTag(it, 'dc:creator') || '').trim();
      const cats = getTags(it, 'category').map((c) => decodeCdata(c).trim()).filter(Boolean);
      const content = getTag(it, 'content:encoded') || '';
      const description = getTag(it, 'description') || '';
      const contentHtml = decodeCdata(content);
      const descriptionHtml = decodeCdata(description);
      const cover =
        extractFirstImg(contentHtml) ||
        extractFirstImg(descriptionHtml) ||
        getTagAttribute(it, 'media:content', 'url') ||
        getTagAttribute(it, 'enclosure', 'url') ||
        (source === 'mn7r' ? deriveMn7rArticleImage(link) : null);
      const excerpt = stripHtml(contentHtml || descriptionHtml).slice(0, 220);

      const dt = pubDate ? new Date(pubDate) : null;
      const publishedAt = dt && !Number.isNaN(dt.valueOf()) ? dt.toISOString() : new Date().toISOString();

      if (!title || !link) return null;

      return {
        source,
        title,
        url: link,
        publishedAt,
        author: creator || undefined,
        tags: cats.length ? cats : undefined,
        excerpt: excerpt || undefined,
        coverImage: cover || undefined,
      } satisfies FeedItem;
    })
    .filter(Boolean) as FeedItem[];

  if (!options.resolveArticleImages) return parsed;

  const limit = options.articleImageLimit ?? parsed.length;
  const withImages = await Promise.all(
    parsed.map(async (item, index) => {
      if (item.coverImage || index >= limit) return item;
      const coverImage = await fetchArticleImage(item.url);
      return coverImage ? { ...item, coverImage } : item;
    }),
  );

  return withImages;
}

export async function fetchMediumFeed(feedUrl: string): Promise<FeedItem[]> {
  const res = await fetch(feedUrl, {
    // cache on server, refresh periodically
    next: { revalidate: 900 },
  });
  const xml = await res.text();
  const items = xml.split(/<item>/i).slice(1).map((chunk) => chunk.split(/<\/item>/i)[0]);

  return items
    .map((it) => {
      const title = decodeCdata(getTag(it, 'title') || '').trim();
      const link = (getTag(it, 'link') || '').trim();
      const pubDate = (getTag(it, 'pubDate') || '').trim();
      const creator = decodeCdata(getTag(it, 'dc:creator') || '').trim();
      const cats = getTags(it, 'category').map((c) => decodeCdata(c).trim()).filter(Boolean);

      const content = getTag(it, 'content:encoded') || '';
      const description = getTag(it, 'description') || '';
      const contentHtml = decodeCdata(content);
      const descriptionHtml = decodeCdata(description);
      const cover = extractFirstImg(contentHtml) || extractFirstImg(descriptionHtml);
      const excerpt = (extractMediumSnippet(descriptionHtml) || stripHtml(contentHtml || descriptionHtml)).slice(0, 220);

      const dt = pubDate ? new Date(pubDate) : null;
      const publishedAt = dt && !Number.isNaN(dt.valueOf()) ? dt.toISOString() : new Date().toISOString();

      if (!title || !link) return null;

      return {
        source: 'medium' as const,
        title,
        url: link,
        publishedAt,
        author: creator || undefined,
        tags: cats.length ? cats : undefined,
        excerpt: excerpt || undefined,
        coverImage: cover || undefined,
      } satisfies FeedItem;
    })
    .filter(Boolean) as FeedItem[];
}

export async function fetchSubstackFeed(feedUrl: string): Promise<FeedItem[]> {
  // same RSS parsing approach; Substack feed is standard RSS.
  const res = await fetch(feedUrl, { next: { revalidate: 900 } });
  const xml = await res.text();
  const items = xml.split(/<item>/i).slice(1).map((chunk) => chunk.split(/<\/item>/i)[0]);

  return items
    .map((it) => {
      const title = decodeCdata(getTag(it, 'title') || '').trim();
      const link = (getTag(it, 'link') || '').trim();
      const pubDate = (getTag(it, 'pubDate') || '').trim();
      const content = getTag(it, 'content:encoded') || getTag(it, 'description') || '';
      const contentHtml = decodeCdata(content);
      const cover = extractFirstImg(contentHtml);
      const excerpt = stripHtml(contentHtml).slice(0, 220);

      const dt = pubDate ? new Date(pubDate) : null;
      const publishedAt = dt && !Number.isNaN(dt.valueOf()) ? dt.toISOString() : new Date().toISOString();

      if (!title || !link) return null;

      return {
        source: 'substack' as const,
        title,
        url: link,
        publishedAt,
        excerpt: excerpt || undefined,
        coverImage: cover || undefined,
      } satisfies FeedItem;
    })
    .filter(Boolean) as FeedItem[];
}

export async function fetchMn7rFeed(feedUrl: string): Promise<FeedItem[]> {
  return parseRssFeed(feedUrl, 'mn7r', { resolveArticleImages: true, articleImageLimit: 1 });
}

export function mergeFeeds(...lists: FeedItem[][]): FeedItem[] {
  const merged = lists.flat();
  merged.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  return merged;
}
