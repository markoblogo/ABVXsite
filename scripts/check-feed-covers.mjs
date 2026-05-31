import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const feeds = [
  { source: 'medium', url: 'https://abvcreative.medium.com/feed', fallback: '/og/abvx-home.png' },
  { source: 'substack', url: 'https://abvx.substack.com/feed', fallback: '/og/abvx-home.png' },
  { source: 'mn7r', url: 'https://mn7r.com/rss.xml', fallback: '/media/work/mn7r/hero.png' },
];

const cachePath = process.env.FEED_IMAGE_CACHE_PATH || path.join(process.cwd(), '.cache', 'feed-image-cache.json');
const timeoutMs = 6000;

function decodeCdata(value) {
  return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function tag(xml, name) {
  return xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] || '';
}

function attrs(xml, name, attr) {
  const re = new RegExp(`<${name}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, 'gi');
  const out = [];
  let match;
  while ((match = re.exec(xml))) out.push(match[1]);
  return out;
}

function imgSources(html) {
  const re = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const out = [];
  let match;
  while ((match = re.exec(html))) out.push(match[1]);
  return out;
}

function safeUrl(value, baseUrl) {
  if (!value) return null;
  const decoded = decodeHtmlEntities(decodeCdata(value.trim()));
  if (decoded.startsWith('/')) return decoded;
  try {
    const url = new URL(decoded, baseUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function metaImage(html, baseUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i,
  ];
  const raw = patterns.map((pattern) => html.match(pattern)?.[1]).find(Boolean);
  return safeUrl(raw, baseUrl);
}

function mn7rCandidates(articleUrl) {
  try {
    const url = new URL(articleUrl);
    if (url.hostname !== 'mn7r.com' || !url.pathname.startsWith('/blog/')) return [];
    const pathname = url.pathname.replace(/\/$/, '');
    return ['png', 'jpg', 'webp', 'avif'].map((extension) => `${url.origin}${pathname}.${extension}`);
  } catch {
    return [];
  }
}

async function validImage(url) {
  const candidate = safeUrl(url);
  if (!candidate) return null;
  if (candidate.startsWith('/')) return candidate;

  for (const method of ['HEAD', 'GET']) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(candidate, {
        method,
        headers: method === 'GET' ? { Range: 'bytes=0-2048' } : undefined,
        signal: controller.signal,
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.toLowerCase().startsWith('image/')) return candidate;
      if (method === 'HEAD' && res.status !== 405) break;
    } catch {
      // try the next method
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
}

function cacheKey(source, articleUrl) {
  try {
    const url = new URL(articleUrl);
    url.hash = '';
    return `${source}:${url.toString()}`;
  } catch {
    return `${source}:${articleUrl}`;
  }
}

function readCache() {
  if (!existsSync(cachePath)) {
    return { version: 1, updatedAt: new Date(0).toISOString(), sources: {}, articles: {} };
  }
  try {
    const parsed = JSON.parse(readFileSync(cachePath, 'utf8'));
    return parsed.version === 1 ? parsed : { version: 1, updatedAt: new Date(0).toISOString(), sources: {}, articles: {} };
  } catch {
    return { version: 1, updatedAt: new Date(0).toISOString(), sources: {}, articles: {} };
  }
}

function writeCache(cache) {
  mkdirSync(path.dirname(cachePath), { recursive: true });
  const tmp = `${cachePath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(cache, null, 2)}\n`);
  renameSync(tmp, cachePath);
}

function parseItems(xml, source) {
  return xml.split(/<item>/i).slice(1).map((chunk) => chunk.split(/<\/item>/i)[0]).map((item) => {
    const title = decodeCdata(tag(item, 'title')).trim();
    const link = decodeHtmlEntities(decodeCdata(tag(item, 'link')).trim());
    const content = decodeCdata(tag(item, 'content:encoded'));
    const description = decodeCdata(tag(item, 'description'));
    const feedImages = unique([
      ...imgSources(content),
      ...imgSources(description),
      ...attrs(item, 'media:content', 'url'),
      ...attrs(item, 'media:thumbnail', 'url'),
      ...attrs(item, 'itunes:image', 'href'),
      ...attrs(item, 'enclosure', 'url'),
    ]).map((candidate) => safeUrl(candidate, link));

    return title && link ? { source, title, url: link, feedImages } : null;
  }).filter(Boolean);
}

async function resolveCover(feed, item, cache) {
  const pageImage = await fetchText(item.url).then((html) => metaImage(html, item.url)).catch(() => null);
  const cached = cache.articles[cacheKey(item.source, item.url)]?.imageUrl || cache.sources[item.source]?.imageUrl;
  const candidates = unique([...item.feedImages, pageImage, ...mn7rCandidates(item.url), cached, feed.fallback]);

  for (const candidate of candidates) {
    const image = await validImage(candidate);
    if (image) {
      const origin = image === feed.fallback ? 'fallback' : image === cached ? 'cache' : 'fresh';
      return { image, origin };
    }
  }

  return { image: null, origin: 'missing' };
}

const cache = readCache();
const results = [];

for (const feed of feeds) {
  const xml = await fetchText(feed.url);
  const [latest] = parseItems(xml, feed.source);
  if (!latest) throw new Error(`No latest RSS item for ${feed.source}`);

  const resolved = await resolveCover(feed, latest, cache);
  if (resolved.image && resolved.origin !== 'fallback') {
    const entry = {
      source: feed.source,
      articleUrl: latest.url,
      imageUrl: resolved.image,
      title: latest.title,
      updatedAt: new Date().toISOString(),
    };
    cache.articles[cacheKey(feed.source, latest.url)] = entry;
    cache.sources[feed.source] = entry;
    cache.updatedAt = entry.updatedAt;
  }

  results.push({ source: feed.source, title: latest.title, articleUrl: latest.url, imageUrl: resolved.image, origin: resolved.origin });
}

writeCache(cache);

let hasFailure = false;
for (const result of results) {
  const ok = result.imageUrl && result.origin !== 'fallback';
  if (!ok) hasFailure = true;
  console.log(`${ok ? 'OK' : 'FAIL'} ${result.source}: ${result.title}`);
  console.log(`  article: ${result.articleUrl}`);
  console.log(`  image: ${result.imageUrl || 'missing'} (${result.origin})`);
}

if (hasFailure) process.exit(1);

