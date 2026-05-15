import LegacyRouteNotice from '@/components/legacy-route-notice';

export const metadata = {
  title: 'Lang Lab Direction Archive',
  description: 'Language systems, Toki Pona work, pictographic protocols, translators, and language-AI experiments.',
  alternates: { canonical: 'https://abvx.xyz/systems' },
  robots: { index: false, follow: true },
};

export default function LangLabPage() {
  return (
    <LegacyRouteNotice
      eyebrow="Legacy route"
      title="Lang Lab moved into Systems."
      description="This route is kept for old links. Language systems, Toki Pona tools and visual protocol work now live in the Systems Catalogue."
      canonicalHref="/systems"
      canonicalLabel="Systems Catalogue"
    />
  );
}
