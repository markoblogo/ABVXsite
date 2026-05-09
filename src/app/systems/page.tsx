import ArtifactCard from '@/components/ArtifactCard';
import PageHeader from '@/components/PageHeader';
import { getArtifactsBySection } from '@/content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Systems',
  description:
    'ABVX systems catalogue: web services, AI/dev tools, protocols, language experiments, and technical companions.',
  alternates: { canonical: 'https://abvx.xyz/systems' },
};

export default function SystemsPage() {
  const artifacts = getArtifactsBySection('systems');

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Systems catalogue"
        title="Tools, protocols, services, companions."
        summary="A catalogue of working systems and technical artifacts: AI-development workflows, web utilities, protocols, language experiments, and infrastructure companions."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {artifacts.map((artifact) => (
          <ArtifactCard key={artifact.id} artifact={artifact} />
        ))}
      </section>
    </div>
  );
}
