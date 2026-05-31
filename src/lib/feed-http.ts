import { decodeCdata, decodeHtmlEntities } from './feed-text';
import {
  FEED_REVALIDATE_SECONDS,
  IMAGE_FETCH_TIMEOUT_MS,
  feedSourceConfigs,
  type FeedSource,
} from './feed-types';

type FetchKind = 'feed' | 'article' | 'image';

function hostMatches(hostname: string, pattern: string): boolean {
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(2);
    return hostname === suffix || hostname.endsWith(`.${suffix}`);
  }
  return hostname === pattern;
}

function allowedHosts(source: FeedSource, kind: FetchKind): string[] {
  const config = feedSourceConfigs[source];
  if (kind === 'feed') return config.feedHosts;
  if (kind === 'article') return config.articleHosts;
  return config.imageHosts;
}

export function isAllowedFeedUrl(url: string, source: FeedSource, kind: FetchKind): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return allowedHosts(source, kind).some((pattern) => hostMatches(parsed.hostname, pattern));
  } catch {
    return false;
  }
}

export function safeHttpUrl(value: string | undefined, baseUrl?: string): string | null {
  if (!value) return null;
  const decoded = decodeHtmlEntities(decodeCdata(value.trim()));
  if (!decoded) return null;
  if (decoded.startsWith('/')) return decoded;

  try {
    const url = new URL(decoded, baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init: RequestInit & { next?: { revalidate?: number } } = {},
): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAllowedText(
  url: string,
  source: FeedSource,
  kind: Extract<FetchKind, 'feed' | 'article'>,
): Promise<string | null> {
  const candidate = safeHttpUrl(url);
  if (!candidate || candidate.startsWith('/') || !isAllowedFeedUrl(candidate, source, kind)) return null;
  const res = await fetchWithTimeout(candidate, IMAGE_FETCH_TIMEOUT_MS, {
    next: { revalidate: FEED_REVALIDATE_SECONDS },
  });
  if (!res?.ok) return null;
  return res.text();
}

export async function imageUrlIfValid(url: string | undefined, source: FeedSource): Promise<string | null> {
  const candidate = safeHttpUrl(url);
  if (!candidate) return null;
  if (candidate.startsWith('/')) return candidate;
  if (!isAllowedFeedUrl(candidate, source, 'image')) return null;

  const fetchImage = (method: 'HEAD' | 'GET') =>
    fetchWithTimeout(candidate, IMAGE_FETCH_TIMEOUT_MS, {
      method,
      headers: method === 'GET' ? { Range: 'bytes=0-2048' } : undefined,
      next: { revalidate: FEED_REVALIDATE_SECONDS },
    });

  let res = await fetchImage('HEAD');
  if (!res?.ok || res.status === 405) res = await fetchImage('GET');
  if (!res?.ok) return null;
  const contentType = res.headers.get('content-type') || '';
  return contentType.toLowerCase().startsWith('image/') ? candidate : null;
}
