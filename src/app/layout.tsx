import type { Metadata } from 'next';
import './globals.css';

import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { defaultOgImage } from '@/lib/seo';

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
const bingVerification =
  process.env.BING_SITE_VERIFICATION || '6eb9686badc546c2ac215812a702e4e4';

const personJsonLd = {
  '@type': 'Person',
  '@id': 'https://abvx.xyz/#person',
  name: 'Anton Biletskyi-Volokh',
  alternateName: [
    'Anton Biletskiy-Volokh',
    'Anton Biletskyi Volokh',
    'Anton Biletskiy Volokh',
    'ABV Creative',
    'ABVX',
  ],
  url: 'https://abvx.xyz',
  jobTitle: 'Systems, Strategy, and Product Development',
  description:
    'Designer and builder of complex systems across strategy, markets, technology, language, and AI.',
  identifier: [
    {
      '@type': 'PropertyValue',
      propertyID: 'canonical-site',
      value: 'https://abvx.xyz/#person',
    },
    {
      '@type': 'PropertyValue',
      propertyID: 'github',
      value: 'markoblogo',
    },
    {
      '@type': 'PropertyValue',
      propertyID: 'linkedin',
      value: 'abvcreative',
    },
  ],
  knowsAbout: [
    'Market infrastructure',
    'Agro-commodity trading',
    'Commodity indexes',
    'Benchmark infrastructure',
    'Market intelligence systems',
    'AI-native development',
    'Agentic workflows',
    'LLM optimization',
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

const organizationJsonLd = {
  '@type': 'Organization',
  '@id': 'https://abvx.xyz/#organization',
  name: 'ABVX',
  alternateName: [
    'ABVX Press',
    'ABV Creative',
    'Anton Biletskyi-Volokh public work index',
  ],
  url: 'https://abvx.xyz',
  logo: {
    '@type': 'ImageObject',
    url: 'https://abvx.xyz/brand/abv-mark-512.png',
    width: 512,
    height: 512,
  },
  founder: { '@id': 'https://abvx.xyz/#person' },
  identifier: [
    {
      '@type': 'PropertyValue',
      propertyID: 'canonical-site',
      value: 'https://abvx.xyz/#organization',
    },
    {
      '@type': 'PropertyValue',
      propertyID: 'github',
      value: 'markoblogo',
    },
  ],
  sameAs: [
    'https://github.com/markoblogo',
    'https://abvx.substack.com/',
    'https://bsky.app/profile/abvx.xyz',
  ],
};

const websiteJsonLd = {
  '@type': 'WebSite',
  '@id': 'https://abvx.xyz/#website',
  name: 'ABVX',
  alternateName: [
    'ABVX public work index',
    'Anton Biletskyi-Volokh working index',
  ],
  url: 'https://abvx.xyz',
  description:
    'A working index of systems, strategy, market infrastructure, AI-native development, language experiments, books, translations, and essays.',
  inLanguage: 'en',
  author: { '@id': 'https://abvx.xyz/#person' },
  publisher: { '@id': 'https://abvx.xyz/#organization' },
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
    {
      '@type': 'DigitalDocument',
      name: 'ABVX public LLM index',
      url: 'https://abvx.xyz/llms.txt',
      encodingFormat: 'text/plain',
      description: 'Plain-text public index for LLM crawlers and AI agents.',
    },
    {
      '@type': 'DataCatalog',
      name: 'ABVX structured public content index',
      url: 'https://abvx.xyz/content-index.json',
      encodingFormat: 'application/json',
      description: 'Machine-readable JSON inventory of public ABVX content.',
    },
  ],
};

const siteIdentityJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [personJsonLd, organizationJsonLd, websiteJsonLd],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteIdentityJsonLd) }}
        />
        <link rel="alternate" type="text/plain" title="ABVX public LLM index" href="/llms.txt" />
        <link rel="alternate" type="application/json" title="ABVX structured content index" href="/content-index.json" />
        <link rel="alternate" type="application/rss+xml" title="ABVX Medium feed" href="https://abvcreative.medium.com/feed" />
        <link rel="alternate" type="application/rss+xml" title="ABVX Substack feed" href="https://abvx.substack.com/feed" />
      </head>
      <body>
        <SiteHeader />
        <main className="site-main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
