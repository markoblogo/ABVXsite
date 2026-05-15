import ProjectCatalogueCard from '@/components/ProjectCatalogueCard';
import JsonLd from '@/components/JsonLd';
import PageHeader from '@/components/PageHeader';
import SectionPanel from '@/components/SectionPanel';
import { getArtifactsBySection } from '@/content';
import type { Artifact } from '@/content';
import { toPublicArtifact } from '@/content/public-props';
import { artifactListItem, collectionPageJsonLd, focusOgImage, itemListJsonLd, metadataWithImage, SITE_URL } from '@/lib/seo';
import type { Metadata } from 'next';
import Link from 'next/link';

const focusDescription =
  'Digital infrastructure, standards, indexes, workflows and AI-assisted tools for physical agro-commodity markets.';

export const metadata: Metadata = metadataWithImage({
  title: 'Current Focus',
  description: focusDescription,
  canonicalPath: '/focus',
  image: focusOgImage,
});

const focusGroups = [
  {
    title: 'Trading & Brokerage Platforms',
    description:
      'Platforms where brokerage teams, market participants or trading workflows can manage real or simulated commodity-market transactions, deal pipelines and execution layers.',
    slugs: ['mn7r', 'cropto'],
    variant: 'primary',
  },
  {
    title: 'Market Intelligence, Monitoring & Indexes',
    description:
      'Monitoring and index products that turn fragmented market data, news, logistics, weather, crop, signal and commodity-market context into readable intelligence.',
    slugs: ['cropto-monitor', 'last30days-cropto', 'spike-spot-commodity-index-ukraine', 'uga-index'],
    variant: 'standard',
  },
  {
    title: 'Market Fronts & Partner Landings',
    description:
      'Market-facing landing pages, decks and commercial fronts for commodity infrastructure projects, partner ventures and trading-service concepts.',
    slugs: ['trade-solution-eu', 'cropto-market-risk-deck', 'liqua'],
    variant: 'standard',
  },
] as const;

function itemsForGroup(artifacts: Artifact[], slugs: readonly string[]): Artifact[] {
  const bySlug = new Map(artifacts.map((artifact) => [artifact.slug, artifact]));
  return slugs.map((slug) => bySlug.get(slug)).filter((item): item is Artifact => Boolean(item));
}

function slugifyFragment(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function FocusPage() {
  const artifacts = getArtifactsBySection('focus');
  const listedArtifacts = focusGroups.flatMap((group) => itemsForGroup(artifacts, group.slugs));

  return (
    <div className="route-focus grid gap-8">
      <JsonLd
        id="jsonld-focus-page"
        data={collectionPageJsonLd({
          id: `${SITE_URL}/focus#page`,
          name: 'Current Focus',
          description: focusDescription,
          url: `${SITE_URL}/focus`,
          image: focusOgImage,
        })}
      />
      <JsonLd
        id="jsonld-focus-list"
        data={itemListJsonLd({
          id: `${SITE_URL}/focus#items`,
          name: 'Focus market infrastructure projects',
          items: listedArtifacts.map(artifactListItem),
        })}
      />
      <PageHeader
        eyebrow="Current Focus"
        title="Agro Commodity Trading Infrastructure"
        summary="Digital infrastructure, standards, indexes, workflows and AI-assisted tools for physical agro-commodity markets."
      />

      {focusGroups.map((group) => {
        const groupItems = itemsForGroup(artifacts, group.slugs);
        if (!groupItems.length) return null;
        const titleId = slugifyFragment(group.title);

        return (
          <section key={group.title} className="home-section focus-product-group" aria-labelledby={titleId}>
            <div className="focus-product-group__header">
              <div className="eyebrow">Focus group</div>
              <h2 id={titleId}>{group.title}</h2>
              <p>{group.description}</p>
            </div>
            <div className={group.variant === 'primary' ? 'focus-platform-grid' : 'focus-product-grid'}>
              {groupItems.map((artifact) => (
                <ProjectCatalogueCard key={artifact.id} artifact={toPublicArtifact(artifact)} tone="focus" />
              ))}
            </div>
          </section>
        );
      })}

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
