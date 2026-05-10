import ProjectCatalogueCard from '@/components/ProjectCatalogueCard';
import PageHeader from '@/components/PageHeader';
import { getArtifactsBySection } from '@/content';
import { toPublicArtifact } from '@/content/public-props';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Systems Catalogue',
  description:
    'Web services, AI-agent workflows, protocols, tools, language experiments and technical companions built for my own, partner and client projects.',
  alternates: { canonical: 'https://abvx.xyz/systems' },
};

export default function SystemsPage() {
  const artifacts = getArtifactsBySection('systems');
  const grouped = artifacts.reduce<Record<string, typeof artifacts>>((acc, artifact) => {
    const group = artifact.group || 'Other systems';
    acc[group] ||= [];
    acc[group]?.push(artifact);
    return acc;
  }, {});

  return (
    <div className="route-systems grid gap-8">
      <PageHeader
        eyebrow="Systems Catalogue"
        title="Systems Catalogue"
        summary="Web services, AI-agent workflows, protocols, tools, language experiments and technical companions built for my own, partner and client projects."
      />

      <section className="home-section" aria-labelledby="systems-groups-title">
        <div className="home-section__header">
          <div className="eyebrow">Working technical index</div>
          <h2 id="systems-groups-title">Services, workflows, protocols, tools.</h2>
        </div>
        <div className="grid gap-6">
          {Object.entries(grouped).map(([group, items]) => (
            <section key={group} className="grid gap-3">
              <h3 className="group-title">{group}</h3>
              <div className="systems-grid">
                {items?.map((artifact) => (
                  <ProjectCatalogueCard key={artifact.id} artifact={toPublicArtifact(artifact)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
