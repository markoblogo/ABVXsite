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

export default async function Home() {
  const [ecosystems, projects, books] = await Promise.all([
    getEcosystems(),
    getProjects(),
    getBooks(),
  ]);
  const featuredEcosystems = ecosystems.slice(0, 4);

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-5">
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

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Product, growth &amp; brand strategy for AI tools, plus LLM-first visibility (LLMO)
          </h1>
          <p className="text-lg text-zinc-700 dark:text-zinc-300">
            I help founders and small teams turn strong ideas into clear offers, focused go-to-market, and systems that compound.
            <br />
            My work sits at the intersection of applied AI, books, and validation: clarity first, execution next, proof always.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
            <li>Positioning and messaging you can ship across website, product, and sales.</li>
            <li>A prioritized growth roadmap for the next 4–8 weeks: channels, experiments, metrics.</li>
            <li>LLM-first visibility improvements: information architecture, metadata, internal linking, and agent-ready docs.</li>
          </ul>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/work-with-me"
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Work with me
            </a>
            <a
              href="/projects"
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-950 hover:border-black/30 dark:border-white/15 dark:text-white dark:hover:border-white/30"
            >
              Projects
            </a>
            <a
              href="/writing"
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-950 hover:border-black/30 dark:border-white/15 dark:text-white dark:hover:border-white/30"
            >
              Writing
            </a>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Who I help</h2>
        <div className="flex flex-col gap-3 text-sm text-zinc-600 dark:text-zinc-300">
          <p>
            I’m a fit if you’re building an AI product or a B2B SaaS and you need clarity and traction, not noise.
          </p>
          <p>Common situations:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Your product is strong, but the offer is hard to explain in one sentence.</li>
            <li>You ship fast, but distribution is inconsistent or accidental.</li>
            <li>Your website reads like a portfolio, not a decision path for a buyer.</li>
            <li>You want to adapt to LLM-driven discovery and zero-click behavior with pragmatic steps, not gimmicks.</li>
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">What I do</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className={cardStatic}>
            <h3 className="text-sm font-semibold">Track 1: Product &amp; growth strategy</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              I help you convert “cool tech” into a focused offer people understand and can buy.
            </p>
            <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
              <div className="font-semibold text-zinc-700 dark:text-zinc-200">Typical deliverables:</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Positioning and messaging map (ICP, pains, alternatives, proof).</li>
                <li>Offer design (packages, onboarding, pricing logic).</li>
                <li>Go-to-market plan (4–8 weeks): channels, experiments, measurement.</li>
                <li>Content and distribution system: what to publish, where, and why it compounds.</li>
              </ul>
            </div>
          </div>

          <div className={cardStatic}>
            <h3 className="text-sm font-semibold">Track 2: LLM-first visibility (LLMO)</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              I make your site and docs more legible for humans and language models through structure and intent-driven pages.
            </p>
            <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
              <div className="font-semibold text-zinc-700 dark:text-zinc-200">Typical deliverables:</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Information architecture and internal linking plan.</li>
                <li>Titles, descriptions, structured data basics, page templates.</li>
                <li>Agent-ready documentation patterns: predictable, referenceable, reusable.</li>
                <li>Optional: llms.txt and supporting conventions as an auxiliary signal, used carefully.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Selected outcomes</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
          <li>Led positioning and brand architecture for GT Protocol and supported early-stage growth, including a reported x55 token ROI.</li>
          <li>Led growth/branding/GTM for 30+ startups across Europe and work with Reface.</li>
          <li>Launched foodtech onChef, reaching $500K+ ARR (reported).</li>
          <li>Built and scaled 0+ venues, and work on a nationwide chain rollout including Pizza Celentano (240+ outlets, reported).</li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">How we work</h2>
        <div className="flex flex-col gap-3 text-sm text-zinc-600 dark:text-zinc-300">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Intake: goals, constraints, and what success means.</li>
            <li>Audit and synthesis: product, messaging, site, distribution signals.</li>
            <li>Roadmap: priorities, quick wins, and what not to do.</li>
            <li>Optional sprint: implement together or with your team.</li>
            <li>Handoff: docs, templates, and a system you can run.</li>
          </ol>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Ecosystems</h2>
        <div className="flex flex-col gap-3 text-sm text-zinc-600 dark:text-zinc-300">
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
