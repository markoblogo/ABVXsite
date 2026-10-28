import {getLiveCatalogue} from '@/lib/live-catalogue';
import type {systemsEcosystems} from '@/lib/catalogue-config.mjs';
import { systemsGroupSlugs } from '@/lib/systems-catalogue.mjs';
import ProjectCatalogueCard from '@/components/ProjectCatalogueCard';
import JsonLd from '@/components/JsonLd';
import PageHeader from '@/components/PageHeader';
import EditorialSectionLink from '@/components/EditorialSectionLink';

import { getEditorialArticles } from '@/content/editorials';
import type { Artifact } from '@/content';
import { toPublicArtifact } from '@/content/public-props';
import { artifactListItem, collectionPageJsonLd, itemListJsonLd, metadataWithImage, SITE_URL, systemsOgImage } from '@/lib/seo';
import type { Metadata } from 'next';

const systemsDescription = 'AI-native development systems, agentic workflows, reusable skillpacks, orchestration layers, protocols, tools and technical companion systems.';

export const metadata: Metadata = metadataWithImage({
  title: 'Systems Catalogue - AI-native development systems',
  description: systemsDescription,
  canonicalPath: '/systems',
  image: systemsOgImage,
});



const ecosystemEditorialSlugs: Record<string, string> = {
  'Agro Market Infrastructure Systems': 'agro-market-infrastructure-systems',
  'Publishing & Language Systems': 'publishing-language-systems',
  'AI-native Development Systems': 'ai-native-development-systems',
  'Standalone Utilities & Experiments': 'standalone-utilities-experiments',
};

const subgroupEditorialSlugs: Record<string, string> = {
  'Trading & Brokerage Platforms': 'trading-brokerage-platforms',
  'Monitoring & Intelligence': 'monitoring-intelligence',
  'Market Fronts & Landings': 'market-fronts-landings',
  'Publishing Companion Sites': 'publishing-companion-sites',
  'Language Tools, Protocols & Experiments': 'language-tools-protocols-experiments',
  'Workflow & Orchestration': 'workflow-orchestration',
  'Development Surfaces & Interfaces': 'development-surfaces-interfaces',
  'Protocols & Decision Systems': 'protocols-decision-systems',
  'Commercial Sites & Interfaces': 'commercial-sites-interfaces',
  'Standalone Utilities': 'standalone-utilities',
};

type SystemsGroup = (typeof systemsEcosystems)[number]['groups'][number];

function itemsForSlugs(artifacts: Artifact[], slugs: readonly string[], usedSlugs: Set<string>): Artifact[] {
  const bySlug = new Map(artifacts.map((artifact) => [artifact.slug, artifact]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((item): item is Artifact => Boolean(item))
    .filter((item) => {
      if (usedSlugs.has(item.slug)) return false;
      usedSlugs.add(item.slug);
      return true;
    });
}

function slugifyFragment(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default async function SystemsPage() {
 const {getArtifactsBySection,ecosystems} = await getLiveCatalogue();
  const artifacts = getArtifactsBySection('systems');
  const editorialBySlug = new Map(getEditorialArticles().map((article) => [article.slug, article]));
  const amiEditorials = getEditorialArticles().filter((article) => article.translationGroup === 'ami-agro-market-infrastructure')
    .map(({ href, linkLabel, language }) => ({ href, linkLabel, language }));
  const pinnedSlugs = new Set(ecosystems.flatMap(ecosystem => ecosystem.groups.flatMap(group => [...group.slugs])));
  const listedArtifacts = ecosystems.flatMap((ecosystem) => ecosystem.groups.flatMap((group) => systemsGroupSlugs(group, artifacts, pinnedSlugs)));
  const listedItems = itemsForSlugs(artifacts, listedArtifacts, new Set<string>());
  const usedSlugs = new Set<string>();

  return (
    <div className="route-systems grid gap-8">
      <JsonLd
        id="jsonld-systems-page"
        data={collectionPageJsonLd({
          id: `${SITE_URL}/systems#page`,
          name: 'Systems Catalogue',
          description: systemsDescription,
          url: `${SITE_URL}/systems`,
          image: systemsOgImage,
        })}
      />
      <JsonLd
        id="jsonld-systems-list"
        data={itemListJsonLd({
          id: `${SITE_URL}/systems#items`,
          name: 'ABVX operational systems',
          items: listedItems.map(artifactListItem),
        })}
      />
      <PageHeader
        eyebrow="Systems Catalogue"
        title="Systems Catalogue"
        summary="AI-native development systems, agentic workflows, reusable skillpacks, orchestration layers, protocols, tools and technical companion systems."
      ><EditorialSectionLink section="systems" /></PageHeader>

      {ecosystems.map((ecosystem) => {
        const titleId = slugifyFragment(ecosystem.title);
        const renderedGroups = ecosystem.groups
          .map((group: SystemsGroup) => ({ ...group, items: itemsForSlugs(artifacts, systemsGroupSlugs(group, artifacts, pinnedSlugs), usedSlugs) }))
          .filter((group) => group.items.length);

        if (!renderedGroups.length) return null;

        return (
          <section key={ecosystem.title} className="home-section systems-ecosystem" aria-labelledby={titleId}>
            <div className="systems-ecosystem__header">
              <div className="eyebrow">Operational ecosystem</div>
              <h2 id={titleId}>{ecosystem.title}</h2>
              <p>{ecosystem.description}</p>
              <EditorialSectionLink article={editorialBySlug.get(ecosystemEditorialSlugs[ecosystem.title])} />
            </div>
            <div className="systems-ecosystem__groups">
              {renderedGroups.map((group) => {
                const groupId = slugifyFragment(group.title);
                return (
                  <section key={group.title} className="systems-subgroup" aria-labelledby={groupId}>
                    <div className="systems-subgroup__header">
                      <h3 id={groupId}>{group.title}</h3>
                      {'description' in group && group.description ? <p>{group.description}</p> : null}
                    <EditorialSectionLink article={editorialBySlug.get(subgroupEditorialSlugs[group.title])} />
                    </div>
                    <div className="systems-grid">
                      {group.items.map((artifact) => (
                        <ProjectCatalogueCard
                          key={artifact.id}
                          artifact={toPublicArtifact(artifact)}
                          meta={group.title}
                          editorialArticles={artifact.slug === 'ami' ? amiEditorials : undefined}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export const dynamic = 'force-dynamic';
