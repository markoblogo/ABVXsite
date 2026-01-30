import { getBooks, getEcosystems, getProjects } from '@/lib/abvx-data';

export const dynamic = 'force-dynamic';

const card =
  'rounded-xl border border-black/10 bg-black/5 p-5 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20';

export const metadata = {
  title: 'Ecosystems',
};

import { computeEcosystemMeta } from '@/lib/ecosystem-meta';

const chip =
  'inline-flex items-center rounded-full border border-black/15 bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200';

export default async function EcosystemsPage() {
  const [ecosystems, projects, books] = await Promise.all([
    getEcosystems(),
    getProjects(),
    getBooks(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ecosystems</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          The main directions I’m building right now.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {ecosystems.map((e) => (
          <a key={e.id} href={`/ecosystems/${e.slug}`} className={card}>
            <div className="flex gap-4">
              {e.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={e.coverImage}
                  alt=""
                  className="h-20 w-28 flex-none rounded-xl border border-black/10 object-cover dark:border-white/10"
                  loading="lazy"
                />
              ) : (
                <div className="h-20 w-28 flex-none rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold leading-snug">{e.name}</div>
                    {(() => {
                      const meta = computeEcosystemMeta(e, books, projects);

                      return (
                        <>
                          {meta.tagline ? (
                            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                              {meta.tagline}
                            </div>
                          ) : null}
                          {meta.labels.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {meta.labels.map((l) => (
                                <span key={l} className={chip}>
                                  {l}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                  {e.status ? (
                    <div className="rounded-full border border-black/15 px-2 py-0.5 text-xs text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                      {e.status}
                    </div>
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
