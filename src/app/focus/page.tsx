import ArtifactCard from '@/components/ArtifactCard';
import PageHeader from '@/components/PageHeader';
import SectionPanel from '@/components/SectionPanel';
import { getArtifactsBySection, getLatestArtifact } from '@/content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Focus',
  description:
    'Current ABVX focus: agro-commodity trading infrastructure, market tools, services, monitors, and related systems.',
  alternates: { canonical: 'https://abvx.xyz/focus' },
};

export default function FocusPage() {
  const artifacts = getArtifactsBySection('focus');
  const latest = getLatestArtifact('focus');

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Current focus"
        title="Agro-commodity market infrastructure"
        summary="Digital operating layers for physical commodity trading: services, monitors, dashboards, brokerage workflows, and market-risk tools."
      />

      {latest ? (
        <SectionPanel title={latest.title} eyebrow="Lead thread" accent>
          <p>{latest.summary}</p>
        </SectionPanel>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        {artifacts.map((artifact) => (
          <ArtifactCard key={artifact.id} artifact={artifact} />
        ))}
      </section>
    </div>
  );
}
