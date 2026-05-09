import ArtifactCard from '@/components/ArtifactCard';
import PageHeader from '@/components/PageHeader';
import type { ArtifactType } from '@/content';
import { getArtifactsBySection } from '@/content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Systems Catalogue',
  description:
    'Web services, AI-agent workflows, protocols, tools, language experiments and technical companions built for my own, partner and client projects.',
  alternates: { canonical: 'https://abvx.xyz/systems' },
};

const typeLabels: Partial<Record<ArtifactType, string>> = {
  'web-service': 'Web services',
  'ai-workflow': 'AI workflows',
  protocol: 'Protocols',
  tool: 'Tools',
  'language-experiment': 'Language experiments',
  'book-companion': 'Book companions',
};

export default function SystemsPage() {
  const artifacts = getArtifactsBySection('systems');
  const grouped = artifacts.reduce<Partial<Record<ArtifactType, typeof artifacts>>>((acc, artifact) => {
    acc[artifact.type] ||= [];
    acc[artifact.type]?.push(artifact);
    return acc;
  }, {});

  return (
    <div className="route-systems grid gap-8">
      <PageHeader
        eyebrow="Systems Catalogue"
        title="Systems Catalogue"
        summary="Web services, AI-agent workflows, protocols, tools, language experiments and technical companions built for my own, partner and client projects."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {artifacts.map((artifact) => (
          <ArtifactCard key={artifact.id} artifact={artifact} />
        ))}
      </section>

      <section className="home-section" aria-labelledby="systems-groups-title">
        <div className="home-section__header">
          <div className="eyebrow">Grouped by type</div>
          <h2 id="systems-groups-title">Services, workflows, protocols, tools.</h2>
        </div>
        <div className="grid gap-6">
          {Object.entries(grouped).map(([type, items]) => (
            <section key={type} className="grid gap-3">
              <h3 className="group-title">
                {typeLabels[type as ArtifactType] || type}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {items?.map((artifact) => (
                  <ArtifactCard key={artifact.id} artifact={artifact} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
