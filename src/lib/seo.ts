import type { Artifact, Book, ContentFaq, ContentImage } from '@/content';
import type { Metadata } from 'next';

export const SITE_URL = 'https://abvx.xyz';

type SeoImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

type BreadcrumbItem = {
  name: string;
  url: string;
};

export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function seoDescription(text: string, maxLength = 170): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;

  const sentence = normalized.match(/^.{90,170}?[.!?](?:\s|$)/)?.[0]?.trim();
  if (sentence && sentence.length <= maxLength) return sentence;

  const clipped = normalized.slice(0, maxLength + 1);
  const boundary = Math.max(clipped.lastIndexOf(' '), 120);
  return `${normalized.slice(0, boundary).trim().replace(/[,:;.-]+$/, '')}...`;
}

export function imageMetadata(
  image: ContentImage | undefined,
  fallback: SeoImage,
  kind: 'book' | 'project' | 'page' = 'project',
): SeoImage {
  if (!image?.src) return fallback;

  const isBook = kind === 'book' || image.role === 'book-cover' || image.mediaRole === 'book-cover';
  return {
    url: absoluteUrl(image.src),
    width: image.width || (isBook ? 1200 : 1200),
    height: image.height || (isBook ? 1600 : 630),
    alt: image.alt || fallback.alt,
  };
}

export function metadataWithImage({
  title,
  description,
  canonicalPath,
  image,
  type = 'website',
}: {
  title: string;
  description: string;
  canonicalPath: string;
  image: SeoImage;
  type?: 'website' | 'article' | 'book';
}): Metadata {
  const url = absoluteUrl(canonicalPath);
  const compactDescription = seoDescription(description);

  return {
    title,
    description: compactDescription,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: compactDescription,
      url,
      type,
      images: [
        {
          url: image.url,
          width: image.width,
          height: image.height,
          alt: image.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: compactDescription,
      images: [
        {
          url: image.url,
          alt: image.alt,
        },
      ],
    },
  };
}

export const defaultOgImage: SeoImage = {
  url: absoluteUrl('/og/abvx-home.png'),
  width: 1200,
  height: 630,
  alt: 'ABVX ecosystem overview',
};

export const focusOgImage: SeoImage = {
  url: absoluteUrl('/og/abvx-focus.png'),
  width: 1200,
  height: 630,
  alt: 'ABVX focus on agro commodity trading infrastructure',
};

export const systemsOgImage: SeoImage = {
  url: absoluteUrl('/og/abvx-systems.png'),
  width: 1200,
  height: 630,
  alt: 'ABVX systems catalogue',
};

export const booksOgImage: SeoImage = {
  url: absoluteUrl('/og/abvx-books.png'),
  width: 1200,
  height: 630,
  alt: 'ABVX Press books and publishing systems',
};

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqPageJsonLd({ id, faqs }: { id: string; faqs: ContentFaq[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': id,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function collectionPageJsonLd({
  id,
  name,
  description,
  url,
  image,
}: {
  id: string;
  name: string;
  description: string;
  url: string;
  image?: SeoImage;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': id,
    name,
    description,
    url,
    mainEntityOfPage: url,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    ...(image ? { image: image.url, primaryImageOfPage: { '@type': 'ImageObject', url: image.url, width: image.width, height: image.height, caption: image.alt } } : {}),
  };
}

export function aboutPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${SITE_URL}/about#page`,
    name: 'About / Method - AI-native systems for complex markets',
    description:
      'About Anton Biletskyi-Volokh: AI-native systems for complex markets, agro-commodity brokerage infrastructure, agentic development workflows, strategic product systems and collaboration context.',
    url: `${SITE_URL}/about`,
    mainEntityOfPage: `${SITE_URL}/about`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#person` },
    audience: [
      { '@type': 'Audience', audienceType: 'grant evaluators' },
      { '@type': 'Audience', audienceType: 'startup founders' },
      { '@type': 'Audience', audienceType: 'agro-commodity market teams' },
      { '@type': 'Audience', audienceType: 'AI-native product and engineering teams' },
    ],
    mentions: [
      'AI-native operating systems',
      'agro-commodity brokerage',
      'market intelligence',
      'commodity indexes',
      'agentic development workflows',
      'strategic go-to-market systems',
      'grant-backed projects',
    ],
  };
}

export function itemListJsonLd({
  id,
  name,
  items,
}: {
  id: string;
  name: string;
  items: Array<{ name: string; url: string; type?: string; image?: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': id,
    name,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': item.type || 'CreativeWork',
        '@id': item.url,
        name: item.name,
        url: item.url,
        ...(item.image ? { image: item.image } : {}),
      },
    })),
  };
}

