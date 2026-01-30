import type { Metadata } from 'next';
import './globals.css';

import Image from 'next/image';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';

export const metadata: Metadata = {
  title: {
    default: 'Anton Biletskyi‑Volokh',
    template: '%s · Anton Biletskyi‑Volokh',
  },
  description:
    'Product & Growth Strategist. Building AI-native products, ecosystems, and publishing projects.',
};

function Nav() {
  const link =
    'text-sm text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white';

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <a
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-wide text-black dark:text-white"
        >
          <Image
            src="/brand/abv-mark.png"
            alt="ABV"
            width={48}
            height={48}
            className="rounded-[8px]"
            priority
          />
          <span className="sr-only">Home</span>
        </a>
        <nav className="flex items-center gap-4">
          <a className={link} href="/work-with-me">
            Work with me
          </a>
          <a className={link} href="/ecosystems">
            Ecosystems
          </a>
          <a className={link} href="/projects">
            Projects
          </a>
          <a className={link} href="/books">
            Books
          </a>
          <a className={link} href="/writing">
            Writing
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <ThemeProvider>
          <Nav />
          <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
          <footer className="border-t border-black/10 dark:border-white/10">
            <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-zinc-500 dark:text-zinc-400">
              <div className="flex flex-col gap-2">
                <div>
                  Open to consulting, partnerships, and selected full‑time roles.
                </div>
                <div className="flex gap-3">
                  <a className="underline hover:text-black dark:hover:text-white" href="/work-with-me">
                    Work with me
                  </a>
                  <a
                    className="underline hover:text-black dark:hover:text-white"
                    href="/projects"
                  >
                    Projects
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
