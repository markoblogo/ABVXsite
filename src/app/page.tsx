import { getBooks, getEcosystems, getProjects } from '@/lib/abvx-data';
import EcosystemCard from '@/components/ecosystem-card';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title:
    'Anton Biletskyi-Volokh | Product, Growth & Brand Strategy + LLM-first Visibility (LLMO)',
  description:
    'Product, growth, and brand strategy for AI tools and B2B SaaS. Practical LLM-first visibility (LLMO): structure, metadata, internal linking, and agent-ready documentation.',
  alternates: { canonical: 'https://abvx.xyz' },
  openGraph: {
    title:
      'Anton Biletskyi-Volokh | Product, Growth & Brand Strategy + LLM-first Visibility (LLMO)',
    description:
      'Product, growth, and brand strategy for AI tools and B2B SaaS. Practical LLM-first visibility (LLMO): structure, metadata, internal linking, and agent-ready documentation.',
    url: 'https://abvx.xyz',
    siteName: 'Anton Biletskyi‑Volokh',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Anton Biletskyi-Volokh | Product, Growth & Brand Strategy + LLM-first Visibility (LLMO)',
    description:
      'Product, growth, and brand strategy for AI tools and B2B SaaS. Practical LLM-first visibility (LLMO): structure, metadata, internal linking, and agent-ready documentation.',
  },
};

const cardStatic =
  'rounded-xl border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-white/5';
const cardCompact =
  'rounded-xl border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-white/5';

export default async function Home() {
  const [ecosystems, projects, books] = await Promise.all([
    getEcosystems(),
    getProjects(),
    getBooks(),
  ]);
  const featuredEcosystems = ecosystems.slice(0, 4);

  return (
    <div className="home-shell mx-auto flex w-full max-w-[1100px] flex-col gap-14">
      <section className="relative flex scroll-mt-24 flex-col gap-6" id="home">
        <div className="hero-stickers hidden sm:block" aria-hidden="true">
          <div className="hero-sticker burst">OPEN SOURCE + SHIPPED</div>
          <div className="hero-sticker ribbon">LLM-FIRST VISIBILITY (LLMO)</div>
        </div>

        <div className="flex items-center gap-3">
          {/* upside-down avatar: attention hook */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/avatar-upside-96.jpg"
            alt=""
            className="h-12 w-12 rounded-full border border-black/10 object-cover dark:border-white/10"
            loading="lazy"
          />
          <div className="text-sm font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
            Anton Biletskyi‑Volokh
          </div>
        </div>

        <div className="hero-stickers-mobile flex flex-wrap gap-2 sm:hidden" aria-hidden="true">
          <div className="hero-sticker burst">OPEN SOURCE + SHIPPED</div>
          <div className="hero-sticker ribbon">LLM-FIRST VISIBILITY (LLMO)</div>
        </div>

        <div className="flex max-w-3xl flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Product &amp; AI systems — from validation to shipped tools
          </h1>
          <p className="text-base text-zinc-700 dark:text-zinc-300 sm:text-lg">
            I help founders and small teams validate ideas, ship the first real version, and set up LLM-first visibility (docs, IA, distribution) that compounds.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
            <li>Validate offer + roadmap (2–4 weeks)</li>
            <li>Build / ship: MVPs, automations, internal tools, OSS</li>
            <li>LLM-first visibility: agent-ready docs, structure, metadata, internal linking</li>
          </ul>

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="#work-with-me"
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Work with me
            </a>
            <a
              href="#ecosystems-projects"
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-950 hover:border-black/30 dark:border-white/15 dark:text-white dark:hover:border-white/30"
            >
              See projects
            </a>
          </div>

          <div className="text-sm text-zinc-600 dark:text-zinc-300">
            Open to: consulting, product roles, and selective cofounder opportunities.
          </div>
        </div>
      </section>

      <section className="flex scroll-mt-24 flex-col gap-5" id="how-help">
        <h2 className="text-xl font-semibold tracking-tight">How I help teams ship</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className={cardCompact}>
            <h3 className="text-sm font-semibold">Strategy Sprint (1–2 weeks)</h3>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-600 dark:text-zinc-300">
              <li>Positioning + offer clarity</li>
              <li>Prioritized roadmap and scope</li>
              <li>Execution plan with concrete next steps</li>
            </ul>
          </div>
          <div className={cardCompact}>
            <h3 className="text-sm font-semibold">Build Sprint (2–4 weeks)</h3>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-600 dark:text-zinc-300">
              <li>MVP, internal tools, or automation shipped</li>
              <li>Agent-ready docs and implementation notes</li>
              <li>Handoff checklist for ongoing execution</li>
            </ul>
          </div>
          <div className={cardCompact}>
            <h3 className="text-sm font-semibold">Advisory (weekly/biweekly)</h3>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-600 dark:text-zinc-300">
              <li>Decision reviews and unblock sessions</li>
              <li>Messaging and distribution calibration</li>
              <li>Progress tracking against shipping goals</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Selected outcomes</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
          <li>Led positioning and brand architecture for GT Protocol and supported early-stage growth, including a reported x55 token ROI.</li>
          <li>Led growth/branding/GTM for 30+ startups across Europe and work with Reface.</li>
          <li>Launched foodtech onChef, reaching $500K+ ARR (reported).</li>
          <li>Built and scaled venue concepts and worked on nationwide rollouts including Pizza Celentano (reported).</li>
        </ul>
        <div>
          <a className="text-sm underline" href="/projects">
            More
          </a>
        </div>
      </section>

      <section className="flex scroll-mt-24 flex-col gap-4" id="ecosystems-projects">
        <h2 className="text-xl font-semibold tracking-tight">Ecosystems</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Tools, OSS, and experiments I’m building. Most start as internal solutions.
        </p>
        <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <p>
            This site is the hub. Each ecosystem is a focused thread of work with its own tools, notes, and artifacts:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Cropto: product and growth work on real software.</li>
            <li>Toki Pona: language tools, translation, and writing.</li>
            <li>Ukrmodernism: cultural research and curation.</li>
            <li>Business books: condensed frameworks I actually use.</li>
          </ul>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {featuredEcosystems.map((eco) => (
            <EcosystemCard key={eco.id} eco={eco} books={books} projects={projects} />
          ))}
        </div>
        <div>
          <a
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-950 hover:border-black/30 dark:border-white/15 dark:text-white dark:hover:border-white/30"
            href="/ecosystems"
          >
            Explore ecosystems
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Quick map</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          <a className="underline" href="/llmo">
            LLM-first visibility (LLMO)
          </a>{' '}
          ·{' '}
          <a className="underline" href="/work-with-me">
            Product &amp; growth strategy
          </a>{' '}
          ·{' '}
          <a className="underline" href="/about">
            About Anton (ABVX)
          </a>
        </p>
      </section>

      <section className="flex scroll-mt-24 flex-col gap-4" id="work-with-me">
        <h2 className="text-xl font-semibold tracking-tight">Work with me</h2>
        <div className="flex flex-col gap-3 text-sm text-zinc-600 dark:text-zinc-300">
          <p>
            Send a short note with what you’re building, your current bottleneck, and what you want to achieve in the next 4–8 weeks.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href="/work-with-me"
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Work with me
          </a>
          <a
            href="/about"
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-950 hover:border-black/30 dark:border-white/15 dark:text-white dark:hover:border-white/30"
          >
            About
          </a>
          <a
            href="/books"
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-950 hover:border-black/30 dark:border-white/15 dark:text-white dark:hover:border-white/30"
          >
            Books
          </a>
        </div>
      </section>
    </div>
  );
}
