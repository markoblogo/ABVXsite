import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import PageHeader from '@/components/PageHeader';
import { getVideoWritingItems, getVideoCompanion } from '@/lib/writing-feed';
import { videoId, videoPageJsonLd } from '@/lib/youtube-pages.mjs';
import { metadataWithImage } from '@/lib/seo';
import styles from '../../[slug]/article.module.css';

export function generateStaticParams() {
  return getVideoWritingItems().map(item => ({ id: videoId(item.videoUrl) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = getVideoWritingItems().find(video => videoId(video.videoUrl) === id);
  if (!item) return { title: 'Video unavailable', robots: { index: false } };
  return metadataWithImage({ title: item.title, description: item.excerpt || item.title,
    canonicalPath: item.url, image: { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, width: 480, height: 360, alt: item.title } });
}

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const companion = getVideoCompanion(id);
  if (companion) permanentRedirect(`/writing/${companion.slug}`);
  const item = getVideoWritingItems().find(video => videoId(video.videoUrl) === id);
  if (!item) notFound();
  return <div className="route-native-writing grid gap-8">
    <JsonLd id="jsonld-watch-video" data={videoPageJsonLd(item)} />
    <PageHeader eyebrow="YouTube / ABVX" title={item.title}>
      <Link className="editorial-section-link" href="/writing">Writing →</Link>
    </PageHeader>
    <div className="native-writing-article__meta">
      <Link href="/about">Anton Biletskyi-Volokh</Link>
      <time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })}</time>
      <a href={item.videoUrl} target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a>
    </div>
    <div className={`native-writing-article__body ${styles.body}`}>
      <YouTubeEmbed href={item.videoUrl!} title={item.title} />
      <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.videoDescription || item.excerpt}</div>
    </div>
  </div>;
}
