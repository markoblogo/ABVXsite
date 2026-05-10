import MediaPanel from '@/components/MediaPanel';
import WorkBrief from '@/components/WorkBrief';
import WorkDetailHero from '@/components/WorkDetailHero';
import WorkRelatedCard from '@/components/WorkRelatedCard';
import { getArtifactBySlug, getArtifacts, getBooks, type Artifact, type Book } from '@/content';
import { toPublicArtifact, toPublicBook } from '@/content/public-props';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return getArtifacts().map((artifact) => ({ slug: artifact.slug }));
}

function youtubeEmbedUrl(url: string): string | undefined {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/);
  return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : undefined;
}

function tagOverlap(a: string[], b: string[]): number {
  return a.filter((tag) => b.includes(tag)).length;
}

function relatedArtifactScore(artifact: Artifact, candidate: Artifact): number {
  let score = tagOverlap(artifact.tags, candidate.tags) * 8;
  if (candidate.group && candidate.group === artifact.group) score += 60;
  if (candidate.primarySection === artifact.primarySection) score += 18;
  if (candidate.appearsIn.some((section) => artifact.appearsIn.includes(section))) score += 14;
  if (candidate.type === artifact.type) score += 12;
  return score;
}

function relatedBookScore(artifact: Artifact, book: Book): number {
  let score = tagOverlap(artifact.tags, book.tags) * 8;
  if (book.appearsIn.some((section) => artifact.appearsIn.includes(section))) score += 18;
  if (artifact.tags.includes('book-companion')) score += 14;
  return score;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artifact = getArtifactBySlug(slug);
  if (!artifact) {
    return {
      title: 'Work',
      alternates: { canonical: `https://abvx.xyz/work/${slug}` },
    };
  }

  return {
    title: artifact.title,
    description: artifact.summary,
    alternates: { canonical: `https://abvx.xyz/work/${artifact.slug}` },
    openGraph: {
      title: artifact.title,
      description: artifact.summary,
      url: `https://abvx.xyz/work/${artifact.slug}`,
      type: 'website',
    },
  };
}

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artifact = getArtifactBySlug(slug);
  if (!artifact) notFound();
  const image = artifact.heroImage || artifact.thumbnail;
  const relatedArtifacts = getArtifacts()
    .filter((item) => item.id !== artifact.id)
    .map((item) => ({ kind: 'artifact' as const, item, score: relatedArtifactScore(artifact, item) }))
    .filter((related) => related.score > 0);
  const relatedBooks = getBooks()
    .map((item) => ({ kind: 'book' as const, item, score: relatedBookScore(artifact, item) }))
    .filter((related) => related.score > 0);
  const relatedItems = [...relatedArtifacts, ...relatedBooks]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.sortRank - b.item.sortRank;
    })
    .slice(0, 6);
  const youtube = artifact.links.find((link) => link.type === 'youtube');
  const videoUrl = youtube ? youtubeEmbedUrl(youtube.url) : undefined;
  const publicArtifact = toPublicArtifact(artifact);

  return (
    <article className="detail-page detail-page--work">
      <WorkDetailHero artifact={publicArtifact} image={image} />

      <WorkBrief artifact={publicArtifact} />

      {videoUrl ? (
        <section className="work-video-section" aria-labelledby="work-video-title">
          <div className="work-video-section__header">
            <div className="eyebrow">Media</div>
            <h2 id="work-video-title">Video / Demo</h2>
          </div>
          <MediaPanel videoUrl={videoUrl} title={artifact.title} variant="video" />
        </section>
      ) : null}

      {relatedItems.length ? (
        <section className="home-section" aria-labelledby="related-work-title">
          <div className="home-section__header">
            <div className="eyebrow">Related work</div>
            <h2 id="related-work-title">Adjacent systems and publishing.</h2>
          </div>
          <div className="work-related-grid">
            {relatedItems.map((related) => (
              <WorkRelatedCard
                key={`${related.kind}-${related.item.id}`}
                related={
                  related.kind === 'artifact'
                    ? { kind: 'artifact', item: toPublicArtifact(related.item) }
                    : { kind: 'book', item: toPublicBook(related.item) }
                }
              />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
