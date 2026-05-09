import { artifacts } from './artifacts';
import { books } from './books';
import type { Artifact, Book, SiteSection } from './types';

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

function appearsInSection(item: { primarySection: SiteSection; appearsIn: SiteSection[] }, section: SiteSection) {
  return item.primarySection === section || item.appearsIn.includes(section);
}

export function getArtifacts(): Artifact[] {
  return [...artifacts].sort(byRankThenTitle);
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
  return [...books].sort(byRankThenTitle);
}

export function getBooksBySection(section: SiteSection): Book[] {
  return getBooks().filter((book) => appearsInSection(book, section));
}

export function getLatestBook(): Book | undefined {
  return [...books].sort(byLatest)[0];
}

export function getBookBySlug(slug: string): Book | undefined {
  return books.find((book) => book.slug === slug);
}

export function getArtifactBySlug(slug: string): Artifact | undefined {
  return artifacts.find((artifact) => artifact.slug === slug);
}

export type { Artifact, ArtifactType, Book, BookType, ContentLink, SiteSection, Status } from './types';
