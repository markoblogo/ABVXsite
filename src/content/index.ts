import { artifacts as fallbackArtifacts } from './artifacts';
import { books as fallbackBooks } from './books';
import { readBookFiles, readHiddenSlugs, readSeriesFiles, readWorkFiles } from './file-loader';
import type { Artifact, Book, Series, SiteSection } from './types';

type RelatedSource = Artifact | Book | Series;

const artifacts = fallbackArtifacts as Artifact[];
const books = fallbackBooks as Book[];

function byRankThenTitle<T extends { sortRank: number; title: string }>(a: T, b: T): number {
  if (a.sortRank !== b.sortRank) return a.sortRank - b.sortRank;
  return a.title.localeCompare(b.title);
}

function dateValue(item: { updatedAt?: string; publishedAt?: string }): number {
  const value = item.updatedAt || item.publishedAt;
  if (!value) return 0;
  const time = new Date(value).valueOf();
  return Number.isFinite(time) ? time : 0;
}

function byLatest<T extends { updatedAt?: string; publishedAt?: string; sortRank: number; title: string }>(
  a: T,
  b: T,
): number {
  const diff = dateValue(b) - dateValue(a);
  if (diff) return diff;
  return byRankThenTitle(a, b);
}

function publishedDateValue(item: { publishedAt?: string }): number {
  if (!item.publishedAt) return 0;
  const time = new Date(item.publishedAt).valueOf();
  return Number.isFinite(time) ? time : 0;
}

function byHomepagePublished<T extends { publishedAt?: string; sortRank: number; title: string }>(a: T, b: T): number {
  const diff = publishedDateValue(b) - publishedDateValue(a);
  if (diff) return diff;
  if (a.sortRank !== b.sortRank) return a.sortRank - b.sortRank;
  return a.title.localeCompare(b.title);
}

function isHomepageEligible<T extends { homepageEligible?: boolean; publishedAt?: string }>(item: T): boolean {
  return item.homepageEligible === true && publishedDateValue(item) > 0;
}

function appearsInSection(item: { primarySection: SiteSection; appearsIn: SiteSection[] }, section: SiteSection) {
  return item.primarySection === section || item.appearsIn.includes(section);
}

function byPublicOrder<T extends { featured: boolean; sortRank: number; title: string; updatedAt?: string; publishedAt?: string }>(
  a: T,
  b: T,
): number {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (a.sortRank !== b.sortRank) return a.sortRank - b.sortRank;
  const diff = dateValue(b) - dateValue(a);
  if (diff) return diff;
  return a.title.localeCompare(b.title);
}

function mergeBySlug<T extends { slug: string }>(fallback: T[], files: T[]): T[] {
  const bySlug = new Map<string, T>();
  fallback.forEach((item) => bySlug.set(item.slug, item));
  files.forEach((item) => bySlug.set(item.slug, item));
  return [...bySlug.values()];
}

function removeHiddenFallback<T extends { slug: string }>(items: T[], hiddenSlugs: Set<string>): T[] {
  return items.filter((item) => !hiddenSlugs.has(item.slug));
}

function seriesAsBooks(seriesItems: Series[]): Book[] {
  return seriesItems.map((series) => ({
    ...series,
    coverImage: series.media,
    heroImage: series.heroImage,
  }));
}

export function getArtifacts(): Artifact[] {
  return mergeBySlug(removeHiddenFallback(artifacts, readHiddenSlugs('work')), readWorkFiles()).sort(byPublicOrder);
}

export function getArtifactsBySection(section: SiteSection): Artifact[] {
  return getArtifacts().filter((artifact) => appearsInSection(artifact, section));
}

export function getFeaturedArtifacts(section?: SiteSection): Artifact[] {
  const source = section ? getArtifactsBySection(section) : getArtifacts();
  return source.filter((artifact) => artifact.featured);
}

export function getLatestArtifact(section: SiteSection): Artifact | undefined {
  return [...getArtifactsBySection(section)].sort(byLatest)[0];
}

export function getBooks(): Book[] {
  const hiddenSlugs = new Set([...readHiddenSlugs('books'), ...readHiddenSlugs('series')]);
  return mergeBySlug(removeHiddenFallback(books, hiddenSlugs), [...readBookFiles(), ...seriesAsBooks(readSeriesFiles())]).sort(byPublicOrder);
}

