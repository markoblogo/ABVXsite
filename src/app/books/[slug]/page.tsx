import BookActionLinks from '@/components/BookActionLinks';
import BookDetailHero from '@/components/BookDetailHero';
import BookRelatedCard from '@/components/BookRelatedCard';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import FAQSection from '@/components/FAQSection';
import JsonLd from '@/components/JsonLd';
import MarkdownContent from '@/components/MarkdownContent';
import MediaPanel from '@/components/MediaPanel';
import TagList from '@/components/TagList';
import { getArtifactsBySection, getBookBySlug, getBooks, type Artifact, type Book } from '@/content';
import {
  bookJsonLd,
  booksOgImage,
  breadcrumbJsonLd,
  faqPageJsonLd,
  imageMetadata,
  metadataWithImage,
  SITE_URL,
} from '@/lib/seo';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

export function generateStaticParams() {
  return getBooks().map((book) => ({ slug: book.slug }));
}

function youtubeEmbedUrl(url: string): string | undefined {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/);
  return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : undefined;
}

function formatFormats(formats?: string[]): string | undefined {
  if (!formats?.length) return undefined;
  const labels: Record<string, string> = {
    kindle: 'Kindle',
    paperback: 'paperback',
    pdf: 'PDF',
    'book-site': 'book site',
    'series-site': 'series site',
    'free-editions': 'free editions',
  };
  return formats.map((format) => labels[format] || format).join(', ');
}

function purchaseLinks(book: Book) {
  return book.links.filter((link) => ['amazon', 'kindle', 'paperback', 'pdf'].includes(link.type));
}

function renderLinks(links: Book['links']): ReactNode {
  return (
    <span className="book-context-links">
      {links.map((link, index) => (
        <span key={`${link.type}-${link.url}`}>
          {index > 0 ? ', ' : null}
          <a href={link.url} target="_blank" rel="noreferrer">
            {link.label || link.type}
          </a>
        </span>
      ))}
    </span>
  );
}

function renderBookLinks(books: Book[]): ReactNode {
  return (
    <span className="book-context-links">
      {books.map((item, index) => (
        <span key={item.slug}>
          {index > 0 ? ', ' : null}
          <Link href={`/books/${item.slug}`}>{item.shortTitle || item.title}</Link>
        </span>
      ))}
    </span>
  );
}

function tagOverlap(a: string[], b: string[]): number {
  return a.filter((tag) => b.includes(tag)).length;
}

function belongsToSeries(item: Book | Artifact, slug: string): boolean {
  return item.primarySeriesSlug === slug || item.seriesSlugs?.includes(slug) || false;
}

function sharesSeries(source: Book, candidate: Book | Artifact): boolean {
  const sourceSeries = new Set([source.primarySeriesSlug, ...(source.seriesSlugs || [])].filter(Boolean));
  return candidate.primarySeriesSlug
    ? sourceSeries.has(candidate.primarySeriesSlug)
    : Boolean(candidate.seriesSlugs?.some((slug) => sourceSeries.has(slug)));
}

function relatedScore(book: Book, candidate: Book | Artifact): number {
  const explicitIndex = book.relatedSlugs?.indexOf(candidate.slug) ?? -1;
  let score = tagOverlap(book.tags, candidate.tags) * 8;

  if (explicitIndex >= 0) score += 1000 - explicitIndex;
  if (candidate.relatedSlugs?.includes(book.slug)) score += 900;
  if (sharesSeries(book, candidate)) score += 90;
  if ('series' in candidate && candidate.series && candidate.series === book.series) score += 70;
  if ('category' in candidate && candidate.category && candidate.category === book.category) score += 35;
  if ('series' in candidate && candidate.type === 'series') score += 12;
  if (!('series' in candidate) && candidate.type === 'book-companion') score += 22;

  return score;
}

