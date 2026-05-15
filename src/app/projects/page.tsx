import LegacyRouteNotice from '@/components/legacy-route-notice';

export const metadata = {
  title: 'Projects Archive',
  description:
    'Web services, AI-agent workflows, protocols, tools, language experiments and technical companions.',
  alternates: { canonical: 'https://abvx.xyz/systems' },
  robots: { index: false, follow: true },
};

export default function ProjectsPage() {
  return (
    <LegacyRouteNotice
      eyebrow="Legacy route"
      title="Projects moved into Systems."
      description="This route is kept for old links. The canonical public catalogue of systems, projects and tools now lives in the Systems Catalogue."
      canonicalHref="/systems"
      canonicalLabel="Systems Catalogue"
    />
  );
}
