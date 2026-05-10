import type { Artifact, Book, ContentImage } from '@/content';
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
      images: [image.url],
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
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#person` },
    ...(image ? { image: image.url, primaryImageOfPage: { '@type': 'ImageObject', url: image.url, width: image.width, height: image.height, caption: image.alt } } : {}),
  };
}

export function aboutPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${SITE_URL}/about#page`,
    name: 'About / Method',
    description:
      'About Anton Biletskiy-Volokh, ABVX, working method, operating lines and collaboration context.',
    url: `${SITE_URL}/about`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#person` },
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
  if (['brokerage-platform', 'trading-platform', 'market-intelligence', 'market-index', 'web-service'].includes(type)) {
    return 'WebApplication';
  }
  if (['tool', 'ai-workflow'].includes(type)) return 'SoftwareApplication';
  if (['research', 'build-log'].includes(type)) return 'TechArticle';
  return 'CreativeWork';
}

export function artifactJsonLd(artifact: Artifact) {
  const url = `${SITE_URL}/work/${artifact.slug}`;
  const image = artifact.heroImage || artifact.thumbnail;
  const schemaType = artifactSchemaType(artifact.type);

  return {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': `${url}#work`,
    name: artifact.title,
    headline: artifact.title,
    description: seoDescription(artifact.summary, 220),
    url,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    author: { '@id': `${SITE_URL}/#person` },
    creator: { '@id': `${SITE_URL}/#person` },
    keywords: artifact.tags.join(', '),
    datePublished: artifact.publishedAt,
    dateModified: artifact.updatedAt || artifact.publishedAt,
    ...(artifact.status ? { creativeWorkStatus: artifact.status } : {}),
    ...(artifact.group ? { genre: artifact.group } : {}),
    ...(image?.src ? { image: absoluteUrl(image.src) } : {}),
    ...(schemaType === 'SoftwareApplication' || schemaType === 'WebApplication'
      ? {
          applicationCategory: artifact.group || artifact.type,
          operatingSystem: 'Web',
        }
      : {}),
    ...(artifact.links.length
      ? {
          sameAs: artifact.links
            .filter((link) => link.type !== 'site' && link.type !== 'website')
            .map((link) => link.url),
        }
      : {}),
  };
}

export function bookJsonLd(book: Book) {
  const url = `${SITE_URL}/books/${book.slug}`;
  const image = book.heroImage || book.coverImage;

  if (book.type === 'series') {
    return {
      '@context': 'https://schema.org',
      '@type': 'CreativeWorkSeries',
      '@id': `${url}#series`,
      name: book.title,
      description: seoDescription(book.summary, 220),
      url,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      creator: { '@id': `${SITE_URL}/#person` },
      publisher: { '@id': `${SITE_URL}/#person` },
      keywords: book.tags.join(', '),
      ...(image?.src ? { image: absoluteUrl(image.src) } : {}),
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': `${url}#book`,
    name: book.title,
    headline: book.title,
    description: seoDescription(book.summary, 220),
    url,
    isPartOf: book.series
      ? [{ '@id': `${SITE_URL}/#website` }, { '@type': 'CreativeWorkSeries', name: book.series }]
      : { '@id': `${SITE_URL}/#website` },
    author: book.author ? { '@type': 'Person', name: book.author } : { '@id': `${SITE_URL}/#person` },
    translator: book.translator ? { '@type': 'Person', name: book.translator } : undefined,
    publisher: { '@id': `${SITE_URL}/#person` },
    inLanguage: book.language,
    translationOfWork: book.translationOf ? { '@id': `${SITE_URL}/books/${book.translationOf}#book` } : undefined,
    bookFormat: book.availableFormats || book.formats,
    keywords: book.tags.join(', '),
    datePublished: book.publishedAt,
    dateModified: book.updatedAt || book.publishedAt,
    ...(image?.src ? { image: absoluteUrl(image.src) } : {}),
    ...(book.links.length ? { sameAs: book.links.map((link) => link.url) } : {}),
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
