import { getEcosystems, getProjects } from '@/lib/abvx-data';

export const dynamic = 'force-dynamic';

const card =
  'rounded-xl border border-black/10 bg-black/5 p-5 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20';

export const metadata = {
  title: 'Projects',
};

export default async function ProjectsPage() {
  const [ecosystems, projects] = await Promise.all([getEcosystems(), getProjects()]);

  const ecoById = new Map(ecosystems.map((e) => [e.id, e] as const));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Products, tools, and landings.
        </p>
      </header>

      <div className="grid gap-3">
        {projects.map((p) => {
          const ecoNames = p.ecosystemIds
            .map((id) => ecoById.get(id)?.name)
            .filter(Boolean) as string[];

          return (
            <div key={p.id} className={card}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  {p.tagline ? (
                    <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{p.tagline}</div>
                  ) : null}
                </div>
                {p.stage ? (
                  <div className="rounded-full border border-black/15 px-2 py-0.5 text-xs text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                    {p.stage}
                  </div>
                ) : null}
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                {p.type ? <span className="rounded-full border border-black/10 px-2 py-0.5 dark:border-white/10">{p.type}</span> : null}
                {ecoNames.map((n) => (
                  <span key={n} className="rounded-full border border-black/10 px-2 py-0.5 dark:border-white/10">
                    {n}
                  </span>
                ))}
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
                <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{p.statusNote}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
