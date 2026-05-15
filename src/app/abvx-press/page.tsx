import LegacyRouteNotice from '@/components/legacy-route-notice';

export const metadata = {
  title: 'ABVX Press Direction Archive',
  description: 'Books, translation series, companion landings, free editions, and publishing experiments by ABVX.',
  alternates: { canonical: 'https://abvx.xyz/books' },
  robots: { index: false, follow: true },
};

export default function AbvxPressPage() {
  return (
    <LegacyRouteNotice
      eyebrow="Legacy route"
      title="ABVX Press moved into Books."
      description="This route is kept for old links. Books, translation series, companion landings and publishing systems now live under ABVX Press."
      canonicalHref="/books"
      canonicalLabel="ABVX Press"
    />
  );
}
