import { getBooks, getEcosystemBySlug, getProjects } from '@/lib/abvx-data';

export const dynamic = 'force-dynamic';

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
        {eco.tagline ? <p className="text-zinc-300">{eco.tagline}</p> : null}
        {eco.primaryUrl ? (
          <p className="text-sm text-zinc-400">
            Primary: <a className="underline" href={eco.primaryUrl}>{eco.primaryUrl}</a>
          </p>
        ) : null}
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Projects</h2>
        {projectsIn.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {projectsIn.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    {p.tagline ? (
                      <div className="mt-1 text-sm text-zinc-300">{p.tagline}</div>
                    ) : null}
                  </div>
                  {p.stage ? (
                    <div className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-zinc-300">
                      {p.stage}
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {p.website ? (
                    <a className="underline" href={p.website}>
                      Website
                    </a>
                  ) : null}
                  {p.github ? (
                    <a className="underline" href={p.github}>
                      GitHub
                    </a>
                  ) : null}
                </div>
                {p.statusNote ? (
                  <div className="mt-3 text-sm text-zinc-400">{p.statusNote}</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-400">No projects yet.</div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Books</h2>
        {booksIn.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {booksIn.map((b) => (
              <a
                key={b.id}
                href={`/books/${b.slug}`}
                className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-white/20"
              >
                <div className="text-sm font-semibold">{b.name}</div>
                {b.section ? (
                  <div className="mt-1 text-sm text-zinc-400">{b.section}</div>
                ) : null}
              </a>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-400">No books yet.</div>
        )}
      </section>
    </div>
  );
}
