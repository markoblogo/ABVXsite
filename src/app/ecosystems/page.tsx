import { getEcosystems } from '@/lib/abvx-data';

export const dynamic = 'force-dynamic';

const card =
  'rounded-xl border border-black/10 bg-black/5 p-5 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20';

export const metadata = {
  title: 'Ecosystems',
};

export default async function EcosystemsPage() {
  const ecosystems = await getEcosystems();

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
          <a
            key={e.id}
            href={`/ecosystems/${e.slug}`}
            className={card}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">{e.name}</div>
                {e.tagline ? (
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{e.tagline}</div>
                ) : null}
                {e.primaryUrl ? (
                  <div className="mt-2 text-sm text-zinc-400">{e.primaryUrl}</div>
                ) : null}
              </div>
              {e.status ? (
                <div className="rounded-full border border-black/15 px-2 py-0.5 text-xs text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                  {e.status}
                </div>
              ) : null}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
