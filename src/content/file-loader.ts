import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type {
  Artifact,
  ArtifactType,
  Book,
  BookType,
  ContentImage,
  ContentFaq,
  ContentLink,
  ContentLinkType,
  RssFeedConfig,
  Series,
  SiteSection,
  Status,
  Visibility,
} from './types';

const rootDir = process.cwd();
const contentDir = path.join(rootDir, 'content');

type RawRecord = Record<string, unknown>;

type ParsedFile = {
  data: RawRecord;
  body: string;
};

const linkTypeMap: Record<string, ContentLinkType> = {
  site: 'site',
  website: 'site',
  blog: 'blog',
  github: 'github',
  demo: 'demo',
  youtube: 'youtube',
  amazon: 'amazon',
  kindle: 'kindle',
  'amazon-kindle': 'kindle',
  paperback: 'paperback',
  'amazon-paperback': 'paperback',
  pdf: 'pdf',
  epub: 'epub',
  audio: 'audio',
  audiobook: 'audiobook',
  series: 'series',
  'series-site': 'series',
  'book-site': 'site',
  bluesky: 'bluesky',
  bsky: 'bluesky',
  x: 'x',
  linkedin: 'linkedin',
  telegram: 'telegram',
  discord: 'discord',
  'youtube-channel': 'youtube-channel',
  medium: 'medium',
  substack: 'substack',
  rss: 'rss',
  deck: 'deck',
  other: 'other',
};

function safeContentUrl(value: string): string {
  if (value.startsWith('/')) return value;
  try {
    const url = new URL(value);
    if (['http:', 'https:', 'mailto:'].includes(url.protocol)) return url.toString();
  } catch {
    return '';
  }
  return '';
}

function parseMarkdownFile(source: string, filePath: string): ParsedFile {
  if (!source.startsWith('---')) {
    throw new Error(`Content file is missing frontmatter: ${filePath}`);
  }

  const end = source.indexOf('\n---', 3);
  if (end === -1) {
    throw new Error(`Content file has unterminated frontmatter: ${filePath}`);
  }

  const frontmatter = source.slice(3, end).trim();
  const body = source.slice(end + 4).replace(/^\s*\n/, '').trim();

  try {
    return { data: JSON.parse(frontmatter) as RawRecord, body };
  } catch (error) {
    throw new Error(`Content file has invalid JSON frontmatter: ${filePath}. ${(error as Error).message}`);
  }
}

function readMarkdownFiles(folder: string): ParsedFile[] {
  const dir = path.join(contentDir, folder);
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
    .map((file) => {
      const filePath = path.join(dir, file);
      return parseMarkdownFile(readFileSync(filePath, 'utf8'), filePath);
    });
}

export function readHiddenSlugs(folder: string): Set<string> {
  return new Set(
    readMarkdownFiles(folder)
      .filter((file) => !isVisible(file.data.visibility))
      .map((file) => stringValue(file.data.slug))
      .filter(Boolean),
  );
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length ? value : undefined;
}

function nullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return optionalString(value);
}

function booleanValue(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function numberValue(value: unknown, fallback = 999): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function visibilityFor(value: unknown): Visibility {
  return value === 'draft' || value === 'private' || value === 'public' ? value : 'public';
}

function isVisible(value: unknown): boolean {
  const visibility = visibilityFor(value);
  if (visibility === 'private') return false;
  if (visibility === 'draft' && process.env.NODE_ENV === 'production') return false;
  return true;
}

function normalizeImage(value: unknown): ContentImage | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as RawRecord;
  const src = stringValue(record.src);
  const alt = stringValue(record.alt);
  if (!src || !alt) return undefined;
  const role = optionalString(record.role) || optionalString(record.mediaRole);
  return {
    src,
    alt,
    ...(role ? { role: role as ContentImage['role'], mediaRole: role as ContentImage['mediaRole'] } : {}),
    ...(typeof record.width === 'number' ? { width: record.width } : {}),
    ...(typeof record.height === 'number' ? { height: record.height } : {}),
  };
}

function normalizeLinks(value: unknown): ContentLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is RawRecord => Boolean(item) && typeof item === 'object')
    .map((item) => {
      const rawType = stringValue(item.type, 'other');
      const type = linkTypeMap[rawType] || 'other';
      return {
        type,
        label: stringValue(item.label, type),
        url: safeContentUrl(stringValue(item.url)),
      };
    })
    .filter((link) => link.url);
}

function normalizeFaqs(value: unknown): ContentFaq[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is RawRecord => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      question: stringValue(item.question),
      answer: stringValue(item.answer),
    }))
    .filter((item) => item.question && item.answer);
}

