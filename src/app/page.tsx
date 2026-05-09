import ArtifactCard from '@/components/ArtifactCard';
import BookCard from '@/components/BookCard';
import HeroPoster from '@/components/HeroPoster';
import MarqueeTicker from '@/components/MarqueeTicker';
import SectionPanel from '@/components/SectionPanel';
import { getFeaturedArtifacts, getLatestBook } from '@/content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ABVX',
  description:
    'A live working index for systems, strategy, market infrastructure, agentic development, language experiments, books, and essays.',
  alternates: { canonical: 'https://abvx.xyz' },
};

export default function Home() {
  const featured = getFeaturedArtifacts();
  const latestBook = getLatestBook();

  return (
    <div className="grid gap-8">
      <HeroPoster
        eyebrow="Live index"
        title="Systems, markets, language, books."
        summary="ABVX tracks current work across market infrastructure, strategy, product development, AI-native tooling, protocols, constructed-language experiments, publishing, and essays."
      />

      <MarqueeTicker
        items={[
          'Current focus: agro-commodity trading infrastructure',
          'Systems catalogue: tools, services, protocols, language experiments',
          'ABVX Press: books, translations, free editions',
          'Writing: Medium + Substack archive',
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionPanel title="Current working surface" eyebrow="Focus">
          <p>
            The site is being rebuilt as a public operating index: each item has one
            canonical home but can appear where it is contextually useful.
          </p>
        </SectionPanel>
        <SectionPanel title="No portfolio theater" eyebrow="Principle" accent>
          <p>
            Projects, books, and essays are grouped by the work they support, not by
            legacy labels or archive categories.
          </p>
        </SectionPanel>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {featured.slice(0, 4).map((artifact) => (
          <ArtifactCard key={artifact.id} artifact={artifact} />
        ))}
      </section>

      {latestBook ? (
        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionPanel title="ABVX Press" eyebrow="Books">
            <p>
              Books, translations, series, companion landings, and free editions live
              under the publishing layer.
            </p>
          </SectionPanel>
          <BookCard book={latestBook} />
        </section>
      ) : null}
    </div>
  );
}
