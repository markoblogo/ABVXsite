import type { Book } from '@/content';
import LatestCard from './LatestCard';
import TagList from './TagList';

export default function BookCard({ book }: { book: Book }) {
  return (
    <article className="book-card">
      <LatestCard
        title={book.title}
        summary={book.summary}
        href={`/books/${book.slug}`}
        meta={`${book.type} / ${book.status}`}
      />
      <TagList tags={book.tags} />
    </article>
  );
}
