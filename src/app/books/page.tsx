import { getBooks } from '@/lib/abvx-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Books',
};

export default async function BooksPage() {
  const books = await getBooks();

  const missing = books.filter((b) => !b.slug);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Books</h1>
        <p className="mt-2 text-sm text-zinc-300">
          A selection of my publishing projects.
        </p>
        {missing.length ? (
          <p className="mt-2 text-xs text-amber-300">
            Note: {missing.length} book(s) are missing a slug and won’t have a
            detail page yet.
          </p>
        ) : null}
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {books
          .filter((b) => b.slug)
          .map((b) => (
            <a
              key={b.id}
              href={`/books/${b.slug}`}
              className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-white/20"
            >
              <div className="text-sm font-semibold">{b.name}</div>
              {b.section ? (
                <div className="mt-1 text-sm text-zinc-400">{b.section}</div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {b.amazon ? <span className="text-zinc-300">Amazon</span> : null}
                {b.site ? <span className="text-zinc-300">Site</span> : null}
                {b.pdf ? <span className="text-zinc-300">PDF</span> : null}
              </div>
            </a>
          ))}
      </div>
    </div>
  );
}
