import BookCatalogueCard from '@/components/BookCatalogueCard';
import EditorialSectionLink from '@/components/EditorialSectionLink';
import CompanionCatalogueCard from '@/components/CompanionCatalogueCard';
import JsonLd from '@/components/JsonLd';
import MediaPanel from '@/components/MediaPanel';
import PageHeader from '@/components/PageHeader';
import SectionPanel from '@/components/SectionPanel';
import ActionLinks from '@/components/ActionLinks';
import TagList from '@/components/TagList';
import { getArtifactsBySection, getBooks, getSeries } from '@/content';
import { getEditorialArticles } from '@/content/editorials';
import type { EditorialArticle } from '@/content/editorials';
import type { Artifact, Book, Series } from '@/content';
import { artifactListItem, bookListItem, booksOgImage, collectionPageJsonLd, itemListJsonLd, metadataWithImage, SITE_URL } from '@/lib/seo';
import type { Metadata } from 'next';
import Link from 'next/link';

const booksDescription =
  'Books, translations, series and publishing projects across AI, strategy, language, culture, markets and systems thinking.';

export const metadata: Metadata = metadataWithImage({
  title: 'ABVX Press',
  description: booksDescription,
  canonicalPath: '/books',
  image: booksOgImage,
});

const officialSeriesSlugs = [
  'modernisme-ukrainien',
  'chinese-wisdom-toki-pona',
  'stoic-wisdom-toki-pona',
  'toki-pona-free-kits',
  'mn7r-commodity-brokerage-library',
  'good-dogs-of-the-apocalypse',
];

const editorialSlugsBySeries: Record<string, string[]> = {
  'modernisme-ukrainien': ['modernisme-ukrainien-en', 'modernisme-ukrainien-fr', 'modernisme-ukrainien-uk'],
  'chinese-wisdom-toki-pona': ['chinese-wisdom-in-toki-pona'],
  'stoic-wisdom-toki-pona': ['stoic-wisdom-in-toki-pona'],
  'toki-pona-free-kits': ['toki-pona-free-kits-translations'],
  'mn7r-commodity-brokerage-library': ['mn7r-commodity-brokerage-library-en', 'mn7r-commodity-brokerage-library-uk'],
};

const standaloneGroups = [
  {
    title: 'Business, AI & Marketing',
    description: 'Independent strategy, marketing, productivity and AI books outside the formal publishing series.',
    editorialSlugs: ['business-ai-marketing'],
  },
  {
    title: 'Language, AI & Toki Pona',
    description: 'Standalone books where language systems, Toki Pona and AI-native thinking become the main subject.',
    editorialSlugs: ['language-ai-toki-pona'],
  },
  {
    title: 'Practical Guides & Reference',
    description: 'Applied guides, visual references and decision tools for practical real-world situations.',
    editorialSlugs: ['practical-guides-reference-en', 'practical-guides-reference-uk'],
  },
  {
    title: 'Fiction',
    description: 'Original fiction and translations outside the non-fiction and classical translation lines.',
    editorialSlugs: ['fiction'],
  },
];

function belongsToSeries(item: Book | Artifact, slug: string) {
  return item.primarySeriesSlug === slug || item.seriesSlugs?.includes(slug);
}

function isBookItem(item: Book | Artifact): item is Book {
  return ['book', 'translation', 'free-book', 'free-edition', 'companion', 'series'].includes(item.type);
}

function itemLabel(item: Book | Artifact) {
  if (isBookItem(item)) {
    if (item.type === 'free-book' || item.type === 'free-edition' || item.type === 'companion') return 'FREE RESOURCE';
    return 'BOOK';
  }
  if (item.type === 'protocol') return 'PROTOCOL';
  if (item.type === 'plugin') return 'PLUGIN';
  if (item.type === 'tool') return 'TOOL';
  if (item.type === 'book-companion') return 'COMPANION SITE';
  return 'PROJECT';
}

function bookTone(book: Book): 'book' | 'free-resource' {
  return book.type === 'free-book' || book.type === 'free-edition' || book.type === 'companion' ? 'free-resource' : 'book';
}

function companionTone(item: Artifact): 'companion-project' | 'protocol-tool' {
  return item.type === 'protocol' || item.type === 'plugin' || item.type === 'tool' ? 'protocol-tool' : 'companion-project';
}

function seriesSortValue(item: Book | Artifact) {
  if (isBookItem(item)) {
    if (item.type === 'book' || item.type === 'translation') return 0;
    return 1000;
  }
  return 2000;
}

