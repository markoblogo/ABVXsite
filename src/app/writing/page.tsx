import { fetchMediumFeed, mergeFeeds } from '@/lib/feeds';

export const metadata = {
  title: 'Writing',
};

export const dynamic = 'force-dynamic';

const card =
  'rounded-xl border border-black/10 bg-black/5 p-5 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return '';
  }
}

export default async function WritingPage() {
  const medium = await fetchMediumFeed('https://abvcreative.medium.com/feed');

  // TODO: add Substack once URL is provided
  const posts = mergeFeeds(medium);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Writing</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          A unified feed of my latest posts.
        </p>
      </header>

      <div className="grid gap-3">
        {posts.slice(0, 30).map((p) => (
          <a
            key={p.url}
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className={card}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-semibold">{p.title}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDate(p.publishedAt)}
                </div>
              </div>
              {p.excerpt ? (
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  {p.excerpt}…
                </div>
              ) : null}
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Source: {p.source}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
