import { getBookBySlug } from '@/lib/abvx-data';

export const dynamic = 'force-dynamic';

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return <div>Not found.</div>;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{book.name}</h1>
        {book.section ? <p className="text-sm text-zinc-400">{book.section}</p> : null}
      </header>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Links</h2>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          {book.amazon ? (
            <a className="underline" href={book.amazon}>
              Amazon (e‑book)
            </a>
          ) : null}
          {book.paper ? (
            <a className="underline" href={book.paper}>
              Paper book
            </a>
          ) : null}
          {book.site ? (
            <a className="underline" href={book.site}>
              Project / landing
            </a>
          ) : null}
          {book.pdf ? (
            <a className="underline" href={book.pdf}>
              PDF
            </a>
          ) : null}
        </div>
      </section>

      <section className="text-sm text-zinc-300">
        <p>
          Want a dedicated description page with cover, blurb, and structured data
          (JSON‑LD)? Tell me which 3–5 books you want to prioritize and I’ll
          polish them first.
        </p>
      </section>
    </div>
  );
}