export function getBooksBySection(section: SiteSection): Book[] {
  return getBooks().filter((book) => appearsInSection(book, section));
}

export function getLatestBook(): Book | undefined {
  return getBooks().filter((book) => book.type !== 'series').sort(byLatest)[0];
}

export function getLatestHomepageBook(): Book | undefined {
  return getBooks()
    .filter((book) => book.type !== 'series')
    .filter(isHomepageEligible)
    .sort(byHomepagePublished)[0];
}

export function getBookBySlug(slug: string): Book | undefined {
  return getBooks().find((book) => book.slug === slug);
}

export function getArtifactBySlug(slug: string): Artifact | undefined {
  return getArtifacts().find((artifact) => artifact.slug === slug);
}

export function getFeaturedBooks(): Book[] {
  return getBooks().filter((book) => book.featured);
}

export function getBooksBySeries(series: string): Book[] {
  return getBooks().filter((book) => book.series === series);
}

export function getBooksByGroup(group: string): Book[] {
  return getBooks().filter((book) => book.group === group || book.category === group);
}

export function getWorkItems(): Artifact[] {
  return getArtifacts();
}

export function getWorkBySlug(slug: string): Artifact | undefined {
  return getArtifactBySlug(slug);
}

export function getWorkBySection(section: SiteSection): Artifact[] {
  return getArtifactsBySection(section);
}

export function getLatestWork(section?: SiteSection): Artifact | undefined {
  const source = section ? getArtifactsBySection(section) : getArtifacts();
  return [...source].sort(byLatest)[0];
}

export function getLatestHomepageWork(section: SiteSection, excludedSlug?: string): Artifact | undefined {
  return getArtifactsBySection(section)
    .filter((artifact) => artifact.slug !== excludedSlug)
    .filter((artifact) => artifact.primarySection === section)
    .filter(isHomepageEligible)
    .sort(byHomepagePublished)[0];
}

export function getFeaturedWork(section?: SiteSection): Artifact[] {
  return getFeaturedArtifacts(section);
}

export function getWorkByGroup(group: string): Artifact[] {
  return getArtifacts().filter((artifact) => artifact.group === group);
}

export function getSeries(): Series[] {
  return readSeriesFiles().sort(byPublicOrder);
}

export function getSeriesBySlug(slug: string): Series | undefined {
  return getSeries().find((series) => series.slug === slug);
}

function relatedScore(source: RelatedSource, candidate: RelatedSource): number {
  if (source.slug === candidate.slug) return 0;
  let score = candidate.tags.filter((tag) => source.tags.includes(tag)).length * 8;
  if (source.relatedSlugs?.includes(candidate.slug) || candidate.relatedSlugs?.includes(source.slug)) score += 90;
  if ('series' in source && 'series' in candidate && source.series && source.series === candidate.series) score += 60;
  if ('group' in source && 'group' in candidate && source.group && source.group === candidate.group) score += 45;
  if (candidate.appearsIn.some((section) => source.appearsIn.includes(section))) score += 14;
  if (candidate.primarySection === source.primarySection) score += 10;
  return score;
}

export function getRelatedItems(item: RelatedSource, limit = 6): RelatedSource[] {
  return [...getArtifacts(), ...getBooks()]
    .map((candidate) => ({ candidate, score: relatedScore(item, candidate) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.candidate.sortRank - b.candidate.sortRank;
    })
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export function getContentReviewReport() {
  const items = [...getArtifacts(), ...getBooks(), ...getSeries()];
  return {
    needsCopyReview: items.filter((item) => item.needsCopyReview || item.needsReview),
    needsMediaReview: items.filter(
      (item) => item.needsMediaReview || ('mediaNeedsReview' in item && item.mediaNeedsReview),
    ),
    needsLinkReview: items.filter((item) => item.needsLinkReview),
    missingBody: items.filter((item) => !item.description),
    missingMedia: items.filter((item) => {
      if ('thumbnail' in item || 'coverImage' in item || 'media' in item) {
        return !('thumbnail' in item && item.thumbnail) && !('coverImage' in item && item.coverImage) && !('media' in item && item.media);
      }
      return true;
    }),
  };
}

export type {
  Artifact,
  ArtifactType,
  Book,
  BookType,
  ContentImage,
  ContentLink,
  ContentLinkType,
  MediaRole,
  Series,
  SiteSection,
  Status,
  Visibility,
} from './types';
