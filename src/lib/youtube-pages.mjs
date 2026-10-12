import { writingUrlKey } from './writing-chronology.mjs';

export function videoId(value) {
  const key = writingUrlKey(value);
  return key.startsWith('https://www.youtube.com/watch?') ? new URL(key).searchParams.get('v') : null;
}

export function isPublishedWriting(item, now = Date.now()) {
  return (item.visibility === undefined || item.visibility === 'public')
    && (item.status === undefined || item.status === 'live')
    && Date.parse(item.publishedAt) <= now;
}

// A deployed index is the release boundary; the wall clock cannot activate a
// companion while that same deployment still advertises its automatic page.
export function publishedWritingItems(native, now = Date.now(), companions) {
  return native.filter(item => isPublishedWriting(item, now)
    && (!item.videoUrl || companions === undefined
      || (Array.isArray(companions[videoId(item.videoUrl)])
        ? companions[videoId(item.videoUrl)].includes(item.slug)
        : companions[videoId(item.videoUrl)] === item.slug)));
}

export function videoCompanionSnapshot(native, now = Date.now()) {
  const companions = {};
  for (const item of publishedWritingItems(native, now)) {
    const id = videoId(item.videoUrl);
    if (id && item.slug) companions[id] = [...new Set([...(Object.hasOwn(companions, id) ? companions[id] : []), item.slug])].sort();
  }
  return companions;
}

// All translations remain released; the redirect chooses the first-added local
// companion. Immutable discovery timestamps survive copy/date/order changes.
export function videoRedirectSnapshot(native, registry, now = Date.now()) {
  const firstAdded = new Map(registry.items.map(item => [item.url, Date.parse(item.addedAt)]));
  const companions = publishedWritingItems(native, now).filter(item => videoId(item.videoUrl) && item.slug);
  const timestamp = item => firstAdded.get(`/writing/${item.slug}`) ?? Infinity;
  companions.sort((a, b) => timestamp(a) - timestamp(b) || a.slug.localeCompare(b.slug));
  const redirects = {};
  for (const item of companions) {
    const id = videoId(item.videoUrl);
    if (!Object.hasOwn(redirects, id)) redirects[id] = item.slug;
  }
  return redirects;
}

export function findVideoCompanion(native, id, now = Date.now(), redirects) {
  const candidates = native.filter(item => videoId(item.videoUrl) === id && isPublishedWriting(item, now));
  if (redirects !== undefined) return candidates.find(item => item.slug === redirects[id]);
  return candidates.sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt)
    || (a.slug || '').localeCompare(b.slug || ''))[0];
}

// The registry remains canonical; authored companions supersede automatic pages.
export function automaticVideoItems(registry, native = [], now = Date.now()) {
  return registry.items.flatMap(item => {
    const id = item.source === 'youtube' ? videoId(item.url) : null;
    if (!id || findVideoCompanion(native, id, now) || Date.parse(item.publishedAt) > now) return [];
    return [{ ...item, videoUrl: item.url, url: `/writing/videos/${id}` }];
  });
}

export function videoPageJsonLd(item, base = 'https://abvx.xyz') {
  const id = videoId(item.videoUrl);
  if (!id) throw new Error('Supported video required');
  const url = base + item.url;
  return {
    '@context': 'https://schema.org', '@type': 'VideoObject',
    name: item.title, description: item.videoDescription || item.excerpt || item.title,
    uploadDate: item.publishedAt, thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`, url, mainEntityOfPage: url,
    creator: { '@type': 'Person', '@id': base + '/#person', name: 'Anton Biletskyi-Volokh' },
  };
}
