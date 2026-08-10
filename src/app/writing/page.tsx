import JsonLd from '@/components/JsonLd';
import PageHeader from '@/components/PageHeader';
import FeaturedWritingCard from '@/components/FeaturedWritingCard';
import RecentWritingCard from '@/components/RecentWritingCard';
import SectionPanel from '@/components/SectionPanel';
import WritingArchiveRow from '@/components/WritingArchiveRow';
import WritingSourceLinks, { type WritingSource } from '@/components/WritingSourceLinks';
import {
  fetchMediumFeed,
  fetchSubstackFeed,
  mergeFeeds,
  type FeedItem,
} from '@/lib/feeds';
import { getNativeWritingItems } from '@/content';
import { collectionPageJsonLd, defaultOgImage, itemListJsonLd, metadataWithImage, SITE_URL } from '@/lib/seo';
import type { Metadata } from 'next';

const writingDescription =
  'Applied AI reviews, build logs and essays on systems, validation, agent workflows, decision-making and how ideas survive contact with reality.';

export const metadata: Metadata = metadataWithImage({
  title: 'Writing',
  description: writingDescription,
  canonicalPath: '/writing',
  image: defaultOgImage,
});

export const revalidate = 900;

const RECENT_POST_COUNT = 6;
const ARCHIVE_POST_LIMIT = 30;

