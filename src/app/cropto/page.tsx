export const metadata = {
  title: 'Cropto (ABVX)',
  description:
    'A pillar page for the Cropto thread inside ABVX: product thinking, execution notes, and artifacts from building real software.',
  alternates: { canonical: 'https://abvx.xyz/cropto' },
};

export default function CroptoPillar() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Cropto</h1>
        <p className="text-zinc-700 dark:text-zinc-300">
          If you’re looking for cropto abvx context, this page connects the ecosystem thread,
          projects, and notes published on the main ABVX hub.
        </p>
      </header>

      <section className="rounded-xl border border-black/10 bg-black/5 p-6 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Where to go next</h2>
        <ul className="mt-3 list-disc space-y-1 pl-4">
          <li>
            <a className="underline" href="/ecosystems">Ecosystems</a>: find the Cropto ecosystem entry and related work.
          </li>
          <li>
            <a className="underline" href="/projects">Projects</a>: products and tools shipped in this thread.
          </li>
          <li>
            <a className="underline" href="/writing">Writing</a>: essays on product, growth, and validation systems.
          </li>
        </ul>
      </section>

      <div className="text-sm text-zinc-600 dark:text-zinc-300">
        Back to <a className="underline" href="/">ABVX hub</a>.
      </div>
    </div>
  );
}

