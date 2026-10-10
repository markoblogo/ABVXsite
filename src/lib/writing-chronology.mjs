const sources = new Set(['abvx', 'medium', 'substack', 'youtube']);
const bases = new Set(['observed', 'legacy-source', 'production']);

export function writingUrlKey(value) {
  if (typeof value !== 'string') return '';
  if (/^\/writing\/[a-z0-9/-]+$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    if (url.hostname === 'www.youtube.com' && url.pathname === '/watch') {
      const id = url.searchParams.get('v');
      return /^[\w-]{11}$/.test(id || '') ? `https://www.youtube.com/watch?v=${id}` : '';
    }
    if (!['abvcreative.medium.com', 'medium.com', 'abvx.substack.com'].includes(url.hostname)) return '';
    return `${url.origin}${url.pathname}`;
  } catch { return ''; }
}

export function validateWritingDiscovery(data, now = Date.now()) {
  if (data?.version !== 1 || !Array.isArray(data.items)) return ['Invalid Writing discovery registry'];
  const errors = [];
  const seen = new Set();
  for (const item of data.items) {
    if (!item || typeof item !== 'object') { errors.push('Invalid Writing record'); continue; }
    const key = writingUrlKey(item.url);
    const time = Date.parse(item.addedAt);
    if (!key || seen.has(key)) errors.push(`Invalid or duplicate Writing URL: ${item.url}`);
    seen.add(key);
    if (!Number.isFinite(time) || !/^\d{4}-\d{2}-\d{2}T/.test(item.addedAt)
      || new Date(time).toISOString() !== item.addedAt || time > now) errors.push(`Invalid addedAt: ${item.url}`);
    if (!sources.has(item.source) || !bases.has(item.addedAtBasis) || typeof item.title !== 'string' || !item.title.trim()
      || !Number.isFinite(Date.parse(item.publishedAt))) errors.push(`Invalid Writing metadata: ${item.url}`);
    const local = key.startsWith('/');
    if (!local && item.source !== 'youtube') {
      const host = key ? new URL(key).hostname : '';
      if (item.source === 'substack' ? host !== 'abvx.substack.com'
        : !['abvcreative.medium.com', 'medium.com'].includes(host)) errors.push(`Writing host does not match source: ${item.url}`);
    }
    if (local ? !['abvx', 'youtube'].includes(item.source)
      : item.source === 'abvx' || (item.source === 'youtube') !== key.startsWith('https://www.youtube.com/')) {
      errors.push(`Writing source does not match URL: ${item.url}`);
    }
  }
  return errors;
}

// First registration is immutable. Edits, feed outages and rebuilds never renew it.
export function registerWritingItems(registry, items, { now = new Date().toISOString(), bootstrap = false } = {}) {
  const errors = validateWritingDiscovery(registry, Date.parse(now));
  if (errors.length) throw new Error(errors.join('\n'));
  const records = new Map(registry.items.map(item => [writingUrlKey(item.url), item]));
  for (const item of items) {
    const key = writingUrlKey(item.url);
    if (!key || !sources.has(item.source) || typeof item.title !== 'string' || !item.title.trim() || !Number.isFinite(Date.parse(item.publishedAt))) continue;
    const existing = records.get(key);
    const published = new Date(item.publishedAt).toISOString();
    if (Date.parse(published) > Date.parse(now)) continue;
    records.set(key, {
      source: item.source, title: item.title, url: key, publishedAt: published,
      ...(item.excerpt ? { excerpt: item.excerpt } : {}),
      ...(item.coverImage ? { coverImage: item.coverImage } : {}),
      ...(item.videoUrl ? { videoUrl: item.videoUrl } : {}),
      addedAt: existing?.addedAt || (bootstrap ? published : now),
      addedAtBasis: existing?.addedAtBasis || (bootstrap ? 'legacy-source' : 'observed'),
    });
  }
  return { version: 1, items: [...records.values()].sort((a, b) => a.url.localeCompare(b.url)) };
}

export function mergeWritingItems(native, registry) {
  const dates = new Map(registry.items.map(item => [writingUrlKey(item.url), item]));
  const videos = new Set(native.map(item => writingUrlKey(item.videoUrl)).filter(Boolean));
  const external = registry.items.filter(item => !item.url.startsWith('/') && !videos.has(writingUrlKey(item.url)));
  return sortWritingItems([...native.map(item => ({
    ...item, addedAt: dates.get(writingUrlKey(item.url))?.addedAt || item.publishedAt,
  })), ...external]);
}

export function sortWritingItems(items) {
  return [...items].sort((a, b) =>
    (Date.parse(b.addedAt || b.publishedAt) || 0) - (Date.parse(a.addedAt || a.publishedAt) || 0)
    || (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0)
    || a.url.localeCompare(b.url));
}

export function writingCardSource(item) {
  // A native video companion opens its authored ABVX watch page.
  if (item.url.startsWith('/')) return item.videoUrl
    ? { label: 'YouTube / ABVX', cta: 'Watch on ABVX' }
    : { label: 'ABVX', cta: 'Read on ABVX' };
  return {
    medium: { label: 'Medium', cta: 'Read on Medium' },
    substack: { label: 'Substack', cta: 'Read on Substack' },
    youtube: { label: 'YouTube', cta: 'Watch on YouTube' },
  }[item.source] || { label: 'ABVX', cta: 'Read on ABVX' };
}