function artifactSchemaType(type: Artifact['type']) {
  if (['brokerage-platform', 'trading-platform', 'market-intelligence', 'market-index', 'hospitality-interface', 'web-service'].includes(type)) {
    return 'WebApplication';
  }
  if (['tool', 'ai-workflow'].includes(type)) return 'SoftwareApplication';
  if (type === 'plugin') return 'SoftwareSourceCode';
  if (type === 'book-companion') return 'WebPage';
  if (['research', 'build-log'].includes(type)) return 'TechArticle';
  return 'CreativeWork';
}

function artifactSchemaTypes(type: Artifact['type']) {
  const primaryType = artifactSchemaType(type);
  if (type === 'market-index') return [primaryType, 'Dataset', 'DataFeed'];
  if (type === 'market-intelligence') return [primaryType, 'Dataset'];
  return primaryType;
}

function imageObject(image: ContentImage | undefined, fallbackAlt?: string) {
  if (!image?.src) return undefined;
  return {
    '@type': 'ImageObject',
    url: absoluteUrl(image.src),
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {}),
    ...(image.alt || fallbackAlt ? { caption: image.alt || fallbackAlt } : {}),
  };
}

function linkOfType(item: { links: Array<{ type: string; url: string }> }, type: string) {
  return item.links.find((link) => link.type === type);
}

function relatedItemSchemas(items: Array<Artifact | Book>) {
  return items.map((item) => {
    const isBook = 'coverImage' in item;
    const itemUrl = `${SITE_URL}/${isBook ? 'books' : 'work'}/${item.slug}`;
    return {
      '@type': isBook ? (item.type === 'series' ? 'CreativeWorkSeries' : 'Book') : artifactSchemaType(item.type as Artifact['type']),
      '@id': `${itemUrl}${isBook ? (item.type === 'series' ? '#series' : '#book') : '#work'}`,
      name: item.title,
      url: itemUrl,
    };
  });
}

function audienceFromTags(tags: string[]) {
  if (tags.some((tag) => ['agro-commodities', 'brokerage', 'market-infrastructure', 'trading'].includes(tag))) {
    return { '@type': 'Audience', audienceType: 'Commodity market participants, brokers, analysts and operators' };
  }
  if (tags.some((tag) => ['AI', 'ai-workflow', 'llmo', 'automation'].includes(tag))) {
    return { '@type': 'Audience', audienceType: 'AI-native builders, operators and product teams' };
  }
  return { '@type': 'Audience', audienceType: 'Readers, builders and collaborators following the ABVX ecosystem' };
}

function amazonAsins(book: Book) {
  return [...new Set(
    book.links
      .map((link) => link.url.match(/amazon\.[^/]+\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1])
      .filter((asin): asin is string => Boolean(asin)),
  )];
}