async function safeFeed(fetcher: (url: string) => Promise<FeedItem[]>, url: string) {
  try {
    return await fetcher(url);
  } catch {
    return [];
  }
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function normalizeSource(source: string | string[] | undefined): WritingSource {
  const value = Array.isArray(source) ? source[0] : source;
  if (value === 'medium' || value === 'substack' || value === 'abvx') return value;
  return 'all';
}

function postExcerpt(post: FeedItem): string {
  return post.excerpt || 'External essay from the ABVX writing archive.';
}

function sentenceExcerpt(text: string, sentenceLimit = 3): string {
  const clean = text
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return '';

  const sentences = clean.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map((value) => value.trim()).filter(Boolean) ?? [];
  const excerpt = sentences.slice(0, sentenceLimit).join(' ').trim();
  if (!excerpt) return '';
  return excerpt.length > 420 ? `${excerpt.slice(0, 417).trimEnd()}…` : excerpt;
}

function nativeBodyExcerpt(post: FeedItem, sentenceLimit = 4): string | undefined {
  if (post.source !== 'abvx' || post.coverImage || !post.url.startsWith('/writing/')) return undefined;
  const slug = post.url.replace(/^\/writing\//, '');
  const item = getNativeWritingItems().find((candidate) => candidate.slug === slug);
  if (!item) return undefined;

  const bodyExcerpt = sentenceExcerpt(item.body, sentenceLimit);
  if (!bodyExcerpt) return undefined;

  const normalizedSummary = item.summary.replace(/\s+/g, ' ').trim().toLowerCase();
  const normalizedBodyExcerpt = bodyExcerpt.replace(/\s+/g, ' ').trim().toLowerCase();
  return normalizedSummary && normalizedSummary !== normalizedBodyExcerpt ? bodyExcerpt : undefined;
}

function postImage(post: FeedItem) {
  return post.coverImage ? { src: post.coverImage, alt: post.title } : undefined;
}

function nativeWritingFeed(): FeedItem[] {
  return getNativeWritingItems().map((item) => ({
    source: 'abvx',
    title: item.title,
    url: `/writing/${item.slug}`,
    publishedAt: item.updatedAt || item.publishedAt || new Date().toISOString(),
    author: 'Anton BV',
    tags: item.tags,
    excerpt: item.summary || item.body.split(/\n+/).find(Boolean) || 'Native ABVX writing.',
    coverImage: item.coverImage?.src,
  }));
}

export default async function WritingPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : {};
  const activeSource = normalizeSource(params.source);
  const [medium, substack] = await Promise.all([
    safeFeed(fetchMediumFeed, 'https://abvcreative.medium.com/feed'),
    safeFeed(fetchSubstackFeed, 'https://abvx.substack.com/feed'),
  ]);
  const allPosts = mergeFeeds(nativeWritingFeed(), medium, substack);
  const posts =
    activeSource === 'all' ? allPosts : allPosts.filter((post) => post.source === activeSource);
  const featuredPost = posts[0];
  const recentPosts = posts.slice(1, RECENT_POST_COUNT + 1);
  const archivePosts = posts.slice(RECENT_POST_COUNT + 1, RECENT_POST_COUNT + 1 + ARCHIVE_POST_LIMIT);

  return (
    <div className="route-writing writing-page grid gap-8">
      <JsonLd
        id="jsonld-writing-page"
        data={collectionPageJsonLd({
          id: `${SITE_URL}/writing#page`,
          name: 'Writing',
          description: writingDescription,
          url: `${SITE_URL}/writing`,
          image: defaultOgImage,
        })}
      />
      <JsonLd
        id="jsonld-writing-list"
        data={itemListJsonLd({
          id: `${SITE_URL}/writing#items`,
          name: 'ABVX writing archive',
          items: allPosts.slice(0, 20).map((post) => ({
            name: post.title,
            url: post.url,
            type: 'Article',
            image: post.coverImage,
          })),
        })}
      />
      <PageHeader
        eyebrow="Writing"
        title="Writing"
        summary="Applied AI reviews, build logs and essays on systems, validation, agent workflows, decision-making and how ideas survive contact with reality."
      />

      <WritingSourceLinks active={activeSource} />

      {featuredPost ? (
        <>
          <section className="writing-section writing-section--featured" aria-labelledby="featured-writing-title">
            <div className="writing-section__header">
              <div className="eyebrow">Latest essay</div>
              <h2 id="featured-writing-title">Featured latest</h2>
            </div>
            <FeaturedWritingCard
              title={featuredPost.title}
              excerpt={postExcerpt(featuredPost)}
              asideExcerpt={nativeBodyExcerpt(featuredPost, 4)}
              href={featuredPost.url}
              source={featuredPost.source}
              date={formatDate(featuredPost.publishedAt)}
              image={postImage(featuredPost)}
            />
          </section>

          {recentPosts.length ? (
            <section className="writing-section" aria-labelledby="recent-writing-title">
              <div className="writing-section__header">
                <div className="eyebrow">Recent writing</div>
                <h2 id="recent-writing-title">Recent posts</h2>
              </div>
              <div className="recent-writing-grid">
                {recentPosts.map((post) => (
                  <RecentWritingCard
                    key={post.url}
                    title={post.title}
                    excerpt={postExcerpt(post)}
                    bodyExcerpt={nativeBodyExcerpt(post, 3)}
                    href={post.url}
                    source={post.source}
                    date={formatDate(post.publishedAt)}
                    image={postImage(post)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {archivePosts.length ? (
            <section className="writing-section writing-section--archive" aria-labelledby="writing-archive-title">
              <div className="writing-section__header">
                <div className="eyebrow">Archive</div>
                <h2 id="writing-archive-title">Older notes and essays</h2>
              </div>
              <div className="writing-archive-list">
                {archivePosts.map((post) => (
                  <WritingArchiveRow
                    key={post.url}
                    title={post.title}
                    excerpt={post.excerpt}
                    href={post.url}
                    source={post.source}
                    date={formatDate(post.publishedAt)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <SectionPanel title="Writing feed temporarily unavailable" eyebrow="RSS">
          <p>
            Medium and Substack feeds could not be loaded right now, or this source has
            no recent items. Native ABVX writing remains available through this same archive.
          </p>
          <div className="link-strip">
            <a href="/writing?source=abvx">
              ABVX
            </a>
            <a href="https://abvcreative.medium.com/" target="_blank" rel="noopener noreferrer">
              Medium
            </a>
            <a href="https://abvx.substack.com/" target="_blank" rel="noopener noreferrer">
              Substack
            </a>
          </div>
        </SectionPanel>
      )}
    </div>
  );
}
