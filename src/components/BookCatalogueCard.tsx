import type { Book } from '@/content';
import ActionLinks from './ActionLinks';
import MediaPanel from './MediaPanel';
import TagList from './TagList';
import Link from 'next/link';

export default function BookCatalogueCard({
  book,
  variantLabel,
  tone,
  mediaVariant,
  metaOverride,
}: {
  book: Book;
  variantLabel?: string;
  tone?: 'book' | 'free-resource';
  mediaVariant?: 'book' | 'landscape';
  metaOverride?: string;
}) {
  const title = book.displayTitle || book.shortTitle || book.title;
  const resolvedMediaVariant = mediaVariant || (book.coverImage?.role === 'mockup' ? 'landscape' : 'book');
  const mediaRole = book.coverImage?.mediaRole || 'mockup';

  return (
    <article
      className={`book-catalogue-card${tone ? ` book-catalogue-card--${tone}` : ''}${
        resolvedMediaVariant === 'landscape' ? ' book-catalogue-card--landscape' : ''
      }`}
      data-media-role={mediaRole}
    >
      <Link className="book-catalogue-card__cover-link" href={`/books/${book.slug}`} aria-label={title}>
        <MediaPanel image={book.coverImage} title={title} variant={resolvedMediaVariant === 'landscape' ? 'project' : 'book'} />
      </Link>
      <div className="catalogue-card__body">
        {variantLabel ? <div className="catalogue-type-label">{variantLabel}</div> : null}
        <div className="catalogue-card__meta">{metaOverride || book.series || book.category || book.type}</div>
        <h3>
          <Link href={`/books/${book.slug}`}>{title}</Link>
        </h3>
        {book.subtitle ? <p className="book-catalogue-card__subtitle">{book.subtitle}</p> : null}
        <p>{book.summary}</p>
        {book.description ? (
          <Link className="editorial-section-link" href={book.canonicalPath || `/books/${book.slug}`}>
            Book overview <span aria-hidden="true">→</span>
          </Link>
        ) : null}
        <TagList tags={book.tags.slice(0, 4)} />
        <ActionLinks links={book.links} limit={4} compact />
      </div>
    </article>
  );
}
