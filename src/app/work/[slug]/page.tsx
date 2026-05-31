import JsonLd from '@/components/JsonLd';
import FAQSection from '@/components/FAQSection';
import MediaPanel from '@/components/MediaPanel';
import SocialLinks from '@/components/SocialLinks';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import WorkBrief from '@/components/WorkBrief';
import WorkDetailHero from '@/components/WorkDetailHero';
import WorkRelatedCard from '@/components/WorkRelatedCard';
import { getArtifactBySlug, getArtifacts, getBooks, type Artifact, type Book, type ContentImage } from '@/content';
import { socialLinks } from '@/content/link-utils';
import { toPublicArtifact, toPublicBook } from '@/content/public-props';
import { fetchMn7rFeed } from '@/lib/feeds';
import {
  artifactJsonLd,
  breadcrumbJsonLd,
  defaultOgImage,
  faqPageJsonLd,
  focusOgImage,
  imageMetadata,
  metadataWithImage,
  SITE_URL,
} from '@/lib/seo';
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

const focusGroups = new Set([
  'Trading & Brokerage Platforms',
  'Market Intelligence, Monitoring & Indexes',
  'Market Fronts & Partner Landings',
]);

const marketEcosystemTags = new Set([
  'cropto',
  'agro-commodities',
  'brokerage',
  'market-intelligence',
  'market-monitoring',
  'trading-platform',
  'market-infrastructure',
  'commodity-signals',
  'commodity-indexes',
  'market-data',
  'market-risk',
  'trading',
  'liquidity',
  'trading-service',
]);

const sectionMeta: Record<string, { label: string; href: string; jsonUrl: string }> = {
  focus: { label: 'Focus', href: '/focus', jsonUrl: `${SITE_URL}/focus` },
  systems: { label: 'Systems', href: '/systems', jsonUrl: `${SITE_URL}/systems` },
  books: { label: 'Books', href: '/books', jsonUrl: `${SITE_URL}/books` },
  writing: { label: 'Writing', href: '/writing', jsonUrl: `${SITE_URL}/writing` },
};

function isFocusInfrastructure(artifact: Artifact): boolean {
  return artifact.primarySection === 'focus' || Boolean(artifact.group && focusGroups.has(artifact.group));
}

function slugifyFragment(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function breadcrumbSectionFor(artifact: Artifact) {
  if (isFocusInfrastructure(artifact)) return sectionMeta.focus;
  return sectionMeta[artifact.primarySection] || sectionMeta.systems;
}

function breadcrumbGroupFor(artifact: Artifact, section: { href: string; jsonUrl: string }) {
  if (!artifact.group) return undefined;
  if (artifact.primarySection === 'books') return { label: artifact.group, href: '/books#book-companions-title', jsonUrl: `${SITE_URL}/books#book-companions-title` };
  const fragment = slugifyFragment(artifact.group);
  return {
    label: artifact.group,
    href: `${section.href}#${fragment}`,
    jsonUrl: `${section.jsonUrl}#${fragment}`,
  };
}

function marketTagOverlap(a: string[], b: string[]): number {
  return a.filter((tag) => marketEcosystemTags.has(tag) && b.includes(tag)).length;
}

function focusRelatedScore(artifact: Artifact, candidate: Artifact): number {
  if (!isFocusInfrastructure(candidate)) return 0;

  let score = marketTagOverlap(artifact.tags, candidate.tags) * 14;
  if (candidate.group && candidate.group === artifact.group) score += 80;
  if (candidate.primarySection === 'focus') score += 30;
  if (candidate.appearsIn.includes('focus')) score += 18;
  if (candidate.type === artifact.type) score += 14;
  if (artifact.relatedSlugs?.includes(candidate.slug) || candidate.relatedSlugs?.includes(artifact.slug)) score += 100;
  if (artifact.tags.includes('cropto') && candidate.slug === 'cropto') score += 80;
  if (artifact.slug === 'cropto' && candidate.tags.includes('cropto')) score += 60;
  if (artifact.group === 'Market Fronts & Partner Landings' && candidate.slug === 'cropto') score += 75;
  if (artifact.group === 'Market Fronts & Partner Landings' && candidate.group === 'Trading & Brokerage Platforms') score += 30;

  return score;
}

function relatedArtifactScore(artifact: Artifact, candidate: Artifact): number {
  let score = tagOverlap(artifact.tags, candidate.tags) * 8;
  if (artifact.relatedSlugs?.includes(candidate.slug) || candidate.relatedSlugs?.includes(artifact.slug)) score += 100;
  if (candidate.group && candidate.group === artifact.group) score += 60;
  if (candidate.primarySection === artifact.primarySection) score += 18;
  if (candidate.appearsIn.some((section) => artifact.appearsIn.includes(section))) score += 14;
  if (candidate.type === artifact.type) score += 12;
  return score;
}

function relatedItemsForWork(artifact: Artifact) {
  if (isFocusInfrastructure(artifact)) {
    return getArtifacts()
      .filter((item) => item.id !== artifact.id)
      .map((item) => ({ kind: 'artifact' as const, item, score: focusRelatedScore(artifact, item) }))
      .filter((related) => related.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.item.sortRank - b.item.sortRank;
      })
      .slice(0, 3);
  }

  const relatedArtifacts = getArtifacts()
    .filter((item) => item.id !== artifact.id)
    .map((item) => ({ kind: 'artifact' as const, item, score: relatedArtifactScore(artifact, item) }))
    .filter((related) => related.score > 0);
  const relatedBooks = getBooks()
    .map((item) => ({ kind: 'book' as const, item, score: relatedBookScore(artifact, item) }))
    .filter((related) => related.score > 0);
  const limit = artifact.relatedSlugs?.length ? Math.min(Math.max(artifact.relatedSlugs.length, 6), 8) : 6;

  return [...relatedArtifacts, ...relatedBooks]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.sortRank - b.item.sortRank;
    })
    .slice(0, limit);
}

