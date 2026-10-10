import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { parseMarkdownSource } from './markdown-source.mjs';

/** @typedef {{src: string, alt: string, width: number, height: number}} StoryImage */
/** @typedef {StoryImage & {caption: string, afterHeading: string}} StoryIllustration */
/** @typedef {{title: string, slug: string, date: string, type: 'working-story', series: 'working-stories', story_id: string, cluster: string, period: string | null, topics: string[], book: {include: boolean, status: string}, visibility: string, summary: string, language: 'en' | 'fr' | 'uk', seoTitle?: string, seoDescription?: string, updatedAt?: string, source_session?: string, coverImage?: StoryImage, illustrations?: StoryIllustration[], caseStudy?: {label: string, url: string}, source: string, body: string}} WorkingStory */

const fields = new Set(['title', 'slug', 'date', 'type', 'series', 'story_id', 'cluster', 'period', 'topics', 'book', 'visibility', 'summary', 'language', 'seoTitle', 'seoDescription', 'updatedAt', 'source_session', 'coverImage', 'illustrations', 'caseStudy']);
const bookStatuses = new Set(['draft', 'selected', 'edited', 'final', 'excluded']);
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

/** Validate the source record before it enters a public page or a manuscript. */
export function validateWorkingStory(data, body) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ['frontmatter must be a JSON object'];
  const errors = [];
  for (const field of Object.keys(data)) if (!fields.has(field)) errors.push(`unsupported metadata field: ${field}`);
  if (!text(data.title)) errors.push('title must be a non-empty string');
  if (typeof data.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) errors.push('slug must be a lowercase URL slug');
  if (!validDate(data.date)) errors.push('date must be a real YYYY-MM-DD publication date');
  if (data.type !== 'working-story') errors.push('type must be working-story');
  if (data.series !== 'working-stories') errors.push('series must be working-stories');
  if (typeof data.story_id !== 'string' || !/^ws-\d{3,}$/.test(data.story_id)) errors.push('story_id must be a neutral ws-001-style identifier');
  if (typeof data.cluster !== 'string' || !/^project-\d{3,}$/.test(data.cluster)) errors.push('cluster must be a neutral project-001-style identifier');
  if (data.period !== null && !text(data.period)) errors.push('period must be a non-empty string or null when unknown');
  if (!Array.isArray(data.topics) || !data.topics.every(text)) errors.push('topics must be an array of non-empty strings');
  if (!data.book || typeof data.book !== 'object' || Array.isArray(data.book)) errors.push('book must be an object');
  else {
    if (data.book.include !== undefined && typeof data.book.include !== 'boolean') errors.push('book.include must be boolean');
    if (!bookStatuses.has(data.book.status)) errors.push('book.status must be draft, selected, edited, final, or excluded');
    for (const field of Object.keys(data.book)) if (!['include', 'status'].includes(field)) errors.push(`unsupported book field: ${field}`);
  }
  if (data.visibility !== undefined && !['public', 'draft', 'private'].includes(data.visibility)) errors.push('visibility must be public, draft, or private');
  if (data.summary !== undefined && !text(data.summary)) errors.push('summary must be a non-empty string when provided');
  for (const field of ['seoTitle', 'seoDescription']) {
    if (data[field] !== undefined && !text(data[field])) errors.push(`${field} must be a non-empty string when provided`);
  }
  if (data.language !== undefined && !['en', 'fr', 'uk'].includes(data.language)) errors.push('language must be en, fr, or uk');
  if (data.updatedAt !== undefined && (!validDate(data.updatedAt) || data.updatedAt < data.date)) errors.push('updatedAt must be a real date on or after date');
  if (data.source_session !== undefined && (typeof data.source_session !== 'string' || !/^session-\d{3,}$/.test(data.source_session))) errors.push('source_session must be a neutral session-001-style identifier');
  const checkImage = (image, field, illustration = false) => {
    if (!image || typeof image !== 'object' || Array.isArray(image)) { errors.push(`${field} must be an image object`); return; }
    const allowed = illustration ? ['src', 'alt', 'width', 'height', 'caption', 'afterHeading'] : ['src', 'alt', 'width', 'height'];
    for (const key of Object.keys(image)) if (!allowed.includes(key)) errors.push(`unsupported ${field} field: ${key}`);
    if (typeof image.src !== 'string' || !/^\/media\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g)$/.test(image.src)) errors.push(`${field}.src must be a local media image path`);
    if (!text(image.alt)) errors.push(`${field}.alt is required`);
    for (const dimension of ['width', 'height']) if (!Number.isInteger(image[dimension]) || image[dimension] <= 0) errors.push(`${field}.${dimension} must be a positive integer`);
    if (illustration) {
      if (!text(image.caption)) errors.push(`${field}.caption is required`);
      if (!text(image.afterHeading) || !body?.split('\n').includes(`## ${image.afterHeading}`)) errors.push(`${field}.afterHeading must match a story heading`);
    }
  };
  if (data.coverImage !== undefined) checkImage(data.coverImage, 'coverImage');
  if (data.illustrations !== undefined) {
    if (!Array.isArray(data.illustrations)) errors.push('illustrations must be an array');
    else data.illustrations.forEach((image, index) => checkImage(image, `illustrations[${index}]`, true));
  }
  if (data.caseStudy !== undefined) {
    if (!data.caseStudy || typeof data.caseStudy !== 'object' || Array.isArray(data.caseStudy)) errors.push('caseStudy must be an object');
    else {
      if (!text(data.caseStudy.label)) errors.push('caseStudy.label is required');
      try { if (new URL(data.caseStudy.url).protocol !== 'https:') throw new Error(); } catch { errors.push('caseStudy.url must be an HTTPS URL'); }
      for (const key of Object.keys(data.caseStudy)) if (!['label', 'url'].includes(key)) errors.push(`unsupported caseStudy field: ${key}`);
    }
  }
  if (!text(body)) errors.push('story body must not be empty');
  return errors;
}

