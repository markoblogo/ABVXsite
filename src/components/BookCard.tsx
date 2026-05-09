import type { Book } from '@/content';
import LatestCard from './LatestCard';
import TagList from './TagList';

export default function BookCard({ book }: { book: Book }) {
  const primaryLink = book.links[0]?.url;

  return (
    <article className="book-card">
      <LatestCard
        title={book.title}
        summary={book.summary}
        href={primaryLink}
        meta={`${book.type} / ${book.status}`}
      />
      <TagList tags={book.tags} />
    </article>
  );
}
