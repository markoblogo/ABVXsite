import BookDetailHero from '@/components/BookDetailHero';
import BookRelatedCard from '@/components/BookRelatedCard';
import MediaPanel from '@/components/MediaPanel';
import { getArtifactsBySection, getBookBySlug, getBooks, type Artifact, type Book } from '@/content';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

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

function tagOverlap(a: string[], b: string[]): number {
  return a.filter((tag) => b.includes(tag)).length;
}

function relatedScore(book: Book, candidate: Book | Artifact): number {
  let score = tagOverlap(book.tags, candidate.tags) * 8;

  if ('series' in candidate && candidate.series && candidate.series === book.series) score += 70;
  if ('category' in candidate && candidate.category && candidate.category === book.category) score += 35;
  if ('series' in candidate && candidate.type === 'series') score += 12;
  if (!('series' in candidate) && candidate.type === 'book-companion') score += 22;

  return score;
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

  return {
    title: book.title,
    description: book.summary,
    alternates: { canonical: `https://abvx.xyz/books/${book.slug}` },
    openGraph: {
      title: book.title,
      description: book.summary,
      url: `https://abvx.xyz/books/${book.slug}`,
      type: 'book',
    },
  };
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
  const relatedBooks = getBooks()
    .filter((item) => item.id !== book.id)
    .filter(
      (item) =>
        item.series === book.series ||
        item.category === book.category ||
        item.tags.some((tag) => book.tags.includes(tag)),
    );
  const relatedArtifacts = getArtifactsBySection('books')
    .filter((item) => item.tags.some((tag) => book.tags.includes(tag)))
    .filter((item) => relatedScore(book, item) > 0);
  const relatedItems = [
    ...relatedBooks.map((item) => ({ kind: 'book' as const, item, score: relatedScore(book, item) })),
    ...relatedArtifacts.map((item) => ({ kind: 'artifact' as const, item, score: relatedScore(book, item) })),
  ]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.sortRank - b.item.sortRank;
    })
    .slice(0, 6);
  const youtube = book.links.find((link) => link.type === 'youtube');
  const videoUrl = youtube ? youtubeEmbedUrl(youtube.url) : undefined;
  const title = book.displayTitle || book.shortTitle || book.title;
  const formats = formatFormats(book.formats);
  const contextRows = [
    book.series ? ['Series', book.series] : undefined,
    book.category ? ['Line', book.category] : undefined,
    ['Type', book.type],
    formats ? ['Formats', formats] : undefined,
  ].filter(Boolean) as [string, string][];

  return (
    <article className="detail-page detail-page--book">
      <BookDetailHero book={book} image={image} />

      <section className="book-detail-main" aria-labelledby="book-about-title">
        <div className="book-detail-copy-panel">
          <div className="eyebrow">ABVX Press</div>
          <h2 id="book-about-title">About this book</h2>
          <p>{book.description || book.summary}</p>
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
