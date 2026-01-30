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
            className="rounded-[8px] invert dark:invert-0"
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
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div>
                    Open to consulting, partnerships, and selected full‑time roles.
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <a className="underline hover:text-black dark:hover:text-white" href="/work-with-me">
                      Work with me
                    </a>
                    <a className="underline hover:text-black dark:hover:text-white" href="/projects">
                      Projects
                    </a>
                    <a className="underline hover:text-black dark:hover:text-white" href="/writing">
                      Writing
                    </a>
                    <a className="underline hover:text-black dark:hover:text-white" href="/books">
                      Books
                    </a>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Elsewhere
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <a className="underline hover:text-black dark:hover:text-white" href="https://www.linkedin.com/in/abvcreative/" target="_blank" rel="noreferrer">
                      LinkedIn
                    </a>
                    <a className="underline hover:text-black dark:hover:text-white" href="mailto:a.biletskiy@gmail.com">
                      Email
                    </a>
                    <a className="underline hover:text-black dark:hover:text-white" href="https://github.com/markoblogo" target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                    <a className="underline hover:text-black dark:hover:text-white" href="https://abvx.substack.com/" target="_blank" rel="noreferrer">
                      Substack
                    </a>
                    <a className="underline hover:text-black dark:hover:text-white" href="https://abvcreative.medium.com/" target="_blank" rel="noreferrer">
                      Medium
                    </a>
                    <a className="underline hover:text-black dark:hover:text-white" href="https://www.youtube.com/@ABV_Creative" target="_blank" rel="noreferrer">
                      YouTube
                    </a>
                    <a className="underline hover:text-black dark:hover:text-white" href="https://x.com/abv_creative" target="_blank" rel="noreferrer">
                      X
                    </a>
                    <a className="underline hover:text-black dark:hover:text-white" href="https://www.behance.net/ABV_Creative" target="_blank" rel="noreferrer">
                      Behance
                    </a>
                    <a className="underline hover:text-black dark:hover:text-white" href="https://www.instagram.com/abvcreative/" target="_blank" rel="noreferrer">
                      Instagram
                    </a>
                    <a className="underline hover:text-black dark:hover:text-white" href="https://t.me/ABVcreative" target="_blank" rel="noreferrer">
                      Telegram
                    </a>
                    <a className="underline hover:text-black dark:hover:text-white" href="https://wa.me/33635189545" target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                    <a className="underline hover:text-black dark:hover:text-white" href="https://www.amazon.com/stores/author/B0FTGN5QNK?ingress=0&visitId=45c49f9d-229e-4819-a5e5-f1584c00dce1&ref_=aufs_ap_ahdr_dsk_aa&ccs_id=928b370d-797b-4248-aa34-b13aac0a09cc" target="_blank" rel="noreferrer">
                      Amazon Author
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
