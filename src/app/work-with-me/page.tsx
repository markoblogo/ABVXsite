export const metadata = {
  title: 'ABVX — Work with me',
  description:
    'Strategy, advisory, and LLM-first visibility (LLMO) support for founders and small teams: positioning, go-to-market, and shippable artifacts.',
  alternates: { canonical: 'https://abvx.xyz/work-with-me' },
};

export default function WorkWithMe() {
  return (
    <div className="flex flex-col gap-12">
      <header className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 dark:border-white/10 dark:bg-white/[0.03] sm:p-7">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="ux-hover-sticker inline-flex items-center rounded-full border border-emerald-300/60 bg-emerald-100/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:border-emerald-300/40 dark:bg-emerald-900/40 dark:text-emerald-200">
            Product + AI systems
          </span>
          <span className="ux-hover-sticker inline-flex items-center rounded-full border border-sky-300/60 bg-sky-100/70 px-2.5 py-1 text-[11px] font-semibold text-sky-800 dark:border-sky-300/40 dark:bg-sky-900/40 dark:text-sky-200">
            LLM-first visibility (LLMO)
          </span>
          <span className="ux-hover-sticker inline-flex items-center rounded-full border border-violet-300/60 bg-violet-100/70 px-2.5 py-1 text-[11px] font-semibold text-violet-800 dark:border-violet-300/40 dark:bg-violet-900/40 dark:text-violet-200">
            Build with founders
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Strategy and execution for founders and small teams
        </h1>
        <p className="mt-2 text-zinc-700 dark:text-zinc-300">
          Product, growth, brand, and LLM-first visibility delivered as clear decisions
          and shippable artifacts.
        </p>
        <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Product + AI systems engagements for teams that need clarity, speed, and shipped outcomes.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="#start-conversation"
            className="ux-hover-btn ux-focus-ring rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Work with me
          </a>
          <a
            href="/projects"
            className="ux-hover-btn ux-focus-ring rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-950 hover:border-black/30 dark:border-white/15 dark:text-white dark:hover:border-white/30"
          >
            See projects
          </a>
        </div>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Working in Paris time (CET/CEST).
        </p>
      </header>

      <section className="flex flex-col gap-4" id="engagements">
        <h2 className="text-lg font-semibold">How I help teams ship</h2>
        <div className="grid gap-4 md:grid-cols-3">
        <div className="ux-hover-card rounded-xl border border-emerald-300/40 bg-gradient-to-b from-emerald-50/70 to-transparent p-5 dark:border-emerald-400/30 dark:from-emerald-900/20 dark:to-transparent">
          <div className="ux-hover-sticker inline-flex items-center rounded-full border border-emerald-300/60 bg-emerald-100/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:border-emerald-300/40 dark:bg-emerald-900/40 dark:text-emerald-200">Fast clarity</div>
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

        <div className="ux-hover-card rounded-xl border border-violet-300/40 bg-gradient-to-b from-violet-50/70 to-transparent p-5 dark:border-violet-400/30 dark:from-violet-900/20 dark:to-transparent">
          <div className="ux-hover-sticker inline-flex items-center rounded-full border border-violet-300/60 bg-violet-100/80 px-2.5 py-1 text-[11px] font-semibold text-violet-800 dark:border-violet-300/40 dark:bg-violet-900/40 dark:text-violet-200">Ship the first real version</div>
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

        <div className="ux-hover-card rounded-xl border border-sky-300/40 bg-gradient-to-b from-sky-50/70 to-transparent p-5 dark:border-sky-400/30 dark:from-sky-900/20 dark:to-transparent">
          <div className="ux-hover-sticker inline-flex items-center rounded-full border border-sky-300/60 bg-sky-100/80 px-2.5 py-1 text-[11px] font-semibold text-sky-800 dark:border-sky-300/40 dark:bg-sky-900/40 dark:text-sky-200">Make your product legible to humans + crawlers</div>
          <div className="mt-2 text-sm font-semibold">LLM-first Visibility Audit + Implementation</div>
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

      <section className="ux-hover-card rounded-xl border border-amber-300/40 bg-gradient-to-br from-amber-50/80 to-transparent p-6 dark:border-amber-300/30 dark:from-amber-900/20 dark:to-transparent">
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

      <section className="ux-hover-card flex flex-col gap-3 rounded-xl border border-black/10 bg-zinc-950 p-6 text-zinc-100 dark:border-white/15 dark:bg-white dark:text-zinc-900" id="start-conversation">
        <h2 className="text-lg font-semibold">Start a conversation</h2>
        <p className="text-sm text-zinc-200 dark:text-zinc-700">
          Best via LinkedIn DM for quick context. Email works for longer briefs or partnership ideas.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            className="ux-hover-btn ux-focus-ring rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 dark:bg-zinc-950 dark:text-white dark:hover:bg-black"
            href="https://www.linkedin.com/in/abvcreative/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn DM
          </a>
          <a
            className="ux-hover-btn ux-focus-ring rounded-md border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:border-white/60 dark:border-zinc-400/40 dark:text-zinc-900 dark:hover:border-zinc-700"
            href="mailto:a.biletskiy@gmail.com"
          >
            Email
          </a>
        </div>
      </section>
    </div>
  );
}
