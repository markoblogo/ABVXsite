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
  {
    title: 'Business, AI & Marketing',
    description: 'Independent strategy, marketing, productivity and AI books outside the formal publishing series.',
  },
  {
    title: 'Language, AI & Toki Pona',
    description: 'Standalone books where language systems, Toki Pona and AI-native thinking become the main subject.',
  },
  {
    title: 'Fiction',
    description: 'Original fiction and translations outside the non-fiction and classical translation lines.',
  },
];

function belongsToSeries(item: Book | Artifact, slug: string) {
  return item.primarySeriesSlug === slug || item.seriesSlugs?.includes(slug);
}

function itemLabel(item: Book | Artifact) {
  if (item.primarySection === 'books') {
    if (item.type === 'free-edition' || item.type === 'companion') return 'FREE RESOURCE';
    return 'BOOK';
  }
  if (item.type === 'protocol') return 'PROTOCOL';
  if (item.type === 'tool') return 'TOOL';
  if (item.type === 'book-companion') return 'COMPANION SITE';
  return 'PROJECT';
}

function bookTone(book: Book): 'book' | 'free-resource' {
  return book.type === 'free-edition' || book.type === 'companion' ? 'free-resource' : 'book';
}

function companionTone(item: Artifact): 'companion-project' | 'protocol-tool' {
  return item.type === 'protocol' || item.type === 'tool' ? 'protocol-tool' : 'companion-project';
}

function seriesSortValue(item: Book | Artifact) {
  if (item.primarySection === 'books') {
    if (item.type === 'book' || item.type === 'translation') return 0;
    return 1000;
  }
  return 2000;
}

function SeriesLine({
  series,
  items,
}: {
  series: Series;
  items: Array<{ kind: 'book'; item: Book } | { kind: 'artifact'; item: Artifact }>;
}) {
  const bookCount = items.filter((entry) => entry.kind === 'book' && (entry.item.type === 'book' || entry.item.type === 'translation')).length;
  const freeCount = items.filter((entry) => entry.kind === 'book' && !(entry.item.type === 'book' || entry.item.type === 'translation')).length;
  const companionCount = items.filter((entry) => entry.kind === 'artifact').length;

  return (
    <article className="books-series-line">
      <div className="books-series-line__header">
        <div className="eyebrow">Official publishing line</div>
        <h3>{series.title}</h3>
        <p>{series.summary}</p>
        <div className="books-series-line__meta">
          <span>{bookCount} books</span>
          {freeCount ? <span>{freeCount} free resources</span> : null}
          {companionCount ? <span>{companionCount} companion systems</span> : null}
        </div>
        <div className="books-series-line__actions">
          <TagList tags={series.tags.slice(0, 5)} />
          <ActionLinks links={series.links} compact />
        </div>
      </div>

      <div className="books-mixed-grid">
        {items.map((entry) =>
          entry.kind === 'book' ? (
            <BookCatalogueCard
              key={entry.item.id}
              book={entry.item}
              tone={bookTone(entry.item)}
              variantLabel={itemLabel(entry.item)}
            />
          ) : (
            <CompanionCatalogueCard
              key={entry.item.id}
              item={entry.item}
              tone={companionTone(entry.item)}
              variantLabel={itemLabel(entry.item)}
            />
          ),
        )}
      </div>
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
    <div className="route-books route-books--structured grid gap-8">
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
              items={[
                ...bookItems
                  .filter((book) => belongsToSeries(book, line.slug))
                  .map((item) => ({ kind: 'book' as const, item })),
                ...publishingArtifacts
                  .filter((artifact) => belongsToSeries(artifact, line.slug))
                  .map((item) => ({ kind: 'artifact' as const, item })),
              ].sort((a, b) => {
                const rank = seriesSortValue(a.item) - seriesSortValue(b.item);
                if (rank) return rank;
                return a.item.sortRank - b.item.sortRank;
              })}
            />
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="books-title">
        <div className="home-section__header">
          <div className="eyebrow">Standalone</div>
          <h2 id="books-title">Standalone books.</h2>
        </div>
        <div className="grid gap-6">
          {standaloneGroups.map((group) => {
            const groupBooks = standaloneBooks.filter((book) => book.group === group.title);
            if (!groupBooks.length) return null;

            return (
              <section key={group.title} className="books-standalone-group">
                <div className="books-standalone-group__header">
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </div>
                <div className="books-mixed-grid">
                  {groupBooks.map((book) => (
                    <BookCatalogueCard key={book.id} book={book} tone="book" variantLabel="BOOK" />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      {publishingSystems.length ? (
        <section className="home-section" aria-labelledby="book-companions-title">
          <div className="home-section__header">
            <div className="eyebrow">Systems</div>
            <h2 id="book-companions-title">Publishing systems & protocols.</h2>
            <p>
              Tools, landing pages, protocols and language systems that support
              the publishing work: translation, reader kits, visual protocols,
              AI visibility and companion sites.
            </p>
          </div>
          <div className="books-mixed-grid">
            {publishingSystems.map((artifact) => (
              <CompanionCatalogueCard
                key={artifact.id}
                item={artifact}
                tone={companionTone(artifact)}
                variantLabel={itemLabel(artifact)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
