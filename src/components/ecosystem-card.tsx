import type { Ecosystem, Book, Project } from '@/lib/abvx-data';
import { computeEcosystemMeta } from '@/lib/ecosystem-meta';
import ZoomableImage from '@/components/zoomable-image';

const card =
  'ux-hover-card ux-focus-ring rounded-xl border border-black/10 bg-black/5 p-5 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20';

const chip =
  'inline-flex items-center rounded-full border border-black/15 bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200';

function statusBadgeClass(status?: string) {
  const s = (status || '').toLowerCase();
  if (!s) return 'border-black/15 text-zinc-600 dark:border-white/15 dark:text-zinc-300';

  if (s.includes('live') || s.includes('publishing')) {
    return 'border-emerald-300/60 text-emerald-700 dark:border-emerald-300/30 dark:text-emerald-300';
  }
  if (s.includes('building') || s.includes('in development') || s.includes('in-dev') || s === 'dev') {
    return 'border-orange-300/60 text-orange-700 dark:border-orange-300/30 dark:text-orange-300';
  }
  return 'border-black/15 text-zinc-600 dark:border-white/15 dark:text-zinc-300';
}

export default function EcosystemCard({
  eco,
  books,
  projects,
}: {
  eco: Ecosystem;
  books: Book[];
  projects: Project[];
}) {
  const meta = computeEcosystemMeta(eco, books, projects);

  return (
    <a key={eco.id} href={`/ecosystems/${eco.slug}`} className={card}>
      <div className="flex gap-4">
        {eco.coverImage ? (
          <ZoomableImage
            src={eco.coverImage}
            alt=""
            width={112}
            height={80}
            imgClassName="h-20 w-28 flex-none rounded-xl border border-black/10 object-cover dark:border-white/10"
          />
        ) : (
          <div className="h-20 w-28 flex-none rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-base font-semibold leading-snug">{eco.name}</div>
              {meta.tagline ? (
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {meta.tagline}
                </div>
              ) : null}
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {meta.booksCount} book(s) · {meta.projectsCount} project(s)
              </div>
            </div>

            {eco.status ? (
              <div className={`rounded-full border px-2 py-0.5 text-xs ${statusBadgeClass(eco.status)}`}>
                {eco.status}
              </div>
            ) : null}
          </div>

          {meta.labels.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {meta.labels.map((l) => (
                <span key={l} className={chip}>
                  {l}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </a>
  );
}
