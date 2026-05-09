import BookCatalogueCard from '@/components/BookCatalogueCard';
import CompanionCatalogueCard from '@/components/CompanionCatalogueCard';
import PageHeader from '@/components/PageHeader';
import SectionPanel from '@/components/SectionPanel';
import ActionLinks from '@/components/ActionLinks';
import TagList from '@/components/TagList';
import { getArtifactsBySection, getBooks, getSeries } from '@/content';
import type { Artifact, Book, Series } from '@/content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ABVX Press',
  description:
    'Books, translations, series and publishing projects across AI, strategy, language, culture, markets and systems thinking.',
  alternates: { canonical: 'https://abvx.xyz/books' },
};

const officialSeriesSlugs = [
  'modernisme-ukrainien',
  'chinese-wisdom-toki-pona',
  'stoic-wisdom-toki-pona',
  'toki-pona-free-kits',
];

const standaloneGroups = [
  'Business, AI & Marketing',
  'Language, AI & Toki Pona',
  'Fiction',
];

function belongsToSeries(item: Book | Artifact, slug: string) {
  return item.primarySeriesSlug === slug || item.seriesSlugs?.includes(slug);
}

function SeriesLine({
  series,
  books,
  companions,
}: {
  series: Series;
  books: Book[];
  companions: Artifact[];
}) {
  return (
    <article className="section-panel grid gap-5">
      <div className="grid gap-3">
        <div className="eyebrow">Official publishing line</div>
        <h3>{series.title}</h3>
        <p>{series.summary}</p>
        <TagList tags={series.tags.slice(0, 6)} />
        <ActionLinks links={series.links} compact />
      </div>

      {books.length ? (
        <div className="grid gap-3">
          <div className="catalogue-card__meta">Books / resources</div>
          <div className="books-catalogue-grid">
            {books.map((book) => (
              <BookCatalogueCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      ) : null}

      {companions.length ? (
        <div className="grid gap-3">
          <div className="catalogue-card__meta">Companion systems</div>
          <div className="books-companion-grid">
            {companions.map((artifact) => (
              <CompanionCatalogueCard key={artifact.id} item={artifact} />
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function BooksPage() {
  const books = getBooks();
  const series = getSeries();
  const publishingArtifacts = getArtifactsBySection('books');
  const officialSeries = officialSeriesSlugs
    .map((slug) => series.find((item) => item.slug === slug))
    .filter((item): item is Series => Boolean(item));
  const bookItems = books.filter((book) => book.type !== 'series');
  const standaloneBooks = bookItems.filter((book) => !book.primarySeriesSlug);
  const publishingSystems = publishingArtifacts.filter(
    (artifact) =>
      artifact.group === 'Publishing systems & protocols' ||
      artifact.group === 'Business, AI & Marketing' ||
      artifact.tags.some((tag) => ['book-companion', 'publishing', 'translation'].includes(tag)),
  );

  return (
    <div className="route-books grid gap-8">
      <PageHeader
        eyebrow="ABVX Press"
        title="ABVX Press"
        summary="Books, translations, series and publishing projects across AI, strategy, language, culture, markets and systems thinking."
      />

      <SectionPanel title="Publishing as infrastructure" eyebrow="Press">
        <p>
          The press layer collects official publishing lines, standalone books,
          free resources and the companion systems that make those projects
          readable, visible and reusable. Some support systems also appear in
          Systems when they are technical projects in their own right.
        </p>
      </SectionPanel>

      <section className="home-section" aria-labelledby="book-series-title">
        <div className="home-section__header">
          <div className="eyebrow">Official lines</div>
          <h2 id="book-series-title">Official publishing lines.</h2>
        </div>
        <div className="grid gap-6">
          {officialSeries.map((line) => (
            <SeriesLine
              key={line.id}
              series={line}
              books={bookItems.filter((book) => belongsToSeries(book, line.slug))}
              companions={publishingArtifacts.filter((artifact) => belongsToSeries(artifact, line.slug))}
            />
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="books-title">
        <div className="home-section__header">
          <div className="eyebrow">Standalone</div>
          <h2 id="books-title">Standalone books.</h2>
        </div>
        {standaloneGroups.map((group) => {
          const groupBooks = standaloneBooks.filter((book) => book.group === group);
          if (!groupBooks.length) return null;

          return (
            <div key={group} className="grid gap-4">
              <div className="catalogue-card__meta">{group}</div>
              <div className="books-catalogue-grid">
                {groupBooks.map((book) => (
                  <BookCatalogueCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {publishingSystems.length ? (
        <section className="home-section" aria-labelledby="book-companions-title">
          <div className="home-section__header">
            <div className="eyebrow">Systems</div>
            <h2 id="book-companions-title">Publishing systems & protocols.</h2>
          </div>
          <div className="books-companion-grid">
            {publishingSystems.map((artifact) => (
              <CompanionCatalogueCard key={artifact.id} item={artifact} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
