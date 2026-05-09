import BookCatalogueCard from '@/components/BookCatalogueCard';
import CatalogueCard from '@/components/CatalogueCard';
import ActionLinks from '@/components/ActionLinks';
import DetailHero from '@/components/DetailHero';
import MediaPanel from '@/components/MediaPanel';
import SectionPanel from '@/components/SectionPanel';
import { getArtifactBySlug, getArtifacts, getBooks } from '@/content';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return getArtifacts().map((artifact) => ({ slug: artifact.slug }));
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
    .filter(
      (item) =>
        item.group === artifact.group ||
        item.appearsIn.some((section) => artifact.appearsIn.includes(section)) ||
        item.tags.some((tag) => artifact.tags.includes(tag)),
    )
    .slice(0, 3);
  const relatedBooks = getBooks()
    .filter((book) => book.appearsIn.some((section) => artifact.appearsIn.includes(section)))
    .slice(0, 2);
  const youtube = artifact.links.find((link) => link.type === 'youtube');
  const videoUrl = youtube ? youtubeEmbedUrl(youtube.url) : undefined;

  return (
    <article className="detail-page detail-page--work">
      <DetailHero
        eyebrow={`${artifact.group || artifact.type} / ${artifact.status}`}
        title={artifact.title}
        summary={artifact.summary}
        tags={artifact.tags}
        links={artifact.links}
        variant="project"
      />

      <SectionPanel title="Overview" eyebrow="Work">
        <p>{artifact.description || artifact.summary}</p>
      </SectionPanel>

      {image ? <MediaPanel image={image} title={artifact.title} variant="project" /> : null}

      {videoUrl ? (
        <SectionPanel title="Video / demo" eyebrow="Media">
          <MediaPanel videoUrl={videoUrl} title={artifact.title} variant="video" />
        </SectionPanel>
      ) : null}

      {artifact.description && artifact.description !== artifact.summary ? (
        <SectionPanel title="What it does" eyebrow="Use">
          <p>{artifact.description}</p>
        </SectionPanel>
      ) : null}

      <SectionPanel title="Role in the index" eyebrow="Context">
        <p>
          This public artifact sits in the ABVX working index as a concrete system,
          service, protocol or technical companion connected to current work.
        </p>
      </SectionPanel>

      {artifact.links.length ? (
        <SectionPanel title="Links" eyebrow="Public">
          <ActionLinks links={artifact.links} />
        </SectionPanel>
      ) : null}

      {relatedArtifacts.length || relatedBooks.length ? (
        <section className="home-section" aria-labelledby="related-work-title">
          <div className="home-section__header">
            <div className="eyebrow">Related work</div>
            <h2 id="related-work-title">Adjacent systems and publishing.</h2>
          </div>
          <div className="related-grid">
            {relatedArtifacts.map((item) => (
              <CatalogueCard key={item.id} artifact={item} />
            ))}
            {relatedBooks.map((book) => (
              <BookCatalogueCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
