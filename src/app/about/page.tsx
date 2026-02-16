export const metadata = {
  title: 'Anton Biletskyi-Volokh (ABVX)',
  description:
    'Product and AI systems builder: validation, positioning, implementation, and practical adoption.',
  alternates: { canonical: 'https://abvx.xyz/about' },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">About</h1>
        <p className="text-zinc-700 dark:text-zinc-300">
          I build and ship product + AI systems: from validation and positioning to implementation.
          I can operate as founder, partner, consultant, or full-time depending on fit.
        </p>
        <p className="text-zinc-700 dark:text-zinc-300">
          The core is product/GTM/brand rigor plus hands-on building of tools, automations,
          internal systems, and OSS.
        </p>
      </header>

      <section className="rounded-xl border border-black/10 bg-black/5 p-6 dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-semibold">What I do</h2>
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Validate and position products so teams can ship with clear trade-offs.</li>
          <li>Build AI-powered systems: tools, automations, internal workflows, and OSS.</li>
          <li>Run product/GTM execution loops from scope to first usable release.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-black/10 bg-black/5 p-6 dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-semibold">How I work</h2>
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Start with constraints and user reality, not abstract strategy decks.</li>
          <li>Ship in short loops: define scope, build, test, and iterate quickly.</li>
          <li>Leave reusable assets behind: docs, checklists, and maintainable systems.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-black/10 bg-black/5 p-6 dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Now</h2>
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Writing about AI tools, doc systems, reviews, and practical adoption; books/publishing run as a separate track.</li>
          <li>Currently studying AI ethics at Oxford while continuing to build and ship active systems.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Credibility snapshot</h2>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Strong product/GTM/brand background across consulting, operating, and founder contexts.</li>
          <li>Hands-on builder of tools, automations, internal systems, and OSS.</li>
          <li>Flexible engagement model: founder, partner, consultant, or full-time depending on fit.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-black/10 bg-zinc-950 p-6 text-zinc-100 dark:border-white/15 dark:bg-white dark:text-zinc-900">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="text-sm text-zinc-200 dark:text-zinc-700">
          Open to founder/partner/consulting/full-time conversations depending on fit.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 dark:bg-zinc-950 dark:text-white dark:hover:bg-black"
            href="https://www.linkedin.com/in/abvcreative/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn DM
          </a>
          <a
            className="rounded-md border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:border-white/60 dark:border-zinc-400/40 dark:text-zinc-900 dark:hover:border-zinc-700"
            href="mailto:a.biletskiy@gmail.com"
          >
            Email
          </a>
        </div>
      </section>
    </div>
  );
}