export function artifactJsonLd(artifact: Artifact, relatedItems: Array<Artifact | Book> = []) {
  const url = `${SITE_URL}/work/${artifact.slug}`;
  const image = artifact.heroImage || artifact.thumbnail;
  const schemaType = artifactSchemaType(artifact.type);
  const schemaTypes = artifactSchemaTypes(artifact.type);
  const siteLink = linkOfType(artifact, 'site') || linkOfType(artifact, 'website');
  const githubLink = linkOfType(artifact, 'github');
  const imageSchema = imageObject(image, artifact.title);
  const sameAs = artifact.links
    .map((link) => link.url)
    .filter((link) => link !== siteLink?.url);
  const relatedSchemas = relatedItemSchemas(relatedItems);

  return {
    '@context': 'https://schema.org',
    '@type': schemaTypes,
    '@id': `${url}#work`,
    name: artifact.title,
    headline: artifact.title,
    description: seoDescription(artifact.summary, 220),
    url,
    mainEntityOfPage: url,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    author: { '@id': `${SITE_URL}/#person` },
    creator: { '@id': `${SITE_URL}/#person` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    provider: { '@id': `${SITE_URL}/#organization` },
    audience: audienceFromTags(artifact.tags),
    about: artifact.tags.map((tag) => ({ '@type': 'Thing', name: tag })),
    keywords: artifact.tags.join(', '),
    datePublished: artifact.publishedAt,
    dateModified: artifact.updatedAt || artifact.publishedAt,
    ...(artifact.status ? { creativeWorkStatus: artifact.status } : {}),
    ...(artifact.group ? { genre: artifact.group } : {}),
    ...(siteLink ? { sameAs: [siteLink.url, ...sameAs] } : sameAs.length ? { sameAs } : {}),
    ...(githubLink ? { codeRepository: githubLink.url } : {}),
    ...(imageSchema ? { image: imageSchema, primaryImageOfPage: imageSchema } : {}),
    ...(relatedSchemas.length ? { isRelatedTo: relatedSchemas, mentions: relatedSchemas } : {}),
    ...(artifact.type === 'market-index'
      ? {
          additionalType: ['https://schema.org/Dataset', 'https://schema.org/DataFeed'],
          measurementTechnique: 'Reference-price benchmark methodology',
          variableMeasured: artifact.tags
            .filter((tag) => ['grain', 'oilseeds', 'market-data', 'benchmark', 'spot-index', 'price-indexes'].includes(tag))
            .join(', '),
        }
      : {}),
    ...(schemaType === 'SoftwareApplication' || schemaType === 'WebApplication'
      ? {
          applicationCategory: artifact.group || artifact.type,
          operatingSystem: 'Web',
        }
      : {}),
  };
}

export function bookJsonLd(book: Book, relatedItems: Array<Artifact | Book> = []) {
  const url = `${SITE_URL}/books/${book.slug}`;
  const image = book.heroImage || book.coverImage;
  const imageSchema = imageObject(image, book.title);
  const relatedSchemas = relatedItemSchemas(relatedItems);

  if (book.type === 'series') {
    return {
      '@context': 'https://schema.org',
      '@type': 'CreativeWorkSeries',
      '@id': `${url}#series`,
      name: book.title,
      description: seoDescription(book.summary, 220),
      url,
      mainEntityOfPage: url,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      creator: { '@id': `${SITE_URL}/#person` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      audience: audienceFromTags(book.tags),
      about: book.tags.map((tag) => ({ '@type': 'Thing', name: tag })),
      keywords: book.tags.join(', '),
      ...(book.links.length ? { sameAs: book.links.map((link) => link.url) } : {}),
      ...(imageSchema ? { image: imageSchema, primaryImageOfPage: imageSchema } : {}),
      ...(relatedSchemas.length ? { isRelatedTo: relatedSchemas, mentions: relatedSchemas } : {}),
    };
  }

  const isPartOf = [
    { '@id': `${SITE_URL}/#website` },
    ...(book.primarySeriesSlug
      ? [{ '@type': 'CreativeWorkSeries', '@id': `${SITE_URL}/books/${book.primarySeriesSlug}#series` }]
      : []),
    ...(!book.primarySeriesSlug && book.series ? [{ '@type': 'CreativeWorkSeries', name: book.series }] : []),
  ];
  const asins = amazonAsins(book);

  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': `${url}#book`,
    name: book.title,
    headline: book.title,
    description: seoDescription(book.summary, 220),
    url,
    mainEntityOfPage: url,
    isPartOf: isPartOf.length === 1 ? isPartOf[0] : isPartOf,
    author: book.author ? { '@type': 'Person', name: book.author } : { '@id': `${SITE_URL}/#person` },
    creator: book.author ? { '@type': 'Person', name: book.author } : { '@id': `${SITE_URL}/#person` },
    translator: book.translator ? { '@type': 'Person', name: book.translator } : undefined,
    publisher: { '@id': `${SITE_URL}/#organization` },
    audience: audienceFromTags(book.tags),
    about: book.tags.map((tag) => ({ '@type': 'Thing', name: tag })),
    inLanguage: book.language,
    translationOfWork: book.translationOf ? { '@id': `${SITE_URL}/books/${book.translationOf}#book` } : undefined,
    bookFormat: book.availableFormats || book.formats,
    keywords: book.tags.join(', '),
    datePublished: book.publishedAt,
    dateModified: book.updatedAt || book.publishedAt,
    ...(asins.length
      ? {
          identifier: asins.map((asin) => ({
            '@type': 'PropertyValue',
            propertyID: 'ASIN',
            value: asin,
          })),
        }
      : {}),
    ...(imageSchema ? { image: imageSchema, primaryImageOfPage: imageSchema } : {}),
    ...(book.links.length ? { sameAs: book.links.map((link) => link.url) } : {}),
    ...(relatedSchemas.length ? { isRelatedTo: relatedSchemas, mentions: relatedSchemas } : {}),
  };
}

export function bookListItem(book: Book) {
  return {
    name: book.title,
    url: `${SITE_URL}/books/${book.slug}`,
    type: book.type === 'series' ? 'CreativeWorkSeries' : 'Book',
    image: (book.heroImage || book.coverImage)?.src ? absoluteUrl((book.heroImage || book.coverImage)!.src) : undefined,
  };
}

export function artifactListItem(artifact: Artifact) {
  return {
    name: artifact.title,
    url: `${SITE_URL}/work/${artifact.slug}`,
    type: artifactSchemaType(artifact.type),
    image: (artifact.heroImage || artifact.thumbnail)?.src
      ? absoluteUrl((artifact.heroImage || artifact.thumbnail)!.src)
      : undefined,
  };
}
