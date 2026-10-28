import { cache } from 'react';
import { readBookFiles, readNativeWritingFiles, readSeriesFiles, readWorkFiles } from './file-loader';
import { selectLatestSectionEntry } from './latest-selection.mjs';
import { withCatalogueTimes } from './catalogue-chronology.mjs';
import catalogueDiscovery from '../../content/catalogue-discovery.json';
import type { Artifact, Book, NativeWriting, Series, SiteSection } from './types';

type RelatedSource = Artifact | Book | Series;

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

function seriesAsBooks(seriesItems: Series[]): Book[] {
  return seriesItems.map((series) => ({
    ...series,
    coverImage: series.media,
    heroImage: series.heroImage,
  }));
}

// Shared selectors for bundled and request-local live catalogues.
export function createContentAccess(readers = {readBookFiles, readWorkFiles, readSeriesFiles, readNativeWritingFiles}, chronology = catalogueDiscovery) {
 const {readBookFiles, readWorkFiles, readSeriesFiles, readNativeWritingFiles} = readers;
const getArtifacts = cache(function getArtifacts(): Artifact[] {
  return readWorkFiles().sort(byPublicOrder);
});

function getArtifactsBySection(section: SiteSection): Artifact[] {
  return getArtifacts().filter((artifact) => appearsInSection(artifact, section));
}

function getFeaturedArtifacts(section?: SiteSection): Artifact[] {
  const source = section ? getArtifactsBySection(section) : getArtifacts();
  return source.filter((artifact) => artifact.featured);
}

function getLatestArtifact(section: SiteSection): Artifact | undefined {
  return [...getArtifactsBySection(section)].sort(byLatest)[0];
}

const getBooks = cache(function getBooks(): Book[] {
  return [...readBookFiles(), ...seriesAsBooks(readSeriesFiles())].sort(byPublicOrder);
});

function getBooksBySection(section: SiteSection): Book[] {
  return getBooks().filter((book) => appearsInSection(book, section));
}

function getLatestBook(): Book | undefined {
  return getBooks().filter((book) => book.type !== 'series').sort(byLatest)[0];
}

function getLatestHomepageBook(): Book | undefined {
  return getBooks()
    .filter((book) => book.type !== 'series')
    .filter(isHomepageEligible)
    .sort(byHomepagePublished)[0];
}

function getLatestSectionEntryBook(section: SiteSection): Book | undefined {
  const items = getBooksBySection(section)
    .filter((book) => book.type !== 'series')
    .filter((book) => book.primarySection === section);
  return selectLatestSectionEntry(withCatalogueTimes(items, 'books', chronology), section) as Book | undefined;
}

function getBookBySlug(slug: string): Book | undefined {
  return getBooks().find((book) => book.slug === slug);
}

function getArtifactBySlug(slug: string): Artifact | undefined {
  return getArtifacts().find((artifact) => artifact.slug === slug);
}

function getFeaturedBooks(): Book[] {
  return getBooks().filter((book) => book.featured);
}

function getBooksBySeries(series: string): Book[] {
  return getBooks().filter((book) => book.series === series);
}

function getBooksByGroup(group: string): Book[] {
  return getBooks().filter((book) => book.group === group || book.category === group);
}

function getWorkItems(): Artifact[] {
  return getArtifacts();
}

function getWorkBySlug(slug: string): Artifact | undefined {
  return getArtifactBySlug(slug);
}

function getWorkBySection(section: SiteSection): Artifact[] {
  return getArtifactsBySection(section);
}

function getLatestWork(section?: SiteSection): Artifact | undefined {
  const source = section ? getArtifactsBySection(section) : getArtifacts();
  return [...source].sort(byLatest)[0];
}

function getLatestHomepageWork(section: SiteSection, excludedSlug?: string): Artifact | undefined {
  return getArtifactsBySection(section)
    .filter((artifact) => artifact.slug !== excludedSlug)
    .filter((artifact) => artifact.primarySection === section)
    .filter(isHomepageEligible)
    .sort(byHomepagePublished)[0];
}

function getLatestSectionEntryWork(section: SiteSection, excludedSlug?: string): Artifact | undefined {
  return selectLatestSectionEntry(withCatalogueTimes(getArtifactsBySection(section), 'work', chronology), section, excludedSlug) as Artifact | undefined;
}

function getFeaturedWork(section?: SiteSection): Artifact[] {
  return getFeaturedArtifacts(section);
}

function getWorkByGroup(group: string): Artifact[] {
  return getArtifacts().filter((artifact) => artifact.group === group);
}

const getSeries = cache(function getSeries(): Series[] {
  return readSeriesFiles().sort(byPublicOrder);
});

function getSeriesBySlug(slug: string): Series | undefined {
  return getSeries().find((series) => series.slug === slug);
}

const getNativeWritingItems = cache(function getNativeWritingItems(): NativeWriting[] {
  return readNativeWritingFiles().sort(byLatest);
});

function getNativeWritingBySlug(slug: string): NativeWriting | undefined {
  return getNativeWritingItems().find((item) => item.slug === slug);
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

function getRelatedItems(item: RelatedSource, limit = 6): RelatedSource[] {
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

function getContentReviewReport() {
  const items = [...getArtifacts(), ...getBooks(), ...getSeries(), ...getNativeWritingItems()];
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

 return {getArtifacts, getArtifactsBySection, getFeaturedArtifacts, getLatestArtifact, getBooks, getBooksBySection, getLatestBook, getLatestHomepageBook, getLatestSectionEntryBook, getBookBySlug, getArtifactBySlug, getFeaturedBooks, getBooksBySeries, getBooksByGroup, getWorkItems, getWorkBySlug, getWorkBySection, getLatestWork, getLatestHomepageWork, getLatestSectionEntryWork, getFeaturedWork, getWorkByGroup, getSeries, getSeriesBySlug, getNativeWritingItems, getNativeWritingBySlug, getRelatedItems, getContentReviewReport};
}
export const {getArtifacts, getArtifactsBySection, getFeaturedArtifacts, getLatestArtifact, getBooks, getBooksBySection, getLatestBook, getLatestHomepageBook, getLatestSectionEntryBook, getBookBySlug, getArtifactBySlug, getFeaturedBooks, getBooksBySeries, getBooksByGroup, getWorkItems, getWorkBySlug, getWorkBySection, getLatestWork, getLatestHomepageWork, getLatestSectionEntryWork, getFeaturedWork, getWorkByGroup, getSeries, getSeriesBySlug, getNativeWritingItems, getNativeWritingBySlug, getRelatedItems, getContentReviewReport} = createContentAccess();

export type {
  Artifact,
  ArtifactType,
  Book,
  BookType,
  ContentFaq,
  ContentImage,
  ContentLink,
  ContentLinkType,
  MediaRole,
  Series,
  SiteSection,
  Status,
  Visibility,
  NativeWriting,
} from './types';
