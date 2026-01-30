export type FeedItem = {
  source: 'medium' | 'substack';
  title: string;
  url: string;
  publishedAt: string; // ISO
  author?: string;
  tags?: string[];
  excerpt?: string;
  coverImage?: string;
};

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

function extractFirstImg(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  return m ? m[1] : null;
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
      const contentHtml = decodeCdata(content);
      const cover = extractFirstImg(contentHtml);
      const excerpt = stripHtml(contentHtml).slice(0, 220);

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

export function mergeFeeds(...lists: FeedItem[][]): FeedItem[] {
  const merged = lists.flat();
  merged.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  return merged;
}
