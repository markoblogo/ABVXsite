import ArtifactCard from '@/components/ArtifactCard';
import BookCard from '@/components/BookCard';
import PageHeader from '@/components/PageHeader';
import SectionPanel from '@/components/SectionPanel';
import {
  getArtifactsBySection,
  getBooksBySection,
  getFeaturedArtifacts,
} from '@/content';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Current Focus',
  description:
    'Digital infrastructure, standards, indexes, workflows and AI-assisted tools for physical agro-commodity markets.',
  alternates: { canonical: 'https://abvx.xyz/focus' },
};

export default function FocusPage() {
  const artifacts = getArtifactsBySection('focus');
  const featured = getFeaturedArtifacts('focus');
  const relatedBooks = getBooksBySection('focus');

  return (
    <div className="route-focus grid gap-8">
      <PageHeader
        eyebrow="Current Focus"
        title="Agro Commodity Trading Infrastructure"
        summary="Digital infrastructure, standards, indexes, workflows and AI-assisted tools for physical agro-commodity markets."
      />

      <section className="home-section" aria-labelledby="featured-focus-title">
        <div className="home-section__header">
          <div className="eyebrow">Featured focus artifacts</div>
          <h2 id="featured-focus-title">The active market systems thread.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(featured.length ? featured : artifacts).map((artifact) => (
            <ArtifactCard key={artifact.id} artifact={artifact} />
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="all-focus-title">
        <div className="home-section__header">
          <div className="eyebrow">All focus items</div>
          <h2 id="all-focus-title">Infrastructure, workflows, interfaces.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {artifacts.map((artifact) => (
            <ArtifactCard key={artifact.id} artifact={artifact} />
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="focus-books-title">
        <div className="home-section__header">
          <div className="eyebrow">Related books/resources</div>
          <h2 id="focus-books-title">Publishing that supports the focus.</h2>
        </div>
        {relatedBooks.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {relatedBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <SectionPanel title="No focus-specific publishing item yet" eyebrow="Review">
            <p>
              Focus-related books and resources will appear here once they are
              represented in the Git content registry.
            </p>
          </SectionPanel>
        )}
      </section>

      <SectionPanel title="Partnerships and market systems" eyebrow="CTA" accent>
        <p>
          Open to conversations around brokerage infrastructure, market interfaces,
          commodity data products, standards, indexes, AI-assisted workflows and
          practical collaboration in physical agro-commodity markets.
        </p>
        <Link className="panel-link" href="mailto:a.biletskiy@gmail.com">
          Start a conversation
        </Link>
      </SectionPanel>
    </div>
  );
}
