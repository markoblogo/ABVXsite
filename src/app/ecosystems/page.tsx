import { getBooks, getEcosystems, getProjects } from '@/lib/abvx-data';
import EcosystemCard from '@/components/ecosystem-card';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Systems Catalogue',
  description:
    'Web services, AI-agent workflows, protocols, tools, language experiments and technical companions.',
  alternates: { canonical: 'https://abvx.xyz/systems' },
};

export default async function EcosystemsPage() {
  const [ecosystems, projects, books] = await Promise.all([
    getEcosystems(),
    getProjects(),
    getBooks(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Ecosystems</h1>
          <span className="ux-hover-sticker inline-flex items-center rounded-full border border-emerald-300/60 bg-emerald-100/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:border-emerald-300/35 dark:bg-emerald-900/35 dark:text-emerald-200">
            Current focus
          </span>
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Ecosystems are my <em>current</em> work streams: tools, writing, and reusable assets that ship.
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          This is not a portfolio of “past projects”. Each ecosystem is alive right now — and links back here as the canonical home.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="ux-hover-card rounded-xl border border-black/10 bg-black/5 p-5 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">Applied AI</div>
          <div className="mt-2">
            Experiments, workflows, and pragmatic tooling I use to ship faster: prompting, automation, agent docs, and evaluation.
          </div>
        </div>
        <div className="ux-hover-card rounded-xl border border-black/10 bg-black/5 p-5 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">Books</div>
          <div className="mt-2">
            Reading as infrastructure: notes, frameworks, and distilled ideas I actually use in product and strategy work.
          </div>
        </div>
        <div className="ux-hover-card rounded-xl border border-black/10 bg-black/5 p-5 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">Validation</div>
          <div className="mt-2">
            What survives contact with reality: proof, constraints, distribution systems, and decision-making under pressure.
          </div>
        </div>
        <div className="ux-hover-card rounded-xl border border-black/10 bg-black/5 p-5 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">Culture threads</div>
          <div className="mt-2">
            Long-form research and curation projects that run in parallel (e.g., Ukrmodernism).
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        {ecosystems.map((eco) => (
          <EcosystemCard key={eco.id} eco={eco} books={books} projects={projects} />
        ))}
      </div>
    </div>
  );
}
