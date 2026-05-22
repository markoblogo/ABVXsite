import type { Artifact, Book, ContentImage, ContentLink } from '@/content';
import BookActionLinks from './BookActionLinks';
import MediaPanel from './MediaPanel';
import TagList from './TagList';
import Link from 'next/link';

type RelatedItem =
  | { kind: 'book'; item: Book }
  | { kind: 'artifact'; item: Artifact };

function isBookItem(item: RelatedItem): item is { kind: 'book'; item: Book } {
  return item.kind === 'book';
}

export default function BookRelatedCard({
  related,
  imageOverride,
}: {
  related: RelatedItem;
  imageOverride?: ContentImage;
}) {
  const isBook = isBookItem(related);
  const title = isBook
    ? related.item.displayTitle || related.item.shortTitle || related.item.title
    : related.item.title;
  const href = isBook ? `/books/${related.item.slug}` : `/work/${related.item.slug}`;
  const image: ContentImage | undefined = imageOverride || (isBook
    ? related.item.coverImage || related.item.heroImage
    : related.item.thumbnail || related.item.heroImage);
  const links: ContentLink[] = related.item.links;
  const meta = isBook
    ? related.item.series || related.item.category || related.item.type
    : related.item.group || related.item.type;
  const variant = isBook ? 'book' : 'project';

  return (
    <article className="book-related-card" data-kind={related.kind} data-media-role={image?.mediaRole || 'generic-thumbnail'}>
      {image ? (
        <Link className="book-related-card__media" href={href} aria-label={title}>
          <MediaPanel image={image} title={title} variant={variant} />
        </Link>
      ) : null}
      <div className="book-related-card__body">
        <div className="catalogue-card__meta">{meta}</div>
        <h3>
          <Link href={href}>{title}</Link>
        </h3>
        <p>{related.item.summary}</p>
        <TagList tags={related.item.tags.slice(0, 4)} />
        <BookActionLinks links={links.slice(0, 4)} compact />
      </div>
    </article>
  );
}
