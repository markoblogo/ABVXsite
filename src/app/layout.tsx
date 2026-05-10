import type { Metadata } from 'next';
import './globals.css';

import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { defaultOgImage } from '@/lib/seo';

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
const bingVerification =
  process.env.BING_SITE_VERIFICATION || '6eb9686badc546c2ac215812a702e4e4';

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://abvx.xyz/#person',
  name: 'Anton Biletskyi-Volokh',
  url: 'https://abvx.xyz',
  jobTitle: 'Systems, Strategy, and Product Development',
  description:
    'Designer and builder of complex systems across strategy, markets, technology, language, and AI.',
  knowsAbout: [
    'Market infrastructure',
    'Agro-commodity trading',
    'AI-native development',
    'Agentic workflows',
    'Web services',
    'Protocols',
    'Constructed languages',
    'Publishing',
    'Translations',
  ],
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
  '@id': 'https://abvx.xyz/#website',
  name: 'ABVX',
  url: 'https://abvx.xyz',
  description:
    'A working index of systems, strategy, market infrastructure, AI-native development, language experiments, books, translations, and essays.',
  inLanguage: 'en',
  author: { '@id': 'https://abvx.xyz/#person' },
  publisher: { '@id': 'https://abvx.xyz/#person' },
  hasPart: [
    {
      '@type': 'CollectionPage',
      name: 'Current Focus',
      url: 'https://abvx.xyz/focus',
      description: 'Agro-commodity trading infrastructure and related systems.',
    },
    {
      '@type': 'CollectionPage',
      name: 'Systems Catalogue',
      url: 'https://abvx.xyz/systems',
      description: 'Web services, AI workflows, protocols, tools, and language experiments.',
    },
    {
      '@type': 'CollectionPage',
      name: 'ABVX Press',
      url: 'https://abvx.xyz/books',
      description: 'Books, translations, series, and publishing projects.',
    },
    {
      '@type': 'CollectionPage',
      name: 'Writing',
      url: 'https://abvx.xyz/writing',
      description: 'Medium and Substack essays, build logs, and research notes.',
    },
  ],
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
    images: [defaultOgImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anton Biletskyi-Volokh',
    description:
      'Live working index for systems, strategy, market infrastructure, agentic development, language experiments, books, and essays.',
    images: [defaultOgImage.url],
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