function seriesItemSortValue(item: Book | Artifact) {
  if ('series' in item) {
    if (item.type === 'book' || item.type === 'translation') return 0;
    return 1000;
  }
  return 2000;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) {
    return {
      title: 'Book',
      alternates: { canonical: `https://abvx.xyz/books/${slug}` },
    };
  }

  const image = imageMetadata(book.heroImage || book.coverImage, booksOgImage, book.type === 'series' ? 'project' : 'book');

  return metadataWithImage({
    title: book.title,
    description: book.summary,
    canonicalPath: `/books/${book.slug}`,
    image,
    type: book.type === 'series' ? 'website' : 'book',
  });
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) notFound();

  const image = book.heroImage || book.coverImage;
  const title = book.displayTitle || book.shortTitle || book.title;

  if (book.type === 'series') {
    const relatedItems = [
      ...getBooks()
        .filter((item) => item.id !== book.id && item.type !== 'series')
        .filter((item) => belongsToSeries(item, book.slug))
        .map((item) => ({ kind: 'book' as const, item })),
      ...getArtifactsBySection('books')
        .filter((item) => belongsToSeries(item, book.slug))
        .map((item) => ({ kind: 'artifact' as const, item })),
    ]
      .sort((a, b) => {
        const rank = seriesItemSortValue(a.item) - seriesItemSortValue(b.item);
        if (rank) return rank;
        return a.item.sortRank - b.item.sortRank;
      })
      .slice(0, 12);
    const seriesSiteLinks = book.links.filter((link) => link.type === 'site' || link.type === 'series');
    const contextRows = [
      ['Type', 'Series'],
      ['Line', book.group || 'Official publishing lines'],
      book.status ? ['Status', book.status] : undefined,
      seriesSiteLinks.length ? ['Site', renderLinks(seriesSiteLinks)] : undefined,
    ].filter(Boolean) as [string, ReactNode][];

    return (
      <article className="detail-page detail-page--book detail-page--series">
        <JsonLd id="jsonld-book-series" data={bookJsonLd(book)} />
        <JsonLd
          id="jsonld-book-breadcrumbs"
          data={breadcrumbJsonLd([
            { name: 'ABVX', url: SITE_URL },
            { name: 'ABVX Press', url: `${SITE_URL}/books` },
            { name: title, url: `${SITE_URL}/books/${book.slug}` },
          ])}
        />
        <BreadcrumbNav
          items={[
            { label: 'ABVX', href: '/' },
            { label: 'Books', href: '/books' },
            { label: title },
          ]}
        />
        <header className={`series-detail-hero${image ? ' series-detail-hero--with-media' : ''}`}>
          <div className="series-detail-hero__copy">
            <div className="eyebrow">Official publishing line / {book.status}</div>
            <h1>{title}</h1>
            <p>{book.summary}</p>
            <TagList tags={book.tags.slice(0, 8)} />
            <BookActionLinks links={book.links} />
          </div>

          {image ? (
            <div className="series-detail-hero__media">
              <MediaPanel image={image} title={title} variant="project" priority />
            </div>
          ) : null}
        </header>

        <section className="book-detail-main" aria-labelledby="series-about-title">
          <div className="book-detail-copy-panel">
            <div className="eyebrow">Publishing line</div>
            <h2 id="series-about-title">About this series</h2>
            <MarkdownContent>{book.description || book.summary}</MarkdownContent>
          </div>

          {contextRows.length ? (
            <aside className="book-detail-context" aria-label="Series context">
              <div className="eyebrow">Series context</div>
              <dl>
                {contextRows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          ) : null}
        </section>

        {relatedItems.length ? (
          <section className="home-section" aria-labelledby="series-related-title">
            <div className="home-section__header">
              <div className="eyebrow">Related items</div>
              <h2 id="series-related-title">Books, resources and companion systems.</h2>
            </div>
            <div className="book-related-grid">
              {relatedItems.map((related) => (
                <BookRelatedCard key={`${related.kind}-${related.item.id}`} related={related} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
    );
  }

  const relatedBooks = getBooks()
    .filter((item) => item.id !== book.id)
    .filter(
      (item) =>
        book.relatedSlugs?.includes(item.slug) ||
        item.series === book.series ||
        item.category === book.category ||
        item.tags.some((tag) => book.tags.includes(tag)),
    );
  const relatedArtifacts = getArtifactsBySection('books')
    .filter((item) => book.relatedSlugs?.includes(item.slug) || item.tags.some((tag) => book.tags.includes(tag)))
    .filter((item) => relatedScore(book, item) > 0);
  const relatedItems = [
    ...relatedBooks.map((item) => ({ kind: 'book' as const, item, score: relatedScore(book, item) })),
    ...relatedArtifacts.map((item) => ({ kind: 'artifact' as const, item, score: relatedScore(book, item) })),
  ]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.sortRank - b.item.sortRank;
    })
    .slice(0, book.relatedSlugs?.length ? Math.min(Math.max(book.relatedSlugs.length, 6), 9) : 6);
  const youtube = book.links.find((link) => link.type === 'youtube');
  const videoUrl = youtube ? youtubeEmbedUrl(youtube.url) : undefined;
  const formats = formatFormats(book.availableFormats?.length ? book.availableFormats : book.formats);
  const buyLinks = purchaseLinks(book);
  const primarySeries = book.primarySeriesSlug ? getBookBySlug(book.primarySeriesSlug) : undefined;
  const relatedEditionSlugs = [
    book.translationOf || undefined,
    ...(book.relatedSlugs || []),
  ].filter((relatedSlug): relatedSlug is string => Boolean(relatedSlug) && relatedSlug !== book.slug);
  const relatedEditions = [...new Set(relatedEditionSlugs)]
    .map((relatedSlug) => getBookBySlug(relatedSlug))
    .filter((item): item is Book => Boolean(item));
  const contextRows = [
    book.language ? ['Language', book.language] : undefined,
    book.author ? ['Author', book.author] : undefined,
    book.translator ? ['Translator', book.translator] : undefined,
    primarySeries ? ['Part of', renderBookLinks([primarySeries])] : undefined,
    book.series ? ['Series', book.series] : undefined,
    relatedEditions.length ? ['Related editions', renderBookLinks(relatedEditions)] : undefined,
    book.category ? ['Line', book.category] : undefined,
    ['Type', book.type],
    formats ? ['Formats', formats] : undefined,
    buyLinks.length ? ['Purchase links', renderLinks(buyLinks)] : undefined,
  ].filter(Boolean) as [string, ReactNode][];

  return (
    <article className="detail-page detail-page--book">
      <JsonLd id="jsonld-book-item" data={bookJsonLd(book)} />
      {book.faqs?.length ? (
        <JsonLd
          id="jsonld-book-faq"
          data={faqPageJsonLd({
            id: `${SITE_URL}/books/${book.slug}#faq`,
            faqs: book.faqs,
          })}
        />
      ) : null}
      <JsonLd
        id="jsonld-book-breadcrumbs"
        data={breadcrumbJsonLd([
          { name: 'ABVX', url: SITE_URL },
          { name: 'ABVX Press', url: `${SITE_URL}/books` },
          { name: title, url: `${SITE_URL}/books/${book.slug}` },
        ])}
      />
      <BreadcrumbNav
        items={[
          { label: 'ABVX', href: '/' },
          { label: 'Books', href: '/books' },
          ...(primarySeries ? [{ label: primarySeries.shortTitle || primarySeries.title, href: `/books/${primarySeries.slug}` }] : []),
          { label: title },
        ]}
      />
      <BookDetailHero book={book} image={image} />

      <section className="book-detail-main" aria-labelledby="book-about-title">
        <div className="book-detail-copy-panel">
          <div className="eyebrow">ABVX Press</div>
          <h2 id="book-about-title">About this book</h2>
          <MarkdownContent>{book.description || book.summary}</MarkdownContent>
        </div>

        {contextRows.length ? (
          <aside className="book-detail-context" aria-label="Publishing context">
            <div className="eyebrow">Publishing context</div>
            <dl>
              {contextRows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        ) : null}
      </section>

      <FAQSection id="book-faq-title" title="Reader questions." faqs={book.faqs || []} />

      {videoUrl ? (
        <section className="book-video-section" aria-labelledby="book-video-title">
          <div className="book-video-section__header">
            <div className="eyebrow">Media</div>
            <h2 id="book-video-title">Watch / Context</h2>
          </div>
          <MediaPanel videoUrl={videoUrl} title={title} variant="video" />
        </section>
      ) : null}

      {relatedItems.length ? (
        <section className="home-section" aria-labelledby="related-books-title">
          <div className="home-section__header">
            <div className="eyebrow">Related items</div>
            <h2 id="related-books-title">Same shelf, nearby systems.</h2>
          </div>
          <div className="book-related-grid">
            {relatedItems.map((related) => (
              <BookRelatedCard key={`${related.kind}-${related.item.id}`} related={related} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