function relatedBookScore(artifact: Artifact, book: Book): number {
  let score = tagOverlap(artifact.tags, book.tags) * 8;
  if (artifact.relatedSlugs?.includes(book.slug) || book.relatedSlugs?.includes(artifact.slug)) score += 100;
  if (book.appearsIn.some((section) => artifact.appearsIn.includes(section))) score += 18;
  if (artifact.tags.includes('book-companion')) score += 14;
  return score;
}

async function latestMn7rBlogImage(feedUrl?: string): Promise<ContentImage | undefined> {
  if (!feedUrl) return undefined;
  try {
    const latest = (await fetchMn7rFeed(feedUrl))[0];
    if (!latest?.coverImage) return undefined;
    return {
      src: latest.coverImage,
      alt: latest.title,
      role: 'rss-image',
      mediaRole: 'rss-image',
    };
  } catch {
    return undefined;
  }
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

  const image = imageMetadata(
    artifact.heroImage || artifact.thumbnail,
    isFocusInfrastructure(artifact) ? focusOgImage : defaultOgImage,
    'project',
  );

  return metadataWithImage({
    title: artifact.title,
    description: artifact.summary,
    canonicalPath: `/work/${artifact.slug}`,
    image,
  });
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
  const focusInfrastructure = isFocusInfrastructure(artifact);
  const relatedItems = relatedItemsForWork(artifact);
  const mn7rBlogRelated = relatedItems.find((related) => related.kind === 'artifact' && related.item.slug === 'mn7r-blog');
  const mn7rBlogRelatedImage =
    mn7rBlogRelated?.kind === 'artifact' ? await latestMn7rBlogImage(mn7rBlogRelated.item.rssFeed?.url) : undefined;
  const youtube = artifact.links.find((link) => link.type === 'youtube');
  const videoUrl = youtube ? youtubeEmbedUrl(youtube.url) : undefined;
  const publicArtifact = toPublicArtifact(artifact);
  const channels = socialLinks(publicArtifact.links);
  const breadcrumbSection = breadcrumbSectionFor(artifact);
  const breadcrumbGroup = breadcrumbGroupFor(artifact, breadcrumbSection);

  return (
    <article className="detail-page detail-page--work">
      <JsonLd id="jsonld-work-item" data={artifactJsonLd(artifact, relatedItems.map((related) => related.item))} />
      {artifact.faqs?.length ? (
        <JsonLd
          id="jsonld-work-faq"
          data={faqPageJsonLd({
            id: `${SITE_URL}/work/${artifact.slug}#faq`,
            faqs: artifact.faqs,
          })}
        />
      ) : null}
      <JsonLd
        id="jsonld-work-breadcrumbs"
        data={breadcrumbJsonLd([
          { name: 'ABVX', url: SITE_URL },
          { name: breadcrumbSection.label, url: breadcrumbSection.jsonUrl },
          ...(breadcrumbGroup ? [{ name: breadcrumbGroup.label, url: breadcrumbGroup.jsonUrl }] : []),
          { name: artifact.title, url: `${SITE_URL}/work/${artifact.slug}` },
        ])}
      />
      <BreadcrumbNav
        items={[
          { label: 'ABVX', href: '/' },
          { label: breadcrumbSection.label, href: breadcrumbSection.href },
          ...(breadcrumbGroup ? [{ label: breadcrumbGroup.label, href: breadcrumbGroup.href }] : []),
          { label: artifact.title },
        ]}
      />
      <WorkDetailHero artifact={publicArtifact} image={image} />

      <WorkBrief artifact={publicArtifact} />

      <FAQSection
        id="work-faq-title"
        eyebrow={artifact.type === 'market-index' ? 'Methodology FAQ' : 'FAQ'}
        title={artifact.type === 'market-index' ? 'Benchmark methodology questions.' : 'Questions this page answers.'}
        faqs={artifact.faqs || []}
      />

      {channels.length ? (
        <section className="work-social-section" aria-labelledby="work-social-title">
          <div className="work-social-section__header">
            <div className="eyebrow">Channels</div>
            <h2 id="work-social-title">Social / Channels</h2>
          </div>
          <SocialLinks links={channels} />
        </section>
      ) : null}

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
            <h2 id="related-work-title">
              {focusInfrastructure ? 'Related market systems.' : 'Adjacent systems and publishing.'}
            </h2>
          </div>
          <div className="work-related-grid">
            {relatedItems.map((related) => (
              <WorkRelatedCard
                key={`${related.kind}-${related.item.id}`}
                imageOverride={related.item.slug === 'mn7r-blog' ? mn7rBlogRelatedImage : undefined}
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
