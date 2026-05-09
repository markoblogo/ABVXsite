import type { Book } from '@/content';
import LatestCard from './LatestCard';
import TagList from './TagList';

const linkLabels: Record<string, string> = {
  'amazon-kindle': 'Kindle',
  'amazon-paperback': 'Paperback',
  amazon: 'Amazon',
  pdf: 'PDF',
  'book-site': 'Site',
  'series-site': 'Series',
  youtube: 'YouTube',
  github: 'GitHub',
};

export default function BookCard({ book }: { book: Book }) {
  return (
    <article className="book-card">
      <LatestCard
        title={book.title}
        summary={book.summary}
        href={`/books/${book.slug}`}
        meta={`${book.series || book.category || book.type} / ${book.status}`}
        image={book.coverImage}
      />
      <TagList tags={book.tags} />
      {book.links.length ? (
        <div className="card-link-row">
          {book.links.slice(0, 4).map((link) => (
            <a key={`${link.type}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
              {linkLabels[link.type] || link.label}
            </a>
          ))}
        </div>
      ) : null}
    </article>
  );
}
