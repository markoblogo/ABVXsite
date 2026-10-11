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
    && (!item.videoUrl || companions === undefined || companions[videoId(item.videoUrl)] === item.slug));
}

export function videoCompanionSnapshot(native, now = Date.now()) {
  const companions = {};
  for (const item of publishedWritingItems(native, now)) {
    const id = videoId(item.videoUrl);
    if (id && item.slug && !companions[id]) companions[id] = item.slug;
  }
  return companions;
}

export function findVideoCompanion(native, id, now = Date.now()) {
  return native.find(item => videoId(item.videoUrl) === id && isPublishedWriting(item, now));
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
