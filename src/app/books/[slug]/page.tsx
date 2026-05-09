import PageHeader from '@/components/PageHeader';
import SectionPanel from '@/components/SectionPanel';
import TagList from '@/components/TagList';
import { getBookBySlug, getBooks } from '@/content';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return getBooks().map((book) => ({ slug: book.slug }));
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

  return (
    <article className="grid gap-8">
      <PageHeader
        eyebrow={`${book.series || book.category || book.type} / ${book.status}`}
        title={book.title}
        summary={book.summary}
      >
        <TagList tags={book.tags} />
      </PageHeader>

      {book.heroImage || book.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="detail-hero-image detail-hero-image--book"
          src={(book.heroImage || book.coverImage)?.src}
          alt={(book.heroImage || book.coverImage)?.alt || book.title}
        />
      ) : null}

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

      {links.length ? (
        <SectionPanel title="Links" eyebrow="Public">
          <div className="link-strip">
            {links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </SectionPanel>
      ) : null}
    </article>
  );
}