function SeriesLine({
  series,
  items,
  editorialArticles = [],
}: {
  series: Series;
  items: Array<{ kind: 'book'; item: Book } | { kind: 'artifact'; item: Artifact }>;
  editorialArticles?: EditorialArticle[];
}) {
  const bookCount = items.filter((entry) => entry.kind === 'book' && (entry.item.type === 'book' || entry.item.type === 'translation')).length;
  const freeCount = items.filter((entry) => entry.kind === 'book' && !(entry.item.type === 'book' || entry.item.type === 'translation')).length;
  const companionCount = items.filter((entry) => entry.kind === 'artifact').length;
  const image = series.heroImage || series.media;

  return (
    <article className="books-series-line">
      <div className={`books-series-line__top${image ? ' books-series-line__top--with-media' : ''}`}>
        <div className="books-series-line__header">
          <div className="eyebrow">Official publishing line</div>
          <h3>{series.canonicalPath ? <Link href={series.canonicalPath}>{series.title}</Link> : series.title}</h3>
          <p>{series.summary}</p>
          {series.description ? (
            <Link className="editorial-section-link" href={series.canonicalPath || `/books/${series.slug}`}>
              Series overview <span aria-hidden="true">→</span>
            </Link>
          ) : null}
          {editorialArticles.length ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
              {editorialArticles.map((article) => <EditorialSectionLink key={article.slug} article={article} />)}
            </div>
          ) : null}
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

        {image ? (
          <div className="books-series-line__media">
            <MediaPanel image={image} title={series.title} variant="project" />
          </div>
        ) : null}
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
  const editorialArticles = getEditorialArticles();
  const booksEditorial = editorialArticles.find((article) => article.section === 'books');
  const publishingArticle = editorialArticles.find((article) => article.slug === 'publishing-as-infrastructure');
  const publishingSystemsArticle = editorialArticles.find((article) => article.slug === 'publishing-systems-protocols');
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
      <JsonLd
        id="jsonld-books-page"
        data={collectionPageJsonLd({
          id: `${SITE_URL}/books#page`,
          name: 'ABVX Press',
          description: booksDescription,
          url: `${SITE_URL}/books`,
          image: booksOgImage,
        })}
      />
      <JsonLd
        id="jsonld-books-list"
        data={itemListJsonLd({
          id: `${SITE_URL}/books#items`,
          name: 'ABVX Press books, series and publishing systems',
          items: [
            ...officialSeries.map((line) => ({
              name: line.title,
              url: `${SITE_URL}${line.canonicalPath || `/books/${line.slug}`}`,
              type: 'CreativeWorkSeries',
              image: (line.heroImage || line.media)?.src ? `${SITE_URL}${(line.heroImage || line.media)!.src}` : undefined,
            })),
            ...bookItems.map(bookListItem),
            ...publishingSystems.map(artifactListItem),
          ],
        })}
      />
      <PageHeader
        eyebrow="ABVX Press"
        title="ABVX Press"
        summary="Books, translations, series and publishing projects across AI, strategy, language, culture, markets and systems thinking."
      ><EditorialSectionLink article={booksEditorial} /></PageHeader>

      <SectionPanel title="Publishing as infrastructure" eyebrow="Press">
        <p>
          The press layer collects official publishing lines, standalone books,
          free resources and the companion systems that make those projects
          readable, visible and reusable. Some support systems also appear in
          Systems when they are technical projects in their own right.
        </p>
        <EditorialSectionLink article={publishingArticle} />
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
              editorialArticles={(editorialSlugsBySeries[line.slug] || []).flatMap((slug) => {
                const article = editorialArticles.find((candidate) => candidate.slug === slug);
                return article ? [article] : [];
              })}
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
                  {group.title === 'Language, AI & Toki Pona' ? (
                    <Link href="/toki-pona" className="editorial-section-link">
                      Explore Toki Pona books and tools <span aria-hidden="true">→</span>
                    </Link>
                  ) : null}
                  {group.editorialSlugs?.length ? (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
                      {group.editorialSlugs.flatMap((slug) => {
                        const article = editorialArticles.find((candidate) => candidate.slug === slug);
                        return article ? [<EditorialSectionLink key={article.slug} article={article} />] : [];
                      })}
                    </div>
                  ) : null}
                </div>
                <div className="books-mixed-grid">
                  {groupBooks.map((book) => (
                    <BookCatalogueCard
                      key={book.id}
                      book={book}
                      tone={bookTone(book)}
                      variantLabel={itemLabel(book)}
                    />
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
            <EditorialSectionLink article={publishingSystemsArticle} />
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