/** @returns {WorkingStory[]} */
export function readWorkingStories(directory = path.join(process.cwd(), 'content', 'working-stories')) {
  if (!existsSync(directory)) return [];
  const ids = new Set();
  const slugs = new Set();
  return readdirSync(directory).filter((name) => name.endsWith('.md') && !name.startsWith('_')).sort().map((source) => {
    const filePath = path.join(directory, source);
    const { data, body } = parseMarkdownSource(readFileSync(filePath, 'utf8'), filePath);
    const errors = validateWorkingStory(data, body);
    if (errors.length) throw new Error(`${source}: ${errors.join('; ')}`);
    if (ids.has(data.story_id)) errors.push(`duplicate story_id: ${data.story_id}`);
    if (slugs.has(data.slug)) errors.push(`duplicate story slug: ${data.slug}`);
    if (errors.length) throw new Error(`${source}: ${errors.join('; ')}`);
    ids.add(data.story_id);
    slugs.add(data.slug);
    return {
      title: data.title, slug: data.slug, date: data.date, type: 'working-story', series: 'working-stories',
      story_id: data.story_id, cluster: data.cluster, period: data.period, topics: data.topics,
      book: { include: data.book.include ?? true, status: data.book.status },
      visibility: data.visibility ?? 'draft', summary: data.summary ?? data.title,
      language: data.language ?? 'en', ...(data.updatedAt ? { updatedAt: data.updatedAt } : {}),
      ...(data.seoTitle ? { seoTitle: data.seoTitle } : {}),
      ...(data.seoDescription ? { seoDescription: data.seoDescription } : {}),
      ...(data.source_session ? { source_session: data.source_session } : {}), source, body,
      ...(data.coverImage ? { coverImage: data.coverImage } : {}),
      ...(data.illustrations ? { illustrations: data.illustrations } : {}),
      ...(data.caseStudy ? { caseStudy: data.caseStudy } : {}),
    };
  });
}

