import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

import Image from 'next/image';
import Link from 'next/link';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { AsciiThemeBoot } from '@/components/ascii-theme-boot';
import WorldTimeDock from '@/components/world-time-dock';

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
// Prefer env var, but keep a safe default so verification survives redeploys.
const bingVerification =
  process.env.BING_SITE_VERIFICATION || '6eb9686badc546c2ac215812a702e4e4';

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Anton Biletskyi-Volokh',
  url: 'https://abvx.xyz',
  jobTitle: 'Product & Growth Strategist',
  sameAs: [
    'https://www.linkedin.com/in/abvcreative/',
    'https://github.com/markoblogo',
    'https://abvcreative.medium.com/',
    'https://abvx.substack.com/',
    'https://www.youtube.com/@ABV_Creative',
    'https://x.com/abv_creative',
    'https://www.behance.net/ABV_Creative',
    'https://www.instagram.com/abvcreative/',
    'https://t.me/ABVcreative',
    'https://www.vivino.com/users/anthony.bile',
    'https://bsky.app/profile/abvx.xyz',
  ],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ABVX',
  url: 'https://abvx.xyz',
};

type FooterSocialLink = {
  label: string;
  href: string;
  icon: ReactNode;
};

const footerSocialLinks: FooterSocialLink[] = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/abvcreative/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="footer-social-icon">
        <path
          fill="currentColor"
          d="M6 9h3v9H6V9zm1.5-4a1.7 1.7 0 1 1 0 3.4A1.7 1.7 0 0 1 7.5 5zM11 9h3v1.3c.6-.9 1.6-1.6 3.1-1.6 2.2 0 3.8 1.3 3.8 4.3V18h-3v-4.6c0-1.4-.6-2.2-1.8-2.2-1.1 0-2 .7-2 2.2V18h-3V9z"
        />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:a.biletskiy@gmail.com',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="footer-social-icon">
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M3.75 6.75h16.5v10.5H3.75zm0 .5 8.25 6 8.25-6"
        />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/markoblogo',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="footer-social-icon">
        <path
          fill="currentColor"
          d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"
        />
      </svg>
    ),
  },
  {
    label: 'Substack',
    href: 'https://abvx.substack.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="footer-social-icon">
        <path
          fill="currentColor"
          d="M22.5 8.2H1.5V5.4h21Zm-21 2.6V24l10.5-5.9L22.5 24V10.8Zm21-10.8H1.5v2.8h21Z"
        />
      </svg>
    ),
  },
  {
    label: 'Medium',
    href: 'https://abvcreative.medium.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="footer-social-icon">
        <path
          fill="currentColor"
          d="M4.4 5.6h4.1l3.6 8.4 3.6-8.4h3.9v.1c-.7.2-1.1.4-1.1 1.3v10.3c.1.7.4.9 1.1 1v.1h-4.9v-.1c.6-.1 1-.4 1.1-1V7.3l-4.8 11.1h-.2L6.2 7.6V17c0 .9.4 1.1 1 1.3v.1H4.4v-.1c.7-.2 1.1-.4 1.1-1.3V7c0-.9-.4-1.1-1.1-1.3ZM21.8 12.9c-.1 1.8.8 3.2 2.2 3.6v-7.2c-1.1 0-1.7 1.8-2.2 3.6"
        />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@ABV_Creative',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="footer-social-icon">
        <path
          fill="currentColor"
          d="M23.5 6.2A3 3 0 0 0 21.4 4C19.5 3.5 12 3.5 12 3.5S4.5 3.5 2.6 4A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8A3 3 0 0 0 2.6 20c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.2c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.5 15.6V8.4L15.8 12Z"
        />
      </svg>
    ),
  },
  {
    label: 'X',
    href: 'https://x.com/abv_creative',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="footer-social-icon">
        <path
          fill="currentColor"
          d="M14.2 10.2 23 0h-2.1l-7.6 8.8L7.3 0H.3l9.2 13.3L.3 24h2.1l8-9.3 6.4 9.3h7l-9.6-13.8Zm-2.8 3.3-.9-1.3L3.1 1.6h3.2l6 8.5.9 1.3 7.8 11.1h-3.2Z"
        />
      </svg>
    ),
  },
  {
    label: 'Bluesky',
    href: 'https://bsky.app/profile/abvx.xyz',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="footer-social-icon">
        <path
          fill="currentColor"
          d="M5.2 2.9C8 4.9 10.9 9.1 12 11.4c1.1-2.2 4-6.5 6.8-8.5C20.8 1.4 24 .2 24 3.9c0 .7-.4 6.2-.7 7-.9 3.1-4 3.8-6.8 3.4 4.9.8 6.1 3.6 3.5 6.3-5.1 5.2-7.3-1.3-7.8-3-.1-.3-.1-.4-.2-.3 0-.1 0 0-.1.3-.6 1.7-2.8 8.2-7.9 3-2.6-2.7-1.4-5.5 3.5-6.3-2.8.5-5.9-.3-6.8-3.4C.4 10 0 4.6 0 3.9.1.2 3.2 1.4 5.2 2.9"
        />
      </svg>
    ),
  },
  {
    label: 'Behance',
    href: 'https://www.behance.net/ABV_Creative',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="footer-social-icon">
        <path
          fill="currentColor"
          d="M17 16.9a2.6 2.6 0 0 0 1.9.7 2.5 2.5 0 0 0 1.5-.5c.4-.2.6-.6.8-1h2.6a5.1 5.1 0 0 1-1.9 2.9 5.3 5.3 0 0 1-3.1.9 5.8 5.8 0 0 1-2.3-.4 4.9 4.9 0 0 1-1.7-1.2 5.7 5.7 0 0 1-1.1-1.9 7.1 7.1 0 0 1-.4-2.4 5.3 5.3 0 0 1 5.5-5.9 4.9 4.9 0 0 1 2.4.6c.6.4 1.2.9 1.6 1.5a6.2 6.2 0 0 1 1 2.1c.2.8.2 1.7.2 2.5h-7.7c-.1.8.2 1.6.7 2.2ZM7 4.1a8.1 8.1 0 0 1 1.9.2 4.3 4.3 0 0 1 1.5.7c.4.3.8.7 1 1.2.2.6.3 1.2.3 1.8 0 .7-.2 1.4-.5 2a3.7 3.7 0 0 1-1.5 1.3 3.6 3.6 0 0 1 2 1.4c.4.7.7 1.6.6 2.5 0 .7-.1 1.4-.4 2a4 4 0 0 1-1.1 1.4c-.5.4-1 .7-1.7.8-.6.2-1.2.3-1.9.3H0V4.1Zm-.2 12.9c.3 0 .6 0 .9-.1.3-.1.5-.2.8-.3.2-.2.4-.4.5-.6.2-.3.2-.7.2-1a2.1 2.1 0 0 0-.7-1.7 2.6 2.6 0 0 0-1.7-.5H3.2V17Zm13.5-6a2.1 2.1 0 0 0-1.6-.6 2.3 2.3 0 0 0-1.1.2 2.5 2.5 0 0 0-.8.7 2.4 2.4 0 0 0-.4.8 3 3 0 0 0-.1.7H21a3.2 3.2 0 0 0-.7-1.8Zm-13.8-.6a2.3 2.3 0 0 0 1.5-.4c.4-.4.6-.9.5-1.4 0-.4 0-.7-.2-.9-.1-.2-.3-.4-.5-.5a1.9 1.9 0 0 0-.7-.3 4 4 0 0 0-.8-.1H3.2v3.6h3.3Zm15.1-5.2h-6v1.5h6Z"
        />
      </svg>
    ),
  },
  {
    label: 'Vivino',
    href: 'https://www.vivino.com/users/anthony.bile',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="footer-social-icon">
        <path
          fill="currentColor"
          d="M12.5 18c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2ZM12 24c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2ZM5.2 14c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2Zm4.4-5.9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2ZM12 3.9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2Zm2.4-3.9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2ZM11.6 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Zm-1.5-4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2Zm4.3-1.9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2Zm4.4 1.9c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Z"
        />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/abvcreative/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="footer-social-icon">
        <path
          fill="currentColor"
          d="M7 .1C5.8.1 5 .3 4.1.6c-.8.3-1.5.7-2.1 1.4C1.3 2.7.9 3.4.6 4.1.3 4.9.1 5.8.1 7.1 0 8.3 0 8.8 0 12s0 3.7.1 4.9c0 1.3.3 2.1.6 2.9.3.8.7 1.5 1.4 2.1.7.7 1.3 1.1 2.1 1.4.8.3 1.7.5 2.9.6 1.3.1 1.7.1 4.9.1s3.7 0 4.9-.1c1.3 0 2.1-.3 2.9-.6.8-.3 1.5-.7 2.1-1.4.7-.7 1.1-1.3 1.4-2.1.3-.8.5-1.7.6-2.9.1-1.3.1-1.7.1-4.9s0-3.7-.1-4.9c0-1.3-.3-2.1-.6-2.9-.3-.8-.7-1.5-1.4-2.1-.7-.7-1.3-1.1-2.1-1.4-.8-.3-1.7-.5-2.9-.6C15.7 0 15.2 0 12 0S8.3 0 7 .1Zm0 2.1c1.3-.1 1.6-.1 5-.1 3.3 0 3.7 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.9 0 3.4 0 3.7-.1 5-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-5 .1-3.3 0-3.7 0-4.9-.1-1.2-.1-1.8-.3-2.2-.4a3.7 3.7 0 0 1-2.3-2.3c-.2-.4-.4-1-.4-2.2A86 86 0 0 1 2.1 12c0-3.3 0-3.7.1-4.9.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4ZM18.4 4.1a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9ZM12 5.8A6.2 6.2 0 1 0 12 18.2 6.2 6.2 0 0 0 12 5.8Zm0 2.2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
        />
      </svg>
    ),
  },
  {
    label: 'Telegram',
    href: 'https://t.me/ABVcreative',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="footer-social-icon">
        <path
          fill="currentColor"
          d="M11.9 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0Zm5 7.2c.1 0 .3 0 .5.1a.5.5 0 0 1 .2.3c0 .1 0 .3 0 .5-.2 1.9-1 6.5-1.4 8.6-.2.9-.5 1.2-.8 1.2-.7.1-1.2-.4-1.9-.9-1.1-.7-1.7-1.1-2.7-1.8-1.2-.8-.4-1.2.3-1.9.2-.2 3.2-3 3.3-3.2 0 0 0-.2-.1-.2a.4.4 0 0 0-.2 0c-.1 0-1.8 1.1-5.1 3.3-.5.4-.9.5-1.3.5-.4 0-1.2-.2-1.9-.4-.7-.3-1.3-.4-1.3-.8 0-.2.3-.4.9-.7 3.5-1.5 5.8-2.5 7-3 3.3-1.4 4-1.6 4.5-1.6Z"
        />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/33635189545',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="footer-social-icon">
        <path
          fill="currentColor"
          d="M17.5 14.4c-.3-.2-1.8-.9-2-.9-.3-.1-.5-.2-.7.1l-.9 1.2c-.2.2-.4.2-.7.1-.3-.2-1.2-.5-2.4-1.5-.9-.8-1.5-1.8-1.6-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5s.1-.4 0-.5L8 6.8c-.2-.6-.5-.5-.7-.5H6.8c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.3.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4 0-.1-.3-.2-.6-.3ZM12 21.8h0a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.9 9.9 0 0 1-1.6-5.3 9.9 9.9 0 1 1 9.9 9.9ZM12.1 0h-.1A11.9 11.9 0 0 0 1.7 17.9L.1 24l6.3-1.7a12 12 0 0 0 5.7 1.5h0A11.9 11.9 0 0 0 24 12 12 12 0 0 0 12.1 0Z"
        />
      </svg>
    ),
  },
  {
    label: 'Amazon Author',
    href: 'https://www.amazon.com/stores/author/B0FTGN5QNK?ingress=0&visitId=45c49f9d-229e-4819-a5e5-f1584c00dce1&ref_=aufs_ap_ahdr_dsk_aa&ccs_id=928b370d-797b-4248-aa34-b13aac0a09cc',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="footer-social-icon">
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M5 4.75h9a3 3 0 0 1 3 3v11.5H8a3 3 0 0 0-3 3Zm12 14.5H8a3 3 0 0 0-3 3V7.75a3 3 0 0 1 3-3h9Zm-8.5-9h5M8.5 13h5m-5 3h3.5"
        />
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.6"
          d="M7.5 20.8c2 .8 4.6 1.1 7.2.8 1.7-.2 3.3-.6 4.6-1.3"
        />
      </svg>
    ),
  },
];

