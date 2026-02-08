import { getEcosystems, getProjects } from '@/lib/abvx-data';
import ZoomableImage from '@/components/zoomable-image';
import StructuredData from '@/components/structured-data';

export const dynamic = 'force-dynamic';

  const card =
  'rounded-xl border border-black/10 bg-black/5 p-5 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 overflow-hidden';

export const metadata = {
  title: 'Projects',
  description:
    'A catalog of products, tools, and landing pages I build or maintain — with links to live sites, demos, and source.',
  alternates: { canonical: 'https://abvx.xyz/projects' },
};

export default async function ProjectsPage() {
  const [ecosystems, projects] = await Promise.all([getEcosystems(), getProjects()]);

  const ecoById = new Map(ecosystems.map((e) => [e.id, e] as const));
  const stageRank = (stage?: string) => {
    const s = (stage || '').toLowerCase();
    if (s.includes('live')) return 0;
    if (
      s.includes('building') ||
      s.includes('in development') ||
      s.includes('in-dev') ||
      s === 'dev' ||
      s === 'building'
    )
      return 1;
    return 2;
  };

  const sorted = [...projects].sort((a, b) => {
    const ra = stageRank(a.stage);
    const rb = stageRank(b.stage);
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });

  const items = sorted.map((p) => ({
    id: p.id,
    name: p.name,
    url: p.website || p.demo || 'https://abvx.xyz/projects',
    image: p.coverImage,
    type: p.demo || p.website ? 'SoftwareApplication' : 'CreativeWork',
  }));

  return (
    <div className="flex flex-col gap-6">
      <StructuredData id="jsonld-projects" items={items} />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Products, tools, and landings.
        </p>
      </header>

      <div className="grid gap-3">
        {sorted.map((p) => {
          const ecoNames = p.ecosystemIds
            .map((id) => ecoById.get(id)?.name)
            .filter(Boolean) as string[];
          const stageLower = (p.stage || '').toLowerCase();
          const stageClass =
            stageLower.includes('live')
              ? 'border-emerald-300/60 text-emerald-700 dark:border-emerald-300/30 dark:text-emerald-300'
              : stageLower.includes('building') ||
                  stageLower.includes('in development') ||
                  stageLower.includes('in-dev') ||
                  stageLower === 'dev'
                ? 'border-orange-300/60 text-orange-700 dark:border-orange-300/30 dark:text-orange-300'
                : 'border-black/15 text-zinc-600 dark:border-white/15 dark:text-zinc-300';

          return (
            <div key={p.id} className={card}>
              <div className="flex flex-col gap-4 sm:flex-row">
                {p.coverImage ? (
                  <ZoomableImage
                    src={p.coverImage}
                    alt=""
                    width={160}
                    height={112}
                    imgClassName="h-28 w-40 flex-none rounded-xl border border-black/10 object-cover dark:border-white/10"
                  />
                ) : (
                  <div className="h-28 w-40 flex-none rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold leading-snug break-words">
                        {p.name}
                      </div>
                      {p.tagline ? (
                        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300 break-words">
                          {p.tagline}
                        </div>
                      ) : null}
                    </div>
                    {p.stage ? (
                      <div className={`rounded-full border px-2 py-0.5 text-xs ${stageClass}`}>
                        {p.stage}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {p.type ? (
                      <span className="rounded-full border border-black/10 px-2 py-0.5 dark:border-white/10">
                        {p.type}
                      </span>
                    ) : null}
                    {ecoNames.map((n) => (
                      <span
                        key={n}
                        className="rounded-full border border-black/10 px-2 py-0.5 dark:border-white/10"
                      >
                        {n}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.website ? (
                      <a
                        className="inline-flex items-center rounded-full border border-black/15 bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                        href={p.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Website
                      </a>
                    ) : null}
                    {p.github ? (
                      <a
                        className="inline-flex items-center rounded-full border border-black/15 bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                        href={p.github}
                        target="_blank"
                        rel="noreferrer"
                      >
                        GitHub
                      </a>
                    ) : null}
                    {p.demo ? (
                      <a
                        className="inline-flex items-center rounded-full border border-black/15 bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                        href={p.demo}
                        target="_blank"
                        rel="noreferrer"
                      >
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
          );
        })}
      </div>
    </div>
  );
}
