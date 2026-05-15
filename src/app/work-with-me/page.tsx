import Link from 'next/link';

export const metadata = {
  title: 'Work With Me',
  description:
    'Consulting and implementation offers for strategy, product systems, AI-native workflows, LLMO, metadata, and market infrastructure.',
  alternates: { canonical: 'https://abvx.xyz/work-with-me' },
};

export default function WorkWithMe() {
  return (
    <div className="work-with-me-page flex flex-col gap-12">
      <header className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 dark:border-white/10 dark:bg-white/[0.03] sm:p-7">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="wm-chip">
            Product + AI systems
          </span>
          <span className="wm-chip wm-chip--accent">
            AI-native systems
          </span>
          <span className="wm-chip">
            Build with founders
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Strategy and execution for founders and small teams
        </h1>
        <p className="mt-2 text-zinc-700 dark:text-zinc-300">
          Strategy, product, brand, and AI-native systems delivered as clear decisions
          and shippable artifacts.
        </p>
        <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Product + AI systems engagements for teams that need clarity, speed, and shipped outcomes.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="#start-conversation"
            className="wm-btn wm-btn--primary"
          >
            Work with me
          </a>
          <Link
            href="/systems"
            className="wm-btn wm-btn--secondary"
          >
            See systems
          </Link>
        </div>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Working in Paris time (CET/CEST).
        </p>
      </header>

      <section className="flex flex-col gap-4" id="engagements">
        <h2 className="text-lg font-semibold">How I help teams ship</h2>
        <div className="grid gap-4 md:grid-cols-3">
        <div className="wm-card rounded-xl p-5">
          <div className="wm-chip">Fast clarity</div>
          <div className="mt-2 text-sm font-semibold">Strategy Sprint (1–2 weeks)</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            For founders who need a crisp plan before building.
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Offer + ICP clarity (what you sell, to whom, why you win)</li>
            <li>Prioritized roadmap (next 2–4 weeks)</li>
            <li>Metrics &amp; constraints (what success means, what we won’t do)</li>
            <li>Messaging primitives you can reuse across site, product, and sales</li>
            <li>Handoff: 1-page plan + decision log</li>
          </ul>
        </div>

        <div className="wm-card rounded-xl p-5">
          <div className="wm-chip">Ship the first real version</div>
          <div className="mt-2 text-sm font-semibold">Build Sprint (2–4 weeks)</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            For teams that want to build and launch with a tight loop.
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
            <li>MVP scope + build plan (what ships, what waits)</li>
            <li>Landing + onboarding flow (first conversion path)</li>
            <li>Analytics baseline (events, funnels, simple reporting)</li>
            <li>AI-ready docs (AGENTS/RUNBOOK, repo context, workflows)</li>
            <li>Weekly checkpoints + ship list</li>
          </ul>
        </div>

        <div className="wm-card wm-card--accent rounded-xl p-5">
          <div className="wm-chip wm-chip--accent">Make your product legible to humans + crawlers</div>
          <div className="mt-2 text-sm font-semibold">AI-native systems audit + implementation</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            For products whose docs/site need to work in an AI-first discovery world.
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Information architecture + internal linking plan</li>
            <li>Metadata pack (titles, descriptions, canonical, structured basics)</li>
            <li>Agent-friendly documentation patterns (predictable, referenceable)</li>
            <li>Optional llms.txt / LLMO pack conventions (where appropriate)</li>
            <li>Implementation sprint: fix + measure + iterate</li>
          </ul>
        </div>
        </div>
      </section>

      <section className="wm-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold">What you get (every time)</h2>
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
          <li>A clear story: offer, audience, and why you win — in plain language.</li>
          <li>A practical plan you can execute with your current team and constraints.</li>
          <li>Shippable artifacts (docs, pages, checklists) — not just advice.</li>
        </ul>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          Not sure which track fits? Send 3 lines about what you’re building and where you’re stuck — I’ll point you to the best next step.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Credibility snapshot</h2>
        <ul className="list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Product + GTM leadership across AI tools and software (founder + C-level marketing/product).</li>
          <li>Built and scaled ventures across Web3 and commodities infrastructure (options/indices/markets).</li>
          <li>Hands-on builder: automation, internal tools, and OSS — from validation to shipped systems.</li>
        </ul>
      </section>

      <section className="wm-cta flex flex-col gap-3 rounded-xl p-6" id="start-conversation">
        <h2 className="text-lg font-semibold">Start a conversation</h2>
        <p className="text-sm">
          Best via LinkedIn DM for quick context. Email works for longer briefs or partnership ideas.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            className="wm-btn wm-btn--primary"
            href="https://www.linkedin.com/in/abvcreative/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn DM
          </a>
          <a
            className="wm-btn wm-btn--secondary"
            href="mailto:a.biletskiy@gmail.com"
          >
            Email
          </a>
        </div>
      </section>
    </div>
  );
}