export const metadata: Metadata = {
  title: {
    default: 'Anton Biletskyi‑Volokh',
    template: '%s · Anton Biletskyi‑Volokh',
  },
  description:
    'Product & Growth Strategist. Building AI-native products, ecosystems, and publishing projects.',
  metadataBase: new URL('https://abvx.xyz'),
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    other: {
      ...(bingVerification ? { 'msvalidate.01': bingVerification } : {}),
    },
  },
  openGraph: {
    title: 'Anton Biletskyi‑Volokh',
    description:
      'Product & Growth Strategist. Building AI-native products, ecosystems, and publishing projects.',
    url: 'https://abvx.xyz',
    siteName: 'Anton Biletskyi‑Volokh',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anton Biletskyi‑Volokh',
    description:
      'Product & Growth Strategist. Building AI-native products, ecosystems, and publishing projects.',
  },
};

function Nav() {
  const link =
    'text-sm text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white';

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link
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
        </Link>
        <nav className="flex flex-wrap items-center gap-4">
          <Link className={link} href="/work-with-me">
            Work with me
          </Link>
          <Link className={link} href="/ecosystems">
            Ecosystems
          </Link>
          <Link className={link} href="/projects">
            Projects
          </Link>
          <Link className={link} href="/books">
            Books
          </Link>
          <Link className={link} href="/writing">
            Blogs
          </Link>
          <Link className={link} href="/about">
            About
          </Link>
          <ThemeToggle />
          <div id="ascii-toggle-anchor" className="ascii-toggle-anchor" />
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
      <head>
        <script
          type="application/ld+json"
          // JSON-LD must be a plain string.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <ThemeProvider>
          <AsciiThemeBoot />
          <Nav />
          <WorldTimeDock />
          <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
          <footer className="border-t border-black/10 dark:border-white/10">
            <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-zinc-500 dark:text-zinc-400">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div>
                    Open to consulting, partnerships, and selected full‑time roles.
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Link className="underline hover:text-black dark:hover:text-white" href="/work-with-me">
                      Work with me
                    </Link>
                    <Link className="underline hover:text-black dark:hover:text-white" href="/projects">
                      Projects
                    </Link>
                    <Link className="underline hover:text-black dark:hover:text-white" href="/writing">
                      Blogs
                    </Link>
                    <Link className="underline hover:text-black dark:hover:text-white" href="/books">
                      Books
                    </Link>
                    <Link className="underline hover:text-black dark:hover:text-white" href="/links">
                      Links
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Elsewhere
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {footerSocialLinks.map((social) => {
                      const isExternal = social.href.startsWith('http');

                      return (
                        <a
                          key={social.label}
                          className="footer-social-link"
                          href={social.href}
                          aria-label={social.label}
                          title={social.label}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noreferrer' : undefined}
                        >
                          {social.icon}
                        </a>
                      );
                    })}
                  </div>
                </div>

                <div className="ascii-footnote">
                  This landing uses an experimental ASCII theme mode (toggle in the header) · Source:{' '}
                  <a href="https://github.com/markoblogo/AsciiTheme" target="_blank" rel="noreferrer">
                    AsciiTheme
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
