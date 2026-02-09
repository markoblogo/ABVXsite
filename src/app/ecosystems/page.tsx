import { getBooks, getEcosystems, getProjects } from '@/lib/abvx-data';
import EcosystemCard from '@/components/ecosystem-card';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ecosystems',
  description:
    'Ecosystems are running threads that produce tools, writing, books, and reusable assets across AI, validation, publishing, and culture research.',
  alternates: { canonical: 'https://abvx.xyz/ecosystems' },
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
        <h1 className="text-2xl font-semibold tracking-tight">Ecosystems</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Ecosystems are running threads that produce tools, writing, and reusable assets.
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          abvx.xyz is the hub. Spokes may live on dedicated subdomains or external sites, but each ecosystem links back here as the canonical home.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-black/5 p-5 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">Applied AI</div>
          <div className="mt-2">
            Experiments, workflows, and pragmatic guidance on using AI tools to ship faster and communicate better. (Prompting, automation, creative toolchains.)
          </div>
        </div>
        <div className="rounded-xl border border-black/10 bg-black/5 p-5 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">Books</div>
          <div className="mt-2">
            Reading as infrastructure: notes, frameworks, and distilled ideas I use in product and growth.
          </div>
        </div>
        <div className="rounded-xl border border-black/10 bg-black/5 p-5 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">Validation</div>
          <div className="mt-2">
            What holds when hype fades: positioning, proof, distribution systems, and decision-making under constraints.
          </div>
        </div>
        <div className="rounded-xl border border-black/10 bg-black/5 p-5 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">Culture threads</div>
          <div className="mt-2">
            Long-form research and curation (for example: Ukrmodernism).
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
