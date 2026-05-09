import type { Metadata } from 'next';
import './globals.css';

import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
const bingVerification =
  process.env.BING_SITE_VERIFICATION || '6eb9686badc546c2ac215812a702e4e4';

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Anton Biletskyi-Volokh',
  url: 'https://abvx.xyz',
  jobTitle: 'Systems, Strategy, and Product Development',
  sameAs: [
    'https://www.linkedin.com/in/abvcreative/',
    'https://github.com/markoblogo',
    'https://abvcreative.medium.com/',
    'https://abvx.substack.com/',
    'https://www.youtube.com/@ABV_Creative',
    'https://x.com/abv_creative',
    'https://www.behance.net/ABV_Creative',
    'https://www.instagram.com/abvcreative/',
    'https://t.me/ABVcreative',
    'https://www.vivino.com/users/anthony.bile',
    'https://bsky.app/profile/abvx.xyz',
  ],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ABVX',
  url: 'https://abvx.xyz',
};

export const metadata: Metadata = {
  title: {
    default: 'Anton Biletskyi-Volokh',
    template: '%s · Anton Biletskyi-Volokh',
  },
  description:
    'Live working index for systems, strategy, market infrastructure, agentic development, language experiments, books, and essays.',
  metadataBase: new URL('https://abvx.xyz'),
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    other: {
      ...(bingVerification ? { 'msvalidate.01': bingVerification } : {}),
    },
  },
  openGraph: {
    title: 'Anton Biletskyi-Volokh',
    description:
      'Live working index for systems, strategy, market infrastructure, agentic development, language experiments, books, and essays.',
    url: 'https://abvx.xyz',
    siteName: 'Anton Biletskyi-Volokh',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anton Biletskyi-Volokh',
    description:
      'Live working index for systems, strategy, market infrastructure, agentic development, language experiments, books, and essays.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body>
        <SiteHeader />
        <main className="site-main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
