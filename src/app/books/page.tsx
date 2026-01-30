import { getBooks } from '@/lib/abvx-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Books',
};

export default async function BooksPage() {
  const books = await getBooks();

  const missing = books.filter((b) => !b.slug);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Books</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          A selection of my publishing projects.
        </p>
        {missing.length ? (
          <p className="mt-2 text-xs text-amber-300">
            Note: {missing.length} book(s) are missing a slug and won’t have a
            detail page yet.
          </p>
        ) : null}
      </header>

      <div className="grid gap-3">
        {books
          .filter((b) => b.slug)
          .map((b) => (
            <a
              key={b.id}
              href={`/books/${b.slug}`}
              className="rounded-xl border border-black/10 bg-black/5 p-5 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
            >
              <div className="flex gap-4">
                {b.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.coverImage}
                    alt=""
                    className="h-28 w-20 flex-none rounded-xl border border-black/10 object-cover dark:border-white/10"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-28 w-20 flex-none rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold leading-snug">{b.name}</div>
                  {b.section ? (
                    <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {b.section}
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {b.amazon ? (
                      <a
                        href={b.amazon}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border border-black/15 bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Kindle
                      </a>
                    ) : null}
                    {b.paper ? (
                      <a
                        href={b.paper}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border border-black/15 bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Paperback
                      </a>
                    ) : null}
                    {b.site ? (
                      <a
                        href={b.site}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border border-black/15 bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Teaser
                      </a>
                    ) : null}
                    {b.pdf ? (
                      <a
                        href={b.pdf}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border border-black/15 bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        PDF
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </a>
          ))}
      </div>
    </div>
  );
}
