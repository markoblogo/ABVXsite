import LegacyRouteNotice from '@/components/legacy-route-notice';

export const metadata = {
  title: 'Tech Lab Direction Archive',
  description: 'AI-development tooling, open-source utilities, landing systems, services, and shipped experiments.',
  alternates: { canonical: 'https://abvx.xyz/systems' },
  robots: { index: false, follow: true },
};

export default function TechLabPage() {
  return (
    <LegacyRouteNotice
      eyebrow="Legacy route"
      title="Tech Lab moved into Systems."
      description="This route is kept for old links. AI-native development tools, workflows and technical systems now live in the Systems Catalogue."
      canonicalHref="/systems"
      canonicalLabel="Systems Catalogue"
    />
  );
}