function normalizeRssFeed(value: unknown): RssFeedConfig | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as RawRecord;
  const url = stringValue(record.url);
  if (!url) return undefined;
  return {
    enabled: booleanValue(record.enabled),
    url,
  };
}

function baseFields(data: RawRecord, body: string) {
  const description = body || optionalString(data.description);
  const needsReview = booleanValue(data.needsReview) ||
    booleanValue(data.needsCopyReview) ||
    booleanValue(data.needsMediaReview) ||
    booleanValue(data.needsLinkReview);

  return {
    id: stringValue(data.id, stringValue(data.slug)),
    slug: stringValue(data.slug),
    title: stringValue(data.title),
    shortTitle: optionalString(data.shortTitle),
    status: stringValue(data.status, 'archive') as Status,
    visibility: visibilityFor(data.visibility),
    publishedAt: optionalString(data.publishedAt),
    updatedAt: optionalString(data.updatedAt),
    homepageEligible: booleanValue(data.homepageEligible),
    summary: stringValue(data.summary),
    ...(description ? { description } : {}),
    tags: stringArray(data.tags),
    links: normalizeLinks(data.links),
    featured: booleanValue(data.featured),
    sortRank: numberValue(data.sortRank),
    needsReview,
    needsCopyReview: booleanValue(data.needsCopyReview),
    needsMediaReview: booleanValue(data.needsMediaReview),
    needsLinkReview: booleanValue(data.needsLinkReview),
    editorialNotes: optionalString(data.editorialNotes),
    mediaNeedsReview: booleanValue(data.needsMediaReview),
    relatedSlugs: stringArray(data.relatedSlugs),
    rssFeed: normalizeRssFeed(data.rssFeed),
    faqs: normalizeFaqs(data.faqs),
    primarySeriesSlug: optionalString(data.primarySeriesSlug),
    seriesSlugs: stringArray(data.seriesSlugs),
  };
}

export function readBookFiles(): Book[] {
  return readMarkdownFiles('books')
    .filter((file) => isVisible(file.data.visibility))
    .map(({ data, body }) => {
      const media = normalizeImage(data.media);
      return {
        ...baseFields(data, body),
        type: stringValue(data.type, 'book') as BookType,
        primarySection: 'books',
        appearsIn: stringArray(data.appearsIn).length ? stringArray(data.appearsIn) as SiteSection[] : ['books'],
        subtitle: optionalString(data.subtitle),
        displayTitle: optionalString(data.displayTitle),
        coverImage: media,
        heroImage: normalizeImage(data.heroImage),
        series: optionalString(data.series),
        group: optionalString(data.group),
        category: optionalString(data.group) || optionalString(data.category),
        formats: stringArray(data.formats),
        availableFormats: stringArray(data.availableFormats),
        language: optionalString(data.language),
        originalLanguage: optionalString(data.originalLanguage),
        editionRole: optionalString(data.editionRole),
        author: optionalString(data.author),
        translator: nullableString(data.translator),
        translationOf: nullableString(data.translationOf),
      };
    });
}

export function readWorkFiles(): Artifact[] {
  return readMarkdownFiles('work')
    .filter((file) => isVisible(file.data.visibility))
    .map(({ data, body }) => {
      const media = normalizeImage(data.media);
      const primarySection = stringValue(data.primarySection, 'systems') as SiteSection;
      return {
        ...baseFields(data, body),
        type: stringValue(data.type, 'web-service') as ArtifactType,
        primarySection,
        appearsIn: stringArray(data.appearsIn).length ? stringArray(data.appearsIn) as SiteSection[] : [primarySection],
        thumbnail: media,
        heroImage: normalizeImage(data.heroImage) || media,
        group: optionalString(data.group),
      };
    });
}

export function readSeriesFiles(): Series[] {
  return readMarkdownFiles('series')
    .filter((file) => isVisible(file.data.visibility))
    .map(({ data, body }) => {
      const media = normalizeImage(data.media);
      return {
        ...baseFields(data, body),
        type: 'series',
        primarySection: 'books',
        appearsIn: stringArray(data.appearsIn).length ? stringArray(data.appearsIn) as SiteSection[] : ['books'],
        media,
        heroImage: normalizeImage(data.heroImage),
        group: optionalString(data.group),
        series: optionalString(data.title),
        category: optionalString(data.group) || 'Series',
        formats: stringArray(data.formats),
        relatedSlugs: stringArray(data.relatedSlugs),
      };
    });
}
