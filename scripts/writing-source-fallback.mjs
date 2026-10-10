import { writingUrlKey } from '../src/lib/writing-chronology.mjs';

export async function fetchWritingSourceFallback(source, fetcher = fetch) {
  if (!['medium', 'substack', 'youtube'].includes(source)) return [];
  try {
    const response = await fetcher(`https://abvx.xyz/api/writing/feed/${source}`, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) return [];
    const items = await response.json();
    if (!Array.isArray(items)) return [];
    return items.filter(item => item && item.source === source && typeof item.title === 'string' && item.title.trim()
      && writingUrlKey(item.url)?.startsWith('https://') && Number.isFinite(Date.parse(item.publishedAt)));
  } catch { return []; }
}
