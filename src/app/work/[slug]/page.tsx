import PageHeader from '@/components/PageHeader';
import SectionPanel from '@/components/SectionPanel';
import TagList from '@/components/TagList';
import { getArtifactBySlug, getArtifacts } from '@/content';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return getArtifacts().map((artifact) => ({ slug: artifact.slug }));
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

  return (
    <article className="grid gap-8">
      <PageHeader
        eyebrow={`${artifact.group || artifact.type} / ${artifact.status}`}
        title={artifact.title}
        summary={artifact.summary}
      >
        <TagList tags={artifact.tags} />
      </PageHeader>

      {artifact.heroImage || artifact.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="detail-hero-image"
          src={(artifact.heroImage || artifact.thumbnail)?.src}
          alt={(artifact.heroImage || artifact.thumbnail)?.alt || artifact.title}
        />
      ) : null}

      <SectionPanel title="Overview" eyebrow="Work">
        <p>{artifact.description || artifact.summary}</p>
      </SectionPanel>

      {artifact.appearsIn.length ? (
        <SectionPanel title="Related work" eyebrow="Context">
          <p>
            This item is part of the {artifact.appearsIn.join(', ')} section
            {artifact.appearsIn.length === 1 ? '' : 's'} of the ABVX working index.
          </p>
        </SectionPanel>
      ) : null}

      {artifact.links.length ? (
        <SectionPanel title="Links" eyebrow="Public">
          <div className="link-strip">
            {artifact.links.map((link) => (
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
