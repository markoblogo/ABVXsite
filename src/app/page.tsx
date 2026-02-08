import { getBooks, getEcosystems, getProjects } from '@/lib/abvx-data';
import EcosystemCard from '@/components/ecosystem-card';

export const dynamic = 'force-dynamic';

const cardStatic =
  'rounded-xl border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-white/5';

export default async function Home() {
  const [ecosystems, projects, books] = await Promise.all([
    getEcosystems(),
    getProjects(),
    getBooks(),
  ]);
  const featuredEcosystems = ecosystems.slice(0, 4);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {/* upside-down avatar: attention hook */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/avatar-upside-96.jpg"
            alt=""
            className="h-12 w-12 rounded-full border border-black/10 object-cover dark:border-white/10"
            loading="lazy"
          />
          <h1 className="text-3xl font-semibold tracking-tight">
            Anton Biletskyi‑Volokh
          </h1>
        </div>
        <p className="text-lg text-zinc-700 dark:text-zinc-300">
          Product &amp; Growth Strategist — I help teams build, package, and scale
          products with a modern, AI‑native approach.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href="/work-with-me"
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Work with me
          </a>
          <a
            href="/ecosystems"
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-950 hover:border-black/30 dark:border-white/15 dark:text-white dark:hover:border-white/30"
          >
            Explore ecosystems
          </a>
          <a
            href="/books"
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-950 hover:border-black/30 dark:border-white/15 dark:text-white dark:hover:border-white/30"
          >
            Books
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className={cardStatic}>
          <div className="text-sm font-semibold">Product &amp; Growth Strategy</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Positioning, messaging, offers, go‑to‑market, competitive framing.
          </div>
        </div>
        <div className={cardStatic}>
          <div className="text-sm font-semibold">
            AI Visibility &amp; Digital Optimization Audit
          </div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            LLM‑first visibility (llms.txt, metadata, internal linking) + a roadmap
            for digitalization, automation, and innovation adoption.
          </div>
        </div>
        <div className={cardStatic}>
          <div className="text-sm font-semibold">Rapid 0→1 Build Sprint</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            From idea validation to packaging and shipping — landing, funnel,
            analytics, automation.
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Ecosystems</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {featuredEcosystems.map((eco) => (
            <EcosystemCard key={eco.id} eco={eco} books={books} projects={projects} />
          ))}
        </div>
        <div>
          <a
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
            href="/ecosystems"
          >
            View all ecosystems
          </a>
        </div>
        <div className="text-sm text-zinc-400">
          Open to consulting, partnerships, and selected full‑time roles.
        </div>
      </section>
    </div>
  );
}
