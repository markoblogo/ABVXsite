import { getBooks, getEcosystemBySlug, getProjects } from '@/lib/abvx-data';
import ZoomableImage from '@/components/zoomable-image';
import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const eco = await getEcosystemBySlug(slug);
  if (!eco) {
    return {
      title: 'Systems Catalogue',
      alternates: { canonical: 'https://abvx.xyz/systems' },
    };
  }

  const desc =
    eco.tagline ||
    'A legacy grouped thread now represented inside the systems catalogue.';

  return {
    title: eco.name,
    description: desc,
    alternates: { canonical: 'https://abvx.xyz/systems' },
    openGraph: {
      title: eco.name,
      description: desc,
      url: 'https://abvx.xyz/systems',
      type: 'website',
      images: eco.coverImage ? [{ url: eco.coverImage }] : undefined,
    },
  };
}

const card =
  'rounded-xl border border-black/10 bg-black/5 p-5 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20';

const chip =
  'inline-flex items-center rounded-full border border-black/15 bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10';

const publishingBadge =
  'border-emerald-300/60 text-emerald-700 dark:border-emerald-300/30 dark:text-emerald-300';

function stageBadgeClass(stage?: string) {
  const s = (stage || '').toLowerCase();
  if (s.includes('live') || s.includes('publishing')) return publishingBadge;
  if (
    s.includes('building') ||
    s.includes('in development') ||
    s.includes('in-dev') ||
    s === 'dev'
  ) {
    return 'border-orange-300/60 text-orange-700 dark:border-orange-300/30 dark:text-orange-300';
  }
  return 'border-black/15 text-zinc-600 dark:border-white/15 dark:text-zinc-300';
}

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
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{eco.name}</h1>
          {eco.tagline ? (
            <p className="text-zinc-700 dark:text-zinc-300">{eco.tagline}</p>
          ) : null}
          {eco.primaryUrl ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Primary:{' '}
              <a
                className="underline"
                href={eco.primaryUrl}
                target="_blank"
                rel="noreferrer"
              >
                {eco.primaryUrl}
              </a>
            </p>
          ) : null}
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Projects</h2>
        {projectsIn.length ? (
          <div className="grid gap-3">
            {projectsIn.map((p) => (
              <div key={p.id} className={card}>
                <div className="flex gap-4">
                  {p.coverImage ? (
                    <ZoomableImage
                      src={p.coverImage}
                      alt=""
                      width={144}
                      height={96}
                      imgClassName="h-24 w-36 flex-none rounded-xl border border-black/10 object-cover dark:border-white/10"
                    />
                  ) : (
                    <div className="h-24 w-36 flex-none rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold leading-snug">
                          {p.name}
                        </div>
                        {p.tagline ? (
                          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                            {p.tagline}
                          </div>
                        ) : null}
                      </div>
                      {p.stage ? (
                        <div className={`rounded-full border px-2 py-0.5 text-xs ${stageBadgeClass(p.stage)}`}>
                          {p.stage}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.website ? (
                        <a
                          href={p.website}
                          target="_blank"
                          rel="noreferrer"
                          className={chip}
                        >
                          Website
                        </a>
                      ) : null}
                      {p.github ? (
                        <a
                          href={p.github}
                          target="_blank"
                          rel="noreferrer"
                          className={chip}
                        >
                          GitHub
                        </a>
                      ) : null}
                      {p.demo ? (
                        <a href={p.demo} target="_blank" rel="noreferrer" className={chip}>
                          Demo
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
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            No projects yet.
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Books</h2>
        {booksIn.length ? (
          <div className="grid gap-3">
            {booksIn.map((b) => {
              return (
                <div key={b.id} className={card}>
                  <div className="flex gap-4">
                    {b.coverImage ? (
                      <ZoomableImage
                        src={b.coverImage}
                        alt=""
                        width={80}
                        height={112}
                        imgClassName="h-28 w-20 flex-none rounded-xl border border-black/10 object-cover dark:border-white/10"
                      />
                    ) : (
                      <div className="h-28 w-20 flex-none rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          {b.slug ? (
                            <a
                              href={`/books/${b.slug}`}
                              className="block text-base font-semibold leading-snug hover:underline"
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
                        </div>

                        <div className={`rounded-full border px-2 py-0.5 text-xs ${publishingBadge}`}>
                          Publishing
                        </div>
                      </div>

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
                        {b.teaser ? (
                          <a href={b.teaser} target="_blank" rel="noreferrer" className={chip}>
                            Teaser
                          </a>
                        ) : null}
                        {b.site ? (
                          <a href={b.site} target="_blank" rel="noreferrer" className={chip}>
                            Site
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
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            No books yet.
          </div>
        )}
      </section>

      <div className="text-sm text-zinc-600 dark:text-zinc-300">
        Back to <Link className="underline" href="/">ABVX hub</Link>.
      </div>
    </div>
  );
}
