import { getBookBySlug } from '@/lib/abvx-data';

export const dynamic = 'force-dynamic';

export default async function Head({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return null;

  const offers = [book.amazon, book.paper, book.pdf, book.site, book.teaser]
    .filter(Boolean)
    .map((url) => ({
      '@type': 'Offer',
      url,
      availability: 'https://schema.org/InStock',
    }));

  const bookJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.name,
    description: book.section || undefined,
    author: {
      '@type': 'Person',
      name: 'Anton Biletskyi-Volokh',
    },
    image: book.coverImage,
    url: `https://abvx.xyz/books/${book.slug}`,
    offers: offers.length ? offers : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
    />
  );
}

