import Link from 'next/link';
import { getArtifactBySlug, getBookBySlug } from '@/content';

export const metadata = {
  title: 'Toki Pona Books, Tools, and Language Systems',
  description:
    'A gateway to ABVX Toki Pona books, translations, sitelen pona work, language tools, visual protocols, and AI-language experiments.',
  alternates: { canonical: 'https://abvx.xyz/toki-pona' },
};

export default function TokiPonaPillar() {
  const books = ['the-strange-case-of-dr-jekyll-and-mr-hyde-in-toki-pona', 'stoic-wisdom-toki-pona']
    .flatMap((slug) => { const book = getBookBySlug(slug); return book ? [book] : []; });
  const translator = getArtifactBySlug('toki-pona-ai-translator');
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
          {books.map((book) => (
            <li key={book.slug}>
              <Link className="underline" href={book.canonicalPath || `/books/${book.slug}`}>{book.title}</Link>
            </li>
          ))}
          {translator ? (
            <li><Link className="underline" href={`/work/${translator.slug}`}>{translator.title}</Link></li>
          ) : null}
          <li>
            <Link className="underline" href="/systems">Systems</Link>: find language tools and related technical projects.
          </li>
          <li>
            <Link className="underline" href="/focus">Focus</Link>: current infrastructure work and active systems.
          </li>
          <li>
            <Link className="underline" href="/books">Books</Link>: publishing artifacts connected to this thread.
          </li>
          <li>
            <Link className="underline" href="/writing">Writing</Link>: essays and notes that explain the intent and method.
          </li>
        </ul>
      </section>

      <div className="text-sm text-zinc-600 dark:text-zinc-300">
        Back to <Link className="underline" href="/">ABVX hub</Link>.
      </div>
    </div>
  );
}
