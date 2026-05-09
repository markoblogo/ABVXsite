import BookCard from '@/components/BookCard';
import PageHeader from '@/components/PageHeader';
import SectionPanel from '@/components/SectionPanel';
import { getBooks, type BookType } from '@/content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ABVX Press',
  description:
    'Books, translations, series and publishing projects across AI, strategy, language, culture, markets and systems thinking.',
  alternates: { canonical: 'https://abvx.xyz/books' },
};

const typeLabels: Record<BookType, string> = {
  book: 'Books',
  series: 'Series',
  translation: 'Translations',
  'free-edition': 'Free editions',
  companion: 'Companions',
};

export default function BooksPage() {
  const books = getBooks();
  const grouped = books.reduce<Partial<Record<BookType, typeof books>>>((acc, book) => {
    acc[book.type] ||= [];
    acc[book.type]?.push(book);
    return acc;
  }, {});

  return (
    <div className="route-books grid gap-8">
      <PageHeader
        eyebrow="ABVX Press"
        title="ABVX Press"
        summary="Books, translations, series and publishing projects across AI, strategy, language, culture, markets and systems thinking."
      />

      <SectionPanel title="Publishing as infrastructure" eyebrow="Press">
        <p>
          The press layer collects books, translations, companion pages, free
          editions and series. Some items also appear in Systems or Focus when
          they support a technical or market-infrastructure thread.
        </p>
      </SectionPanel>

      <section className="grid gap-4 md:grid-cols-2">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </section>

      <section className="home-section" aria-labelledby="book-groups-title">
        <div className="home-section__header">
          <div className="eyebrow">Grouped by form</div>
          <h2 id="book-groups-title">Books, series, translations, companions.</h2>
        </div>
        <div className="grid gap-6">
          {Object.entries(grouped).map(([type, items]) => (
            <section key={type} className="grid gap-3">
              <h3 className="group-title">{typeLabels[type as BookType]}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {items?.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
