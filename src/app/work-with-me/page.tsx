import Link from 'next/link';

export const metadata = {
  title: 'Work With Me - AI-native systems and market infrastructure',
  description:
    'Consulting, partnerships, grant-backed projects and selected roles for AI-native product development, agro-commodity market infrastructure, agentic workflows and strategic go-to-market systems.',
  alternates: { canonical: 'https://abvx.xyz/work-with-me' },
};

export default function WorkWithMe() {
  return (
    <div className="work-with-me-page flex flex-col gap-12">
      <header className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 dark:border-white/10 dark:bg-white/[0.03] sm:p-7">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="wm-chip">
            Complex markets
          </span>
          <span className="wm-chip wm-chip--accent">
            AI-native systems
          </span>
          <span className="wm-chip">
            Grant-backed projects
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          AI-native systems, market infrastructure and strategic execution
        </h1>
        <p className="mt-2 text-zinc-700 dark:text-zinc-300">
          I work with teams building complex, technical and market-facing systems:
          agro-commodity infrastructure, agentic development workflows, market
          intelligence layers and go-to-market systems that need structure.
        </p>
        <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Available for consulting, partnerships, grant-backed collaborations and selected full-time or fractional roles.
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
          <div className="wm-chip">Market systems</div>
          <div className="mt-2 text-sm font-semibold">Agro-market infrastructure sprint</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            For teams working around physical commodities, brokerage, indexes or market intelligence.
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Brokerage workflow and execution-layer mapping</li>
            <li>Market-intelligence, dashboard or benchmark structure</li>
            <li>Participant, signal, data and methodology model</li>
            <li>Commercial narrative for partners, grants or pilots</li>
            <li>Handoff: operating map + prioritized build plan</li>
          </ul>
        </div>

        <div className="wm-card rounded-xl p-5">
          <div className="wm-chip">Agentic execution</div>
          <div className="mt-2 text-sm font-semibold">AI-native workflow sprint</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            For teams that want agent-assisted execution without losing review discipline.
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
            <li>AGENTS/RUNBOOK and project instruction surfaces</li>
            <li>Reusable skillpacks and validation gates</li>
            <li>Debugging, audit, research and handoff workflows</li>
            <li>Repo context, risk notes and operating conventions</li>
            <li>Implementation loop: ship, verify, document, repeat</li>
          </ul>
        </div>

        <div className="wm-card wm-card--accent rounded-xl p-5">
          <div className="wm-chip wm-chip--accent">Strategy to execution</div>
          <div className="mt-2 text-sm font-semibold">Product, GTM and grant narrative system</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            For complex products that need to be legible to clients, partners, evaluators and AI search.
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Positioning, offer and stakeholder narrative</li>
            <li>Landing/site/deck structure for technical products</li>
            <li>SEO, JSON-LD, LLMO and machine-readable indexes</li>
            <li>Evidence map: projects, methods, traction and use cases</li>
            <li>Implementation sprint: publish, measure and iterate</li>
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
          <li>An operating layer that connects strategy, product, market workflows and AI-assisted execution.</li>
        </ul>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          Not sure which track fits? Send 3 lines about what you’re building and where you’re stuck — I’ll point you to the best next step.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Credibility snapshot</h2>
        <ul className="list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
          <li>25+ years across strategic marketing, creative direction, product development and international business communication.</li>
          <li>Hands-on agro-market infrastructure work around MN7R, Cropto, commodity indexes, monitoring and brokerage workflows.</li>
          <li>AI-native development stack: agent skills, project instruction layers, validation-gated workflows and LLMO infrastructure.</li>
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
            rel="noopener noreferrer"
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
