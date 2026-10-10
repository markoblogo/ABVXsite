import JsonLd from '@/components/JsonLd';
import MarkdownContent from '@/components/MarkdownContent';
import MediaPanel from '@/components/MediaPanel';
import PageHeader from '@/components/PageHeader';
import { getNativeWritingBySlug, getNativeWritingItems } from '@/content';
import { defaultOgImage, imageMetadata, metadataWithImage, SITE_URL } from '@/lib/seo';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from './article.module.css';
import YouTubeEmbed, { youtubeVideoId } from '@/components/YouTubeEmbed';

const languageLabels = { en: 'English', fr: 'Français', uk: 'Українською' };
const translationNavLabels = { en: 'Other languages', fr: 'Autres langues', uk: 'Інші мови' };

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
    title: item.seoTitle || item.title,
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
  const videoId = item.videoUrl ? youtubeVideoId(item.videoUrl) : null;

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
          ...(item.heroImage || item.coverImage ? { image: new URL((item.heroImage || item.coverImage)!.src, SITE_URL).href } : {}),
          author: {
            '@type': 'Person',
            '@id': `${SITE_URL}/#person`,
            name: 'Anton Biletskyi-Volokh',
            url: `${SITE_URL}/about`,
          },
          publisher: {
            '@type': 'Organization',
            name: 'ABVX',
          },
        }}
      />
      {videoId ? <JsonLd id="jsonld-native-video" data={{
        '@context': 'https://schema.org', '@type': 'VideoObject',
        name: item.title, description: item.summary,
        uploadDate: item.videoUploadedAt,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        url, mainEntityOfPage: url,
        creator: { '@type': 'Person', '@id': `${SITE_URL}/#person`, name: 'Anton Biletskyi-Volokh' },
      }} /> : null}
      <PageHeader eyebrow="ABVX" title={item.title} summary={item.summary}>
        <Link className="editorial-section-link" href="/writing">Writing <span aria-hidden="true">→</span></Link>
      </PageHeader>
      <div className="native-writing-article__meta">
        <Link href="/about">Anton Biletskyi-Volokh</Link>
        <span>{item.publishedAt ?? 'Undated'}</span>
        <span>{item.type}</span>
        {item.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      {item.translationGroup ? (
        <nav aria-label={translationNavLabels[item.language || 'en']} className="link-strip">
          {getNativeWritingItems().filter((translation) => translation.translationGroup === item.translationGroup && translation.slug !== item.slug && translation.language).map((translation) => (
            <a key={translation.slug} href={`/writing/${translation.slug}`} hrefLang={translation.language} lang={translation.language}>
              {languageLabels[translation.language || 'en']}
            </a>
          ))}
        </nav>
      ) : null}
      <div className={`native-writing-article__body ${styles.body}`}>
        {item.videoUrl ? <YouTubeEmbed href={item.videoUrl} title={item.title} />
          : item.heroImage || item.coverImage ? <MediaPanel image={item.heroImage || item.coverImage} title={item.title} variant="writing" priority /> : null}
        <MarkdownContent>{item.body}</MarkdownContent>
      </div>
    </div>
  );
}
