import { fetchMediumFeed, fetchSubstackFeed, mergeFeeds } from '@/lib/feeds';
import WritingList from '@/components/writing-list';

export const metadata = {
  title: 'Writing',
  description:
    'A unified feed of my latest essays and notes from Medium and Substack.',
  alternates: { canonical: 'https://abvx.xyz/writing' },
};

export const dynamic = 'force-dynamic';

export default async function WritingPage() {
  const [medium, substack] = await Promise.all([
    fetchMediumFeed('https://abvcreative.medium.com/feed'),
    fetchSubstackFeed('https://abvx.substack.com/feed'),
  ]);

  const posts = mergeFeeds(medium, substack);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Writing</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          A unified feed of my latest posts.
        </p>
      </header>

      <WritingList posts={posts} />
    </div>
  );
}
