import type { Artifact, Book } from './types';

const reviewFields = [
  'needsReview',
  'needsCopyReview',
  'needsMediaReview',
  'needsLinkReview',
  'editorialNotes',
  'mediaNeedsReview',
] as const;

export function toPublicArtifact(item: Artifact): Artifact {
  const publicItem = { ...item } as Partial<Artifact>;
  reviewFields.forEach((field) => {
    delete publicItem[field];
  });
  return publicItem as Artifact;
}

export function toPublicBook(item: Book): Book {
  const publicItem = { ...item } as Partial<Book>;
  reviewFields.forEach((field) => {
    delete publicItem[field];
  });
  return publicItem as Book;
}
