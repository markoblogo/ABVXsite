import { getBooks, getEcosystemBySlug, getProjects } from '@/lib/abvx-data';

export const dynamic = 'force-dynamic';

const card =
  'rounded-xl border border-black/10 bg-black/5 p-5 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20';

const chip =
  'inline-flex items-center rounded-full border border-black/15 bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10';

export default async function EcosystemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eco = await getEcosystemBySlug(slug);
  if (!eco) return <div>Not found.</div>;

  const [projects, books] = await Promise.all([getProjects(), getBooks()]);

  const projectsIn = projects.filter((p) => p.ecosystemIds.includes(eco.id));
  const booksIn = books.filter((b) => b.ecosystemIds.includes(eco.id));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{eco.name}</h1>
        {eco.tagline ? (
          <p className="text-zinc-700 dark:text-zinc-300">{eco.tagline}</p>
        ) : null}
        {eco.primaryUrl ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Primary:{' '}
            <a className="underline" href={eco.primaryUrl} target="_blank" rel="noreferrer">
              {eco.primaryUrl}
            </a>
          </p>
        ) : null}
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Projects</h2>
        {projectsIn.length ? (
          <div className="grid gap-3">
            {projectsIn.map((p) => (
              <div key={p.id} className={card}>
                <div className="flex gap-4">
                  {p.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverImage}
                      alt=""
                      className="h-28 w-40 flex-none rounded-xl border border-black/10 object-cover dark:border-white/10"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-28 w-40 flex-none rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold leading-snug">{p.name}</div>
                        {p.tagline ? (
                          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                            {p.tagline}
                          </div>
                        ) : null}
                      </div>
                      {p.stage ? (
                        <div className="rounded-full border border-black/15 px-2 py-0.5 text-xs text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                          {p.stage}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.website ? (
                        <a href={p.website} target="_blank" rel="noreferrer" className={chip}>
                          Website
                        </a>
                      ) : null}
                      {p.github ? (
                        <a href={p.github} target="_blank" rel="noreferrer" className={chip}>
                          GitHub
                        </a>
                      ) : null}
                    </div>

                    {p.statusNote ? (
                      <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                        {p.statusNote}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-500 dark:text-zinc-400">No projects yet.</div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Books</h2>
        {booksIn.length ? (
          <div className="grid gap-3">
            {booksIn.map((b) => (
              <div key={b.id} className={card}>
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
                    {b.slug ? (
                      <a
                        href={`/books/${b.slug}`}
                        className="text-base font-semibold leading-snug hover:underline"
                      >
                        {b.name}
                      </a>
                    ) : (
                      <div className="text-base font-semibold leading-snug">{b.name}</div>
                    )}

                    {b.section ? (
                      <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {b.section}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {b.amazon ? (
                        <a href={b.amazon} target="_blank" rel="noreferrer" className={chip}>
                          Kindle
                        </a>
                      ) : null}
                      {b.paper ? (
                        <a href={b.paper} target="_blank" rel="noreferrer" className={chip}>
                          Paperback
                        </a>
                      ) : null}
                      {b.site ? (
                        <a href={b.site} target="_blank" rel="noreferrer" className={chip}>
                          Teaser
                        </a>
                      ) : null}
                      {b.pdf ? (
                        <a href={b.pdf} target="_blank" rel="noreferrer" className={chip}>
                          PDF
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-500 dark:text-zinc-400">No books yet.</div>
        )}
      </section>
    </div>
  );
}
