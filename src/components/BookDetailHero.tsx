import type { Book, ContentImage } from '@/content';
import BookActionLinks from './BookActionLinks';
import MediaPanel from './MediaPanel';
import TagList from './TagList';

function formatLabel(book: Book): string {
  return [book.series || book.category || book.type, book.status].filter(Boolean).join(' / ');
}

function formatFormats(formats?: string[]): string | undefined {
  if (!formats?.length) return undefined;
  const labels: Record<string, string> = {
    kindle: 'Kindle',
    paperback: 'paperback',
    pdf: 'PDF',
    epub: 'EPUB',
    'book-site': 'book site',
    'series-site': 'series site',
    'free-editions': 'free editions',
  };
  return formats.map((format) => labels[format] || format).join(', ');
}

export default function BookDetailHero({
  book,
  image,
}: {
  book: Book;
  image?: ContentImage;
}) {
  const title = book.displayTitle || book.shortTitle || book.title;
  const formats = formatFormats(book.formats);

  return (
    <header className="book-detail-hero">
      <div className="book-detail-hero__media">
        <MediaPanel image={image} title={title} variant="book" priority />
      </div>
      <div className="book-detail-hero__copy">
        <div className="eyebrow">{formatLabel(book)}</div>
        <h1>{title}</h1>
        {book.subtitle ? <p className="book-detail-hero__subtitle">{book.subtitle}</p> : null}
        <p className="book-detail-hero__summary">{book.summary}</p>
        <TagList tags={book.tags} />
        <BookActionLinks links={book.links} />
        {formats ? <p className="book-detail-hero__formats">Available formats: {formats}.</p> : null}
      </div>
    </header>
  );
}
