// Navigation only. Never reads or writes book membership, fragments or readiness state.
export const writingTopics = [
  { slug: 'psychology', label: 'Psychology', tags: ['psychology-notebook', 'psychology', 'psychoanalysis', 'consumer-psychology', 'marketing-psychology', 'consumer-behavior'] },
  { slug: 'kitchen-notes', label: 'Kitchen Notes', tags: ['cooking', 'cookbook', 'recipes'] },
  { slug: 'ai-technology', label: 'AI & Technology', tags: ['ai', 'artificial-intelligence', 'ai-agents', 'ai-research', 'ai-startup-funding', 'ai-video-production', 'ai-in-practice', 'machine-learning', 'software-engineering', 'digital-transformation', 'digital-innovation', 'ai-game-development', 'developer-tools', 'cooking-with-ai', 'ai-in-cooking', 'ai-cooking'] },
  { slug: 'business-work', label: 'Business & Work', tags: ['business-strategy', 'business-management', 'business-model-innovation', 'startups', 'entrepreneurship', 'ai-startup-funding', 'future-of-work', 'organizational-design', 'engineering-management', 'retail-analytics', 'marketing', 'management', 'b2b-marketing'] },
  { slug: 'other', label: 'Other', tags: [] },
];
const slugs = new Set(writingTopics.map(topic => topic.slug));
const tagKey = value => value.normalize('NFKC').trim().toLowerCase().replace(/\s+/gu, '-');

export function normalizeWritingTopic(value, source = 'abvx') {
  const topic = Array.isArray(value) ? value[0] : value;
  return source === 'abvx' && slugs.has(topic) ? topic : '';
}

export function navigationTopicErrors(data) {
  const topics = data.navigationTopics;
  return topics === undefined || (Array.isArray(topics) && topics.every(topic => slugs.has(topic))
    && new Set(topics).size === topics.length) ? [] : ['navigationTopics must be a unique array of supported Writing topic slugs'];
}

/** Explicit metadata (including []) overrides legacy tag/collection inference. */
export function writingTopicsFor(metadata) {
  if (metadata.navigationTopics !== undefined) {
    const selected = writingTopics.filter(topic => Array.isArray(metadata.navigationTopics) && metadata.navigationTopics.includes(topic.slug)).map(topic => topic.slug);
    return selected.length ? selected : ['other'];
  }
  const tags = new Set([...(metadata.tags || []), ...(metadata.topics || [])].map(tagKey));
  const selected = writingTopics.filter(topic =>
    (topic.slug === 'kitchen-notes' && metadata.collection === 'kitchen-notes')
    || (topic.slug === 'business-work' && metadata.type === 'working-story')
    || topic.tags.some(tag => tags.has(tag))).map(topic => topic.slug);
  // Legacy book-release notes describe publications, rather than topical essays.
  if (metadata.type === 'note' && (tags.has('books') || tags.has('new-book'))) return ['other'];
  return selected.length ? selected : ['other'];
}

/** Preserve feed order and identity; filter the full feed before windowing/search.
 * @template {{source: string, navigationTopics?: string[]}} T
 * @param {T[]} posts
 * @param {string} source
 * @param {string} value
 * @returns {T[]}
 */
export function filterWritingPosts(posts, source = 'all', value = '') {
  const topic = normalizeWritingTopic(value, source);
  return posts.filter(post => (source === 'all' || post.source === source)
    && (!topic || post.navigationTopics?.includes(topic)));
}
