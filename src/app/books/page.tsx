import ArtifactCard from '@/components/ArtifactCard';
import BookCard from '@/components/BookCard';
import PageHeader from '@/components/PageHeader';
import SectionPanel from '@/components/SectionPanel';
import { getArtifactsBySection, getBooks } from '@/content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ABVX Press',
  description:
    'Books, translations, series and publishing projects across AI, strategy, language, culture, markets and systems thinking.',
  alternates: { canonical: 'https://abvx.xyz/books' },
};

export default function BooksPage() {
  const books = getBooks();
  const publishingArtifacts = getArtifactsBySection('books');
  const featured = books.filter((book) => book.featured && book.type !== 'series');
  const series = books.filter((book) => book.type === 'series');
  const standardBooks = books.filter((book) => book.type === 'book' || book.type === 'translation');
  const companions = books.filter((book) => book.type === 'free-edition' || book.type === 'companion');

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

      {featured.length ? (
        <section className="home-section" aria-labelledby="featured-publishing-title">
          <div className="home-section__header">
            <div className="eyebrow">Featured publishing</div>
            <h2 id="featured-publishing-title">Current books and active lines.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="home-section" aria-labelledby="book-series-title">
        <div className="home-section__header">
          <div className="eyebrow">Series</div>
          <h2 id="book-series-title">Publishing lines and translation projects.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {series.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="books-title">
        <div className="home-section__header">
          <div className="eyebrow">Books</div>
          <h2 id="books-title">Books and translations.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {standardBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {companions.length || publishingArtifacts.length ? (
        <section className="home-section" aria-labelledby="book-companions-title">
          <div className="home-section__header">
            <div className="eyebrow">Free kits / companions</div>
            <h2 id="book-companions-title">Reader kits and publishing support.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {companions.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
            {publishingArtifacts.map((artifact) => (
              <ArtifactCard key={artifact.id} artifact={artifact} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
