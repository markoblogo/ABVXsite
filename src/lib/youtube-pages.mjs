import { writingUrlKey } from './writing-chronology.mjs';

export function videoId(value) {
  const key = writingUrlKey(value);
  return key.startsWith('https://www.youtube.com/watch?') ? new URL(key).searchParams.get('v') : null;
}

export function findVideoCompanion(native, id, now = Date.now()) {
  return native.find(item => videoId(item.videoUrl) === id
    && (item.visibility === undefined || item.visibility === 'public')
    && (item.status === undefined || item.status === 'live')
    && Date.parse(item.publishedAt) <= now);
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