export function compareWorkingStories(a, b) {
  const dateOrder = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  return dateOrder || (a.story_id < b.story_id ? -1 : a.story_id > b.story_id ? 1 : 0);
}

/** Public visibility is independent of internal book selection/editing status. */
/** @param {WorkingStory[]} stories */
export function publishedWorkingStories(stories, now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10);
  return stories.filter((story) => story.type === 'working-story' && story.visibility === 'public' && story.date <= today)
    .sort((a, b) => -compareWorkingStories(a, b));
}

/** Runtime publication follows the generated deployment index, never a moving clock. */
export function indexedWorkingStories(stories, index) {
  const urls = new Set(index.items.filter((item) => item.type === 'working-story').map((item) => item.canonicalUrl));
  return stories.filter((story) => story.type === 'working-story' && story.visibility === 'public'
    && urls.has(`https://abvx.xyz${workingStoryPath(story)}`)).sort((a, b) => -compareWorkingStories(a, b));
}

/** @param {WorkingStory[]} stories @param {{topic?: string, cluster?: string, sourceSession?: string}} query */
export function queryWorkingStories(stories, query = {}) {
  return stories.filter((story) =>
    (!query.topic || story.topics.includes(query.topic)) &&
    (!query.cluster || story.cluster === query.cluster) &&
    (!query.sourceSession || story.source_session === query.sourceSession));
}

/** Private IDs remain server-side; only public titles and URLs are projected below. */
/** @param {WorkingStory} story @param {WorkingStory[]} published */
export function relatedWorkingStories(story, published) {
  return published.filter((candidate) => candidate.cluster === story.cluster && candidate.story_id !== story.story_id)
    .sort((a, b) => -compareWorkingStories(a, b));
}

/** @param {WorkingStory} story */
export function workingStoryPath(story) {
  return `/writing/working-stories/${story.slug}`;
}

/** Allowlist public discovery fields rather than serializing source frontmatter. */
/** @param {WorkingStory} story @param {WorkingStory[]} published */
export function publicWorkingStory(story, published) {
  return {
    type: 'working-story', section: 'writing', ecosystem: 'Writing', group: 'Working Stories', status: 'published',
    title: story.title, summary: story.summary, language: story.language,
    canonicalUrl: `https://abvx.xyz${workingStoryPath(story)}`, tags: story.topics,
    publishedAt: story.date, updatedAt: story.updatedAt || story.date,
    ...(story.coverImage ? { image: `https://abvx.xyz${story.coverImage.src}` } : {}),
    links: [{ type: 'section', label: 'Working Stories', url: 'https://abvx.xyz/writing/working-stories' },
      ...(story.caseStudy ? [{ type: 'case-study', ...story.caseStudy }] : [])],
    related: relatedWorkingStories(story, published).map((candidate) => ({
      title: candidate.title, canonicalUrl: `https://abvx.xyz${workingStoryPath(candidate)}`, relation: 'same-project',
    })),
  };
}

/** Select manuscript material mechanically; public visibility is not a book gate. */
/** @param {WorkingStory[]} stories */
export function bookWorkingStories(stories) {
  return stories.filter((story) => story.type === 'working-story' && story.book?.include === true && story.book.status !== 'excluded')
    .sort(compareWorkingStories);
}

/** @param {WorkingStory[]} stories */
export function workingStoriesExport(stories) {
  const included = bookWorkingStories(stories);
  return {
    manuscript: `# Working Stories\n\n${included.map((story) => `## ${story.title}\n\n${story.body}`).join('\n\n---\n\n')}${included.length ? '\n' : ''}`,
    manifest: included.map((story) => ({
      story_id: story.story_id, title: story.title, date: story.date, cluster: story.cluster,
      period: story.period, topics: story.topics, book_status: story.book.status, source: story.source,
      ...(story.source_session ? { source_session: story.source_session } : {}),
    })),
  };
}
