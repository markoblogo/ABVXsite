import ActionLinks from '@/components/ActionLinks';
import BookCatalogueCard from '@/components/BookCatalogueCard';
import CatalogueCard from '@/components/CatalogueCard';
import DetailHero from '@/components/DetailHero';
import MediaPanel from '@/components/MediaPanel';
import SectionPanel from '@/components/SectionPanel';
import { getArtifactsBySection, getBookBySlug, getBooks } from '@/content';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return getBooks().map((book) => ({ slug: book.slug }));
}

function youtubeEmbedUrl(url: string): string | undefined {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/);
  return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : undefined;
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

  const links = book.links;
  const image = book.heroImage || book.coverImage;
  const relatedBooks = getBooks()
    .filter((item) => item.id !== book.id)
    .filter(
      (item) =>
        item.series === book.series ||
        item.category === book.category ||
        item.tags.some((tag) => book.tags.includes(tag)),
    )
    .slice(0, 3);
  const relatedArtifacts = getArtifactsBySection('books')
    .filter((item) => item.tags.some((tag) => book.tags.includes(tag)))
    .slice(0, 2);
  const youtube = book.links.find((link) => link.type === 'youtube');
  const videoUrl = youtube ? youtubeEmbedUrl(youtube.url) : undefined;
  const title = book.displayTitle || book.shortTitle || book.title;

  return (
    <article className="detail-page detail-page--book">
      <DetailHero
        eyebrow={`${book.series || book.category || book.type} / ${book.status}`}
        title={title}
        subtitle={book.subtitle}
        summary={book.summary}
        tags={book.tags}
        links={links}
        image={image}
        variant="book"
      />

      <SectionPanel title="Overview" eyebrow="ABVX Press">
        <p>{book.description || book.summary}</p>
      </SectionPanel>

      <SectionPanel title="Publishing context" eyebrow={book.type}>
        <p>
          {book.series ? `${book.series}. ` : ''}
          {book.category ? `${book.category}. ` : ''}
          {book.formats?.length ? `Available formats: ${book.formats.join(', ')}.` : ''}
        </p>
      </SectionPanel>

      {videoUrl ? (
        <SectionPanel title="Video / context" eyebrow="Media">
          <MediaPanel videoUrl={videoUrl} title={title} variant="video" />
        </SectionPanel>
      ) : null}

      {links.length ? (
        <SectionPanel title="Formats and links" eyebrow="Public">
          <ActionLinks links={links} />
        </SectionPanel>
      ) : null}

      {relatedBooks.length || relatedArtifacts.length ? (
        <section className="home-section" aria-labelledby="related-books-title">
          <div className="home-section__header">
            <div className="eyebrow">Related items</div>
            <h2 id="related-books-title">Same shelf, nearby systems.</h2>
          </div>
          <div className="related-grid">
            {relatedBooks.map((item) => (
              <BookCatalogueCard key={item.id} book={item} />
            ))}
            {relatedArtifacts.map((artifact) => (
              <CatalogueCard key={artifact.id} artifact={artifact} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
