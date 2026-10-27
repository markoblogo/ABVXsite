import { videoId } from '../src/lib/youtube-pages.mjs';

// A missing RSS entry or an HTTP error does not establish that a video was removed.
export async function checkVideoAvailability(id, fetcher = fetch) {
  if (!/^[\w-]{11}$/.test(id)) return 'unknown';
  try {
    const response = await fetcher(`https://www.youtube.com/watch?v=${id}&hl=en`, { signal: AbortSignal.timeout(12000), redirect: 'error' });
    if (!response.ok) return 'unknown';
    const html = await response.text();
    const raw = html.match(/(?:var\s+)?ytInitialPlayerResponse\s*=\s*(\{[^\n]*?\});\s*<\/script>/)?.[1];
    if (!raw) return 'unknown';
    const player = JSON.parse(raw);
    if (player.playabilityStatus?.status === 'OK' && player.videoDetails?.videoId === id) return 'available';
    if (player.playabilityStatus?.status !== 'ERROR' && player.playabilityStatus?.status !== 'LOGIN_REQUIRED') return 'unknown';
    const detail = player.playabilityStatus?.errorScreen?.playerInterstitialRenderer?.content?.interstitialViewModel?.description?.content;
    const reason = player.playabilityStatus?.reason;
    if ([detail, reason].some(value => value === 'This video has been removed by the uploader' || value === 'This video is private')) return 'removed';
    return 'unknown';
  } catch { return 'unknown'; }
}

export function updateVideoAvailability(registry, results) {
  return { ...registry, items: registry.items.map(item => {
    const id = item.source === 'youtube' && !item.url.startsWith('/') ? videoId(item.url) : null;
    const result = id && results.get(id);
    if (result === 'removed') return { ...item, youtubeAvailability: 'removed' };
    if (result === 'available' && item.youtubeAvailability === 'removed') {
      const { youtubeAvailability, ...rest } = item;
      return rest;
    }
    return item;
  }) };
}

export async function scanVideoAvailability(registry, newlyAdded = [], now = Date.now(), fetcher = fetch) {
  const ids = registry.items.filter(item => item.source === 'youtube' && !item.url.startsWith('/'))
    .map(item => videoId(item.url)).filter(Boolean).sort();
  const size = 8;
  const pages = Math.ceil(ids.length / size);
  const slot = pages ? Math.floor(now / 900000) % pages : 0;
  const batch = new Set([...ids.slice(slot * size, (slot + 1) * size), ...newlyAdded]);
  const results = new Map(await Promise.all([...batch].map(async id => [id, await checkVideoAvailability(id, fetcher)])));
  return updateVideoAvailability(registry, results);
}
