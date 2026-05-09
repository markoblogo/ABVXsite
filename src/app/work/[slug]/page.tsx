import PageHeader from '@/components/PageHeader';
import SectionPanel from '@/components/SectionPanel';
import TagList from '@/components/TagList';
import { getArtifactBySlug, getArtifacts } from '@/content';
import type { Metadata } from 'next';
import Link from 'next/link';
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
        eyebrow={`${artifact.type} / ${artifact.status}`}
        title={artifact.title}
        summary={artifact.summary}
      >
        <TagList tags={artifact.tags} />
      </PageHeader>

      <SectionPanel title="Canonical work item" eyebrow={artifact.primarySection}>
        <p>{artifact.description || artifact.summary}</p>
      </SectionPanel>

      {artifact.appearsIn.length ? (
        <SectionPanel title="Appears in" eyebrow="Sections">
          <div className="link-strip">
            {artifact.appearsIn.map((section) => (
              <Link key={section} href={`/${section}`}>
                {section}
              </Link>
            ))}
          </div>
        </SectionPanel>
      ) : null}

      {artifact.links.length ? (
        <SectionPanel title="Links" eyebrow="External">
          <div className="link-strip">
            {artifact.links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </SectionPanel>
      ) : artifact.needsReview ? (
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
