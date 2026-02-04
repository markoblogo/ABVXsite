import { getBooks, getEcosystems } from '@/lib/abvx-data';
import ZoomableImage from '@/components/zoomable-image';
import StructuredData from '@/components/structured-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Books',
  description:
    'Publishing projects and book releases with links to Kindle, paperback, teasers, and downloads.',
  alternates: { canonical: 'https://abvx.xyz/books' },
};

const chip =
  'inline-flex items-center rounded-full border border-black/15 bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10';

export default async function BooksPage() {
  const [books, ecosystems] = await Promise.all([getBooks(), getEcosystems()]);

  const missing = books.filter((b) => !b.slug);
  const items = books
    .filter((b) => b.slug)
    .map((b) => ({
      id: b.id,
      name: b.name,
      url: `https://abvx.xyz/books/${b.slug}`,
      image: b.coverImage,
      type: 'Book',
    }));
  const ecoById = new Map(ecosystems.map((e) => [e.id, e] as const));
  const booksByEco = new Map<string, typeof books>();
  const other: typeof books = [];

  for (const b of books) {
    if (!b.ecosystemIds.length) {
      other.push(b);
      continue;
    }
    for (const id of b.ecosystemIds) {
      const list = booksByEco.get(id) || [];
      list.push(b);
      booksByEco.set(id, list);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <StructuredData id="jsonld-books" items={items} />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Books</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          A selection of my publishing projects.
        </p>
        {missing.length ? (
          <p className="mt-2 text-xs text-amber-300">
            Note: {missing.length} book(s) are missing a slug and won’t have a
            detail page yet.
          </p>
        ) : null}
      </header>

      <div className="flex flex-col gap-8">
        {ecosystems.map((eco) => {
          const list = booksByEco.get(eco.id) || [];
          if (!list.length) return null;
          return (
            <section key={eco.id} className="flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-semibold">{eco.name}</h2>
                {eco.tagline ? (
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{eco.tagline}</p>
                ) : null}
              </div>

              <div className="grid gap-3">
                {list.map((b) => {
                  const teaser = b.teaser || b.site;
                  return (
                    <div
                      key={b.id}
                      className="rounded-xl border border-black/10 bg-black/5 p-5 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                    >
                      <div className="flex gap-4">
                        {b.coverImage ? (
                          <ZoomableImage
                            src={b.coverImage}
                            alt=""
                            width={80}
                            height={112}
                            imgClassName="h-28 w-20 flex-none rounded-xl border border-black/10 object-cover dark:border-white/10"
                          />
                        ) : (
                          <div className="h-28 w-20 flex-none rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
                        )}

                        <div className="min-w-0 flex-1">
                          {b.slug ? (
                            <a
                              href={`/books/${b.slug}`}
                              className="text-base font-semibold leading-snug hover:underline"
                            >
                              {b.name}
                            </a>
                          ) : (
                            <div className="text-base font-semibold leading-snug">
                              {b.name}
                            </div>
                          )}

                          {b.section ? (
                            <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                              {b.section}
                            </div>
                          ) : null}

                          <div className="mt-3 flex flex-wrap gap-2">
                            {b.amazon ? (
                              <a href={b.amazon} target="_blank" rel="noreferrer" className={chip}>
                                Kindle
                              </a>
                            ) : null}
                            {b.paper ? (
                              <a href={b.paper} target="_blank" rel="noreferrer" className={chip}>
                                Paperback
                              </a>
                            ) : null}
                            {teaser ? (
                              <a href={teaser} target="_blank" rel="noreferrer" className={chip}>
                                Teaser
                              </a>
                            ) : null}
                            {b.pdf ? (
                              <a href={b.pdf} target="_blank" rel="noreferrer" className={chip}>
                                PDF
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {other.length ? (
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-semibold">Other</h2>
            </div>
            <div className="grid gap-3">
              {other.map((b) => {
                const teaser = b.teaser || b.site;
                return (
                  <div
                    key={b.id}
                    className="rounded-xl border border-black/10 bg-black/5 p-5 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                  >
                    <div className="flex gap-4">
                      {b.coverImage ? (
                        <ZoomableImage
                          src={b.coverImage}
                          alt=""
                          width={80}
                          height={112}
                          imgClassName="h-28 w-20 flex-none rounded-xl border border-black/10 object-cover dark:border-white/10"
                        />
                      ) : (
                        <div className="h-28 w-20 flex-none rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
                      )}

                      <div className="min-w-0 flex-1">
                        {b.slug ? (
                          <a
                            href={`/books/${b.slug}`}
                            className="text-base font-semibold leading-snug hover:underline"
                          >
                            {b.name}
                          </a>
                        ) : (
                          <div className="text-base font-semibold leading-snug">
                            {b.name}
                          </div>
                        )}

                        {b.section ? (
                          <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            {b.section}
                          </div>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {b.amazon ? (
                            <a href={b.amazon} target="_blank" rel="noreferrer" className={chip}>
                              Kindle
                            </a>
                          ) : null}
                          {b.paper ? (
                            <a href={b.paper} target="_blank" rel="noreferrer" className={chip}>
                              Paperback
                            </a>
                          ) : null}
                          {teaser ? (
                            <a href={teaser} target="_blank" rel="noreferrer" className={chip}>
                              Teaser
                            </a>
                          ) : null}
                          {b.pdf ? (
                            <a href={b.pdf} target="_blank" rel="noreferrer" className={chip}>
                              PDF
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
