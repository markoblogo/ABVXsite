import Link from 'next/link';

const profiles = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/abvcreative/' },
  { label: 'GitHub', href: 'https://github.com/markoblogo' },
  { label: 'Substack', href: 'https://abvx.substack.com/' },
  { label: 'Medium', href: 'https://abvcreative.medium.com/' },
  { label: 'YouTube', href: 'https://www.youtube.com/@ABV_Creative' },
  { label: 'X', href: 'https://x.com/abv_creative' },
  { label: 'Behance', href: 'https://www.behance.net/ABV_Creative' },
  { label: 'Bluesky', href: 'https://bsky.app/profile/abvx.xyz' },
  { label: 'Instagram', href: 'https://www.instagram.com/abvcreative/' },
  { label: 'Telegram', href: 'https://t.me/ABVcreative' },
  { label: 'Vivino', href: 'https://www.vivino.com/users/anthony.bile' },
  { label: 'Email', href: 'mailto:a.biletskiy@gmail.com' },
];

export const metadata = {
  title: 'About',
  description:
    'Official profile links, contact, and professional framing for Anton Biletskyi-Volokh.',
  alternates: { canonical: 'https://abvx.xyz/about' },
};

export default function LinksPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Links</h1>
        <p className="text-zinc-700 dark:text-zinc-300">
          abvx.xyz is the canonical hub for the ecosystem. If you see another site that looks like
          an ABVX page, treat this domain as the source of truth.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Identity page: <Link className="underline" href="/about">About Anton (ABVX)</Link>
        </p>
      </header>

      <section className="rounded-xl border border-black/10 bg-black/5 p-6 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Elsewhere</h2>
        <ul className="mt-3 list-disc space-y-1 pl-4">
          {profiles.map((p) => (
            <li key={p.label}>
              <a className="underline" href={p.href} target={p.href.startsWith('http') ? '_blank' : undefined} rel={p.href.startsWith('http') ? 'noreferrer' : undefined}>
                {p.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/about"
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Work with me
        </Link>
        <Link
          href="/systems"
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-950 hover:border-black/30 dark:border-white/15 dark:text-white dark:hover:border-white/30"
        >
          Systems
        </Link>
        <Link
          href="/books"
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-950 hover:border-black/30 dark:border-white/15 dark:text-white dark:hover:border-white/30"
        >
          Books
        </Link>
      </section>
    </div>
  );
}
