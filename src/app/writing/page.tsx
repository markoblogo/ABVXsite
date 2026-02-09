import { fetchMediumFeed, fetchSubstackFeed, mergeFeeds } from '@/lib/feeds';
import WritingList from '@/components/writing-list';

export const metadata = {
  title: 'Writing',
  description:
    'Short, practical essays on product, growth systems, brand, and LLM-era discoverability.',
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
          Short, practical essays on product, growth systems, brand, and LLM-era discoverability.
        </p>
      </header>

      <section className="rounded-xl border border-black/10 bg-black/5 p-6 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Start here</h2>
        <ul className="mt-3 list-disc space-y-1 pl-4">
          <li>Clarity before scale: positioning and messaging that survives distribution.</li>
          <li>Systems that compound: content, partnerships, product loops.</li>
          <li>LLM-first visibility: structure, internal linking, metadata, agent-ready docs.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            href="https://abvx.substack.com/"
            target="_blank"
            rel="noreferrer"
          >
            Subscribe
          </a>
          <a
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-950 hover:border-black/30 dark:border-white/15 dark:text-white dark:hover:border-white/30"
            href="#latest"
          >
            Read latest
          </a>
        </div>
      </section>

      <div id="latest" />
      <WritingList posts={posts} />
    </div>
  );
}
