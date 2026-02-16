import { fetchMediumFeed, fetchSubstackFeed, mergeFeeds } from '@/lib/feeds';
import WritingList from '@/components/writing-list';

export const metadata = {
  title: 'Blogs',
  description:
    'Notes on AI tools, agent workflows, and what actually ships in the real world.',
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
        <h1 className="text-2xl font-semibold tracking-tight">Blogs</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Notes on AI tools, agent workflows, and what actually ships in the real world.
        </p>
      </header>

      <section className="rounded-xl border border-black/10 bg-black/5 p-6 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
        <p>Two feeds, same focus: practical AI work, reviews, and field notes.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-900 hover:shadow dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
            href="https://abvx.substack.com/"
            target="_blank"
            rel="noreferrer"
          >
            Substack
          </a>
          <a
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-900 hover:shadow dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
            href="https://medium.com/@abvcreative"
            target="_blank"
            rel="noreferrer"
          >
            Medium
          </a>
        </div>
      </section>

      <div id="latest" />
      <WritingList posts={posts} />
    </div>
  );
}
