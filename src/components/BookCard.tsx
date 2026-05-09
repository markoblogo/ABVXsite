import type { Book } from '@/content';
import BookCatalogueCard from './BookCatalogueCard';

export default function BookCard({ book }: { book: Book }) {
  return <BookCatalogueCard book={book} />;
}
