import JsonLd from '@/components/JsonLd';
import MarkdownContent from '@/components/MarkdownContent';
import PageHeader from '@/components/PageHeader';
import { getNativeWritingBySlug, getNativeWritingItems } from '@/content';
import { defaultOgImage, imageMetadata, metadataWithImage, SITE_URL } from '@/lib/seo';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return getNativeWritingItems().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getNativeWritingBySlug(slug);
  if (!item) {
    return {
      title: 'Writing',
      alternates: { canonical: `${SITE_URL}/writing/${slug}` },
    };
  }

  const translations = getNativeWritingItems().filter((candidate) =>
    item.translationGroup && candidate.translationGroup === item.translationGroup && candidate.language);
  const metadata = metadataWithImage({
    title: item.title,
    description: item.summary,
    canonicalPath: `/writing/${item.slug}`,
    image: imageMetadata(item.heroImage || item.coverImage, defaultOgImage, 'page'),
    type: 'article',
  });
  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      ...(translations.length > 1 ? { languages: Object.fromEntries(translations.map((translation) =>
        [translation.language!, `${SITE_URL}/writing/${translation.slug}`])) } : {}),
    },
  };
}

export default async function NativeWritingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getNativeWritingBySlug(slug);
  if (!item) notFound();

  const url = `${SITE_URL}/writing/${item.slug}`;

  return (
    <div className="route-native-writing grid gap-8">
      <JsonLd
        id="jsonld-native-writing"
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: item.title,
          inLanguage: item.language || 'en',
          description: item.summary,
          datePublished: item.publishedAt,
          dateModified: item.updatedAt || item.publishedAt,
          url,
          mainEntityOfPage: url,
          author: {
            '@type': 'Person',
            name: 'Anton BV',
          },
          publisher: {
            '@type': 'Organization',
            name: 'ABVX',
          },
        }}
      />
      <PageHeader eyebrow="ABVX" title={item.title} summary={item.summary} />
      <div className="native-writing-article__meta">
        <span>{item.publishedAt ?? 'Undated'}</span>
        <span>{item.type}</span>
        {item.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      {item.translationGroup ? (
        <nav aria-label={item.language === 'uk' ? 'Інші мови' : 'Autres langues'} className="link-strip">
          {getNativeWritingItems().filter((translation) => translation.translationGroup === item.translationGroup && translation.slug !== item.slug).map((translation) => (
            <a key={translation.slug} href={`/writing/${translation.slug}`} hrefLang={translation.language} lang={translation.language}>
              {translation.language === 'uk' ? 'Українською' : 'Français'}
            </a>
          ))}
        </nav>
      ) : null}
      <MarkdownContent className="native-writing-article__body">{item.body}</MarkdownContent>
    </div>
  );
}
