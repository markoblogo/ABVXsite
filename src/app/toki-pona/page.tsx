export const metadata = {
  title: 'Toki Pona (ABVX)',
  description:
    'A pillar page for the Toki Pona thread inside ABVX: language tools, translation work, writing, and related books.',
  alternates: { canonical: 'https://abvx.xyz/toki-pona' },
};

export default function TokiPonaPillar() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Toki Pona</h1>
        <p className="text-zinc-700 dark:text-zinc-300">
          If you’re looking for toki abvx work, this is the hub page on the main domain.
          It connects tools, translations, notes, and book releases.
        </p>
      </header>

      <section className="rounded-xl border border-black/10 bg-black/5 p-6 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Where to go next</h2>
        <ul className="mt-3 list-disc space-y-1 pl-4">
          <li>
            <a className="underline" href="/ecosystems">Ecosystems</a>: find the Toki Pona ecosystem entry and related projects.
          </li>
          <li>
            <a className="underline" href="/projects">Projects</a>: tools and utilities used in the publishing pipeline.
          </li>
          <li>
            <a className="underline" href="/books">Books</a>: publishing artifacts connected to this thread.
          </li>
          <li>
            <a className="underline" href="/writing">Writing</a>: essays and notes that explain the intent and method.
          </li>
        </ul>
      </section>

      <div className="text-sm text-zinc-600 dark:text-zinc-300">
        Back to <a className="underline" href="/">ABVX hub</a>.
      </div>
    </div>
  );
}

