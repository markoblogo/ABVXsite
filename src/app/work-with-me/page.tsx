export const metadata = {
  title: 'Work with me',
  description:
    'Strategy, advisory, and LLM-first visibility (LLMO) support for founders and small teams: positioning, go-to-market, and shippable artifacts.',
  alternates: { canonical: 'https://abvx.xyz/work-with-me' },
};

export default function WorkWithMe() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Strategy and execution for founders and small teams
        </h1>
        <p className="text-zinc-700 dark:text-zinc-300">
          Product, growth, brand, and LLM-first visibility delivered as clear decisions
          and shippable artifacts.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Engagements</h2>
        <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="text-sm font-semibold">1) Strategy Sprint (1–2 weeks)</div>
          <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            For when you need clarity fast.
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Positioning map</li>
            <li>Offer definition</li>
            <li>4–8 week GTM roadmap</li>
            <li>KPI set</li>
            <li>Landing page outline</li>
          </ul>
        </div>

        <div className="rounded-xl border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="text-sm font-semibold">2) Advisory (weekly / biweekly)</div>
          <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            For ongoing decision support while you ship.
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Decision log</li>
            <li>Weekly priorities</li>
            <li>Review of experiments</li>
            <li>Messaging iterations</li>
          </ul>
        </div>

        <div className="rounded-xl border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="text-sm font-semibold">
            3) LLM-first Visibility Audit + Implementation
          </div>
          <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            For when your site and docs need to become a usable distribution asset.
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
            <li>IA + internal linking plan</li>
            <li>Metadata pack</li>
            <li>Page templates</li>
            <li>Documentation patterns</li>
            <li>Optional llms.txt convention</li>
          </ul>
        </div>
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-black/5 p-6 dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-semibold">What you get</h2>
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Clear story: what you do, for whom, why you win.</li>
          <li>A practical plan you can execute with your current resources.</li>
          <li>A website and doc set that helps buyers (and agents) understand you quickly.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Credibility snapshot</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Over 20 years across tech, foodtech, Web3, hospitality, FMCG, and retail,
          including VP/C-level roles and venture-backed work.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">FAQ</h2>
        <div className="flex flex-col gap-3 text-sm text-zinc-700 dark:text-zinc-300">
          <div>
            <div className="font-semibold">Do you do “SEO”?</div>
            <div>
              I focus on clarity, intent, structure, and compounding distribution. That often
              improves search performance as a consequence.
            </div>
          </div>
          <div>
            <div className="font-semibold">Do you work with Web3?</div>
            <div>
              Yes, selectively. I care about fundamentals: offer, distribution, trust, and
              measurable outcomes.
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Best: LinkedIn DM. Or email for longer context.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            href="https://www.linkedin.com/in/abvcreative/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn DM
          </a>
          <a
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-950 hover:border-black/30 dark:border-white/15 dark:text-white dark:hover:border-white/30"
            href="mailto:a.biletskiy@gmail.com"
          >
            Email
          </a>
        </div>
      </section>
    </div>
  );
}
