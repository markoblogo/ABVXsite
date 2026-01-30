import { getEcosystems, getProjects } from '@/lib/abvx-data';

export const metadata = {
  title: 'About',
};

export const dynamic = 'force-dynamic';

const card =
  'rounded-xl border border-black/10 bg-black/5 p-5 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20';

export default async function AboutPage() {
  const [ecosystems, projects] = await Promise.all([getEcosystems(), getProjects()]);

  const featuredEcosystems = ecosystems
    .filter((e) => ['toki', 'llmo', 'ukrmodernism', 'cropto'].includes(e.slug))
    .slice(0, 4);

  const featuredProjects = projects
    .filter((p) => ['LLMO — The Next SEO Revolution', 'Cropto — Human-Centred Crypto Clarity'].includes(p.name))
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">About</h1>
        <p className="text-zinc-700 dark:text-zinc-300">
          I’m a product &amp; growth strategist with a background in building brands,
          products, and go‑to‑market systems. In recent years my focus has shifted
          heavily toward AI‑native products and LLM‑first visibility.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className={card}>
          <div className="text-sm font-semibold">Product &amp; Growth Strategy</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Positioning, messaging, offer design, go‑to‑market, competitive framing.
          </div>
        </div>
        <div className={card}>
          <div className="text-sm font-semibold">
            AI Visibility &amp; Digital Optimization Audit
          </div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            LLM‑first visibility (structure, llms.txt, metadata, internal linking)
            plus a roadmap for digitalization, automation, and innovation adoption.
          </div>
        </div>
        <div className={card}>
          <div className="text-sm font-semibold">Rapid 0→1 Build Sprint</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            From idea validation and refinement to packaging and shipping: landing,
            funnel, analytics, automation.
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-black/5 p-6 dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-semibold">How I work</h2>
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Fast ramp‑up: I quickly map the system and find leverage points.</li>
          <li>Strategic view + execution: clarity first, then shipping.</li>
          <li>AI‑native pragmatism: tools, automation, and machine‑readable assets.</li>
          <li>High signal: less busywork, more outcomes.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Selected work</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {featuredEcosystems.map((e) => (
            <a key={e.id} href={`/ecosystems/${e.slug}`} className={card}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{e.name}</div>
                  {e.tagline ? (
                    <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {e.tagline}
                    </div>
                  ) : null}
                </div>
                {e.status ? (
                  <div className="rounded-full border border-black/15 px-2 py-0.5 text-xs text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                    {e.status}
                  </div>
                ) : null}
              </div>
            </a>
          ))}
        </div>

        {featuredProjects.length ? (
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {featuredProjects.map((p) => (
              <div key={p.id} className={card}>
                <div className="text-sm font-semibold">{p.name}</div>
                {p.tagline ? (
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {p.tagline}
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {p.website ? (
                    <a className="underline" href={p.website} target="_blank" rel="noreferrer">
                      Website
                    </a>
                  ) : null}
                  {p.github ? (
                    <a className="underline" href={p.github} target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Open to consulting, partnerships, and selected full‑time roles.
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
