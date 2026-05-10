import ProjectCatalogueCard from '@/components/ProjectCatalogueCard';
import PageHeader from '@/components/PageHeader';
import { getArtifactsBySection } from '@/content';
import type { Artifact } from '@/content';
import { toPublicArtifact } from '@/content/public-props';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Systems Catalogue',
  description: 'Services, workflows, protocols, tools and technical companion systems.',
  alternates: { canonical: 'https://abvx.xyz/systems' },
};

const ecosystems = [
  {
    title: 'Agro Market Infrastructure Systems',
    description: 'Trading, monitoring and market infrastructure systems for physical agro-commodity operations.',
    groups: [
      {
        title: 'Trading & Brokerage Platforms',
        slugs: ['cropto', 'mn7r'],
      },
      {
        title: 'Monitoring & Intelligence',
        slugs: ['cropto-monitor', 'last30days-cropto', 'uga-index'],
      },
      {
        title: 'Market Fronts & Landings',
        slugs: ['liqua', 'trade-solution-eu', 'cropto-market-risk-deck'],
      },
    ],
  },
  {
    title: 'Publishing & Language Systems',
    description: 'Publishing companion systems, translation tools and experimental language infrastructure.',
    groups: [
      {
        title: 'Publishing Companion Sites',
        slugs: [
          'chinese-wisdom-toki-pona-landing',
          'stoic-wisdom-toki-pona-landing',
          'ukrainian-modernism-landing',
          'toki-pona-free-kits-landing',
        ],
      },
      {
        title: 'Language Tools, Protocols & Experiments',
        slugs: ['toki-pona-ai-translator', 'pictiq', 'sitelen-emoji-truth'],
      },
    ],
  },
  {
    title: 'AI-native Development Systems',
    description: 'AI-native workflows, orchestration systems, development protocols and operational tooling.',
    groups: [
      {
        title: 'Workflow & Orchestration',
        description:
          'Operational orchestration systems for AI-assisted development workflows, structured execution and agent coordination.',
        slugs: ['set', 'agents-md-generator'],
      },
      {
        title: 'Development Surfaces & Interfaces',
        description:
          'Development surfaces, interfaces and operational environments for AI-native workflows, publishing and programmable systems.',
        slugs: ['abvx-lab', 'ascii-theme', 'llmo-site'],
      },
      {
        title: 'Protocols & Decision Systems',
        description:
          'Protocols, decision systems and structured operational interfaces for AI-native coordination, reasoning and development communication.',
        slugs: ['id', 'decision-map', 'git-tweet'],
      },
    ],
  },
  {
    title: 'Standalone Utilities & Experiments',
    description: 'Independent utilities, interfaces and small software experiments outside the main ecosystems.',
    slugs: ['ytmamp', 'abvx-shortener'],
  },
] as const;

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

export default function SystemsPage() {
  const artifacts = getArtifactsBySection('systems');
  const usedSlugs = new Set<string>();

  return (
    <div className="route-systems grid gap-8">
      <PageHeader
        eyebrow="Systems Catalogue"
        title="Systems Catalogue"
        summary="Services, workflows, protocols, tools and technical companion systems."
      />

      {ecosystems.map((ecosystem, index) => {
        const titleId = `systems-ecosystem-${index}`;

        if ('groups' in ecosystem) {
          const renderedGroups = ecosystem.groups
            .map((group) => ({ ...group, items: itemsForSlugs(artifacts, group.slugs, usedSlugs) }))
            .filter((group) => group.items.length);

          if (!renderedGroups.length) return null;

          return (
            <section key={ecosystem.title} className="home-section systems-ecosystem" aria-labelledby={titleId}>
              <div className="systems-ecosystem__header">
                <div className="eyebrow">Operational ecosystem</div>
                <h2 id={titleId}>{ecosystem.title}</h2>
                <p>{ecosystem.description}</p>
              </div>

              <div className="systems-ecosystem__groups">
                {renderedGroups.map((group) => (
                  <section key={group.title} className="systems-subgroup">
                    <div className="systems-subgroup__header">
                      <h3>{group.title}</h3>
                      {'description' in group && group.description ? <p>{group.description}</p> : null}
                    </div>
                    <div className="systems-grid">
                      {group.items.map((artifact) => (
                        <ProjectCatalogueCard
                          key={artifact.id}
                          artifact={toPublicArtifact(artifact)}
                          meta={group.title}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          );
        }

        const items = itemsForSlugs(artifacts, ecosystem.slugs, usedSlugs);
        if (!items.length) return null;

        return (
          <section key={ecosystem.title} className="home-section systems-ecosystem" aria-labelledby={titleId}>
            <div className="systems-ecosystem__header">
              <div className="eyebrow">Operational ecosystem</div>
              <h2 id={titleId}>{ecosystem.title}</h2>
              <p>{ecosystem.description}</p>
            </div>
            <div className="systems-grid systems-grid--standalone">
              {items.map((artifact) => (
                <ProjectCatalogueCard
                  key={artifact.id}
                  artifact={toPublicArtifact(artifact)}
                  meta={ecosystem.title}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
