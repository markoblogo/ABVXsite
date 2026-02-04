'use client';

import { useState } from 'react';
import type { FeedItem } from '@/lib/feeds';

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

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function WritingList({ posts }: { posts: FeedItem[] }) {
  const [visible, setVisible] = useState(30);
  const shown = posts.slice(0, visible);

  return (
    <div className="grid gap-3">
      {shown.map((p) => (
        <a
          key={p.url}
          href={p.url}
          target="_blank"
          rel="noreferrer"
          className={card}
        >
          <div className="flex gap-4">
            {p.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.coverImage}
                alt=""
                className="h-20 w-20 flex-none rounded-lg border border-black/10 object-cover dark:border-white/10"
                loading="lazy"
              />
            ) : (
              <div className="h-20 w-20 flex-none rounded-lg border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 text-sm font-semibold">
                  <span className="line-clamp-2">{p.title}</span>
                </div>
                <div className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDate(p.publishedAt)}
                </div>
              </div>

              {p.excerpt ? (
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  <span className="line-clamp-2">{p.excerpt}…</span>
                </div>
              ) : null}

              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {p.source} · {hostFromUrl(p.url)}
              </div>
            </div>
          </div>
        </a>
      ))}

      {visible < posts.length ? (
        <div className="flex justify-center pt-2">
          <button
            className="rounded-full border border-black/15 bg-black/5 px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            onClick={() => setVisible((v) => Math.min(v + 10, posts.length))}
          >
            More
          </button>
        </div>
      ) : null}
    </div>
  );
}
