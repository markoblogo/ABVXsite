import type { Metadata } from 'next';
import './globals.css';

import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { defaultOgImage } from '@/lib/seo';
import { headers } from 'next/headers';
import { connection } from 'next/server';

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
  jobTitle: 'AI-native Systems, Market Infrastructure, and Strategic Product Development',
  description:
    'Builder of AI-native operating systems for complex markets, with current focus on international agro-commodity brokerage, market intelligence, trading workflows and agentic development infrastructure.',
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
    'AI-assisted brokerage workflows',
    'Workflow automation',
    'Signal extraction',
    'Document processing',
    'CRM and execution coordination',
    'Strategic marketing',
    'Go-to-market strategy',
    'Grant-backed product development',
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
    'A working index for AI-native operating systems, agro-commodity market infrastructure, agentic development tools, strategic product systems, books and essays.',
  inLanguage: 'en',
  author: { '@id': 'https://abvx.xyz/#person' },
  publisher: { '@id': 'https://abvx.xyz/#organization' },
  hasPart: [
    {
      '@type': 'CollectionPage',
      name: 'Current Focus',
      url: 'https://abvx.xyz/focus',
      description: 'Agro-commodity brokerage, market intelligence, trading workflows, commodity indexes and AI-assisted infrastructure.',
    },
    {
      '@type': 'CollectionPage',
      name: 'Systems Catalogue',
      url: 'https://abvx.xyz/systems',
      description: 'AI-native workflows, agent skillpacks, orchestration systems, web services, protocols and operational tools.',
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
    'Anton Biletskyi-Volokh builds AI-native operating systems for complex markets: agro-commodity brokerage, trading workflows, market intelligence and agentic development infrastructure.',
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
      'AI-native operating systems for complex markets: agro-commodity brokerage, trading workflows, market intelligence and agentic development infrastructure.',
    url: 'https://abvx.xyz',
    siteName: 'Anton Biletskyi-Volokh',
    type: 'website',
    images: [defaultOgImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anton Biletskyi-Volokh',
    description:
      'AI-native operating systems for complex markets: agro-commodity brokerage, trading workflows, market intelligence and agentic development infrastructure.',
    images: [defaultOgImage.url],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const nonce = (await headers()).get('x-nonce') || undefined;

  return (
    <html lang="en">
      <head>
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteIdentityJsonLd) }}
        />
        <script
          nonce={nonce}
          async
          src="https://plausible.io/js/pa-nFu64zSZvts0V4s1jndxt.js"
        ></script>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
              plausible.init()
            `,
          }}
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
