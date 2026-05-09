import PageHeader from '@/components/PageHeader';
import SectionPanel from '@/components/SectionPanel';
import WritingCard from '@/components/WritingCard';
import {
  fetchMediumFeed,
  fetchSubstackFeed,
  mergeFeeds,
  type FeedItem,
} from '@/lib/feeds';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Writing',
  description:
    'Applied AI reviews, build logs and essays on systems, validation, agent workflows, decision-making and how ideas survive contact with reality.',
  alternates: { canonical: 'https://abvx.xyz/writing' },
};

export const revalidate = 900;

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

export default async function WritingPage() {
  const [medium, substack] = await Promise.all([
    safeFeed(fetchMediumFeed, 'https://abvcreative.medium.com/feed'),
    safeFeed(fetchSubstackFeed, 'https://abvx.substack.com/feed'),
  ]);
  const posts = mergeFeeds(medium, substack);

  return (
    <div className="route-writing grid gap-8">
      <PageHeader
        eyebrow="Writing"
        title="Writing"
        summary="Applied AI reviews, build logs and essays on systems, validation, agent workflows, decision-making and how ideas survive contact with reality."
      />

      {posts.length ? (
        <section className="writing-grid">
          {posts.map((post) => (
            <WritingCard
              key={post.url}
              title={post.title}
              excerpt={post.excerpt || 'External essay from the ABVX writing archive.'}
              href={post.url}
              source={post.source}
              date={formatDate(post.publishedAt)}
              image={post.coverImage ? { src: post.coverImage, alt: post.title } : undefined}
            />
          ))}
        </section>
      ) : (
        <SectionPanel title="Writing feed temporarily unavailable" eyebrow="RSS">
          <p>
            Medium and Substack feeds could not be loaded right now. The page is
            still available and will repopulate automatically when the feeds respond.
          </p>
          <div className="link-strip">
            <a href="https://abvcreative.medium.com/" target="_blank" rel="noreferrer">
              Medium
            </a>
            <a href="https://abvx.substack.com/" target="_blank" rel="noreferrer">
              Substack
            </a>
          </div>
        </SectionPanel>
      )}
    </div>
  );
}
