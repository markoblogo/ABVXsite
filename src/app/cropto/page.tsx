import LegacyRouteNotice from '@/components/legacy-route-notice';

export const metadata = {
  title: 'Cropto Direction Archive',
  description: 'Commodity trading infrastructure: services, dashboards, monitors, and productized market tools.',
  alternates: { canonical: 'https://abvx.xyz/focus' },
  robots: { index: false, follow: true },
};

export default function CroptoPage() {
  return (
    <LegacyRouteNotice
      eyebrow="Legacy route"
      title="Cropto moved into Focus."
      description="This route is kept for old links. The canonical Cropto and agro-market infrastructure catalogue now lives under Current Focus."
      canonicalHref="/focus"
      canonicalLabel="Current Focus"
    />
  );
}
