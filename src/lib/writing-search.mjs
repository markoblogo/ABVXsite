export function normalizeWritingQuery(value) {
  return (Array.isArray(value) ? value[0] : value)?.normalize('NFKC').replace(/\s+/gu, ' ').trim().slice(0, 200) || '';
}

function plainText(value = '') {
  // Code is visible literal text: do not strip its underscores, brackets or tags.
  return value.split(/(^```[\w-]*[ \t]*\r?\n[\s\S]*?^```[ \t]*$|`[^`\n]+`)/gm)
    .map((part, index) => {
      if (index % 2) return part.startsWith('```')
        ? part.replace(/^```[^\n]*\n/, '').replace(/\n```[ \t]*$/, '')
        : part.slice(1, -1);
      return part.replace(/!?\[([^\]]*)\]\([^)]+\)/g, '$1')
        .replace(/<[^>]*>/g, ' ').replace(/^[#>\s*-]+/gm, '')
        .replace(/\*\*(.+?)\*\*|__(.+?)__|\*([^*\n]+)\*/g, (_, bold, strong, italic) => bold || strong || italic)
        .replace(/(^|[^\p{L}\p{N}_])_([^\s](?:[^\n]*?[^\s])?)_(?=$|[^\p{L}\p{N}_])/gu, '$1$2');
    }).join('').replace(/\s+/gu, ' ').trim();
}

const normalized = (value) => value.normalize('NFKC').toLowerCase();

/**
 * Search only the already-public Writing feed supplied by the caller.
 * @template {{title: string, url: string, source: string, excerpt?: string, videoDescription?: string}} T
 * @param {T[]} posts
 * @param {string} query
 * @param {{source?: string, bodies?: Map<string, string>}} options
 * @returns {T[]}
 */
export function searchWritingPosts(posts, query, { source = 'all', bodies = new Map() } = {}) {
  const terms = normalized(normalizeWritingQuery(query)).split(' ').filter(Boolean);
  return posts.filter(post => {
    if (source !== 'all' && post.source !== source) return false;
    const text = normalized(plainText([post.title, post.excerpt, bodies.get(post.url), post.videoDescription].filter(Boolean).join(' ')));
    return terms.every(term => text.includes(term));
  });
}

/** Return a short visible-text context for a body match, without exposing markup. */
export function writingSearchExcerpt(post, body, query) {
  const text = plainText(body || post.videoDescription || post.excerpt || '');
  const terms = normalized(normalizeWritingQuery(query)).split(' ').filter(Boolean);
  const offsets = terms.map(term => normalized(text).indexOf(term)).filter(offset => offset >= 0);
  const start = offsets.length ? Math.max(0, Math.min(...offsets) - 80) : 0;
  return `${start ? '…' : ''}${text.slice(start, start + 300).trim()}${text.length > start + 300 ? '…' : ''}`;
}

export function writingSearchHref(source = 'all', query = '') {
  const params = new URLSearchParams();
  if (source !== 'all') params.set('source', source);
  if (query) params.set('q', normalizeWritingQuery(query));
  return `/writing${params.size ? `?${params}` : ''}`;
}
