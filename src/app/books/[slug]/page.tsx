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
        eyebrow={`${book.type} / ${book.status}`}
        title={book.title}
        summary={book.summary}
      >
        <TagList tags={book.tags} />
      </PageHeader>

      <SectionPanel title="About this publishing item" eyebrow="ABVX Press">
        <p>{book.description || book.summary}</p>
      </SectionPanel>

      {links.length ? (
        <SectionPanel title="Links" eyebrow="External">
          <div className="link-strip">
            {links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </SectionPanel>
      ) : book.needsReview ? (
        <SectionPanel title="Links pending review" eyebrow="Review">
          <p>
            Public links for this item are intentionally omitted until they are
            verified in the Git content registry.
          </p>
        </SectionPanel>
      ) : null}
    </article>
  );
}
