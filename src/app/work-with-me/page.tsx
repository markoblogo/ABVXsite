export const metadata = {
  title: 'Work with me',
};

export default function WorkWithMe() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Work with me</h1>
        <p className="text-zinc-300">
          Engagements that move from clarity → execution → measurable traction.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold">Product &amp; Growth Strategy</div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-300">
            <li>Positioning &amp; messaging system</li>
            <li>Offer architecture &amp; packaging</li>
            <li>GTM plan + channel prioritization</li>
            <li>Competitive framing</li>
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold">
            AI Visibility &amp; Digital Optimization Audit
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-300">
            <li>LLM‑first visibility audit</li>
            <li>llms.txt, metadata, internal linking</li>
            <li>Automation/digitalization opportunities</li>
            <li>30/60/90‑day roadmap</li>
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold">Rapid 0→1 Build Sprint</div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-300">
            <li>Validate &amp; refine the idea</li>
            <li>Packaging: landing + funnel</li>
            <li>Analytics &amp; automation</li>
            <li>Ship, learn, iterate</li>
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Who it’s for</h2>
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-300">
          <li>Founders &amp; small teams building products</li>
          <li>Marketing / growth leads needing sharp positioning + execution</li>
          <li>Publishers / creators who want AI‑first visibility + conversion</li>
          <li>
            Teams hiring a CMO / Head of Growth / Product Strategist (open to
            selected full‑time roles)
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="text-sm text-zinc-300">
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
            className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:border-white/30"
            href="mailto:"
          >
            Email (add)
          </a>
        </div>
      </section>
    </div>
  );
}
