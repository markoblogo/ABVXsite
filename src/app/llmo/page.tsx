import FAQSection from '@/components/FAQSection';
import JsonLd from '@/components/JsonLd';
import type { ContentFaq } from '@/content';
import { faqPageJsonLd, SITE_URL } from '@/lib/seo';
import Link from 'next/link';

export const metadata = {
  title: 'LLMO / Agent-ready Visibility',
  description:
    'A focused gateway for LLM optimization, agent-ready documentation, structured metadata, and AI search visibility work by ABVX.',
  alternates: { canonical: 'https://abvx.xyz/llmo' },
};

const llmoFaqs: ContentFaq[] = [
  {
    question: 'What does LLMO mean?',
    answer:
      'LLMO means LLM Optimization: improving how clearly a site, brand, product or knowledge base can be understood by large language models and AI-search systems.',
  },
  {
    question: 'What changes first in an LLMO pass?',
    answer:
      'The first changes are usually entity clarity, page intent, canonical metadata, internal crosslinks, structured content indexes and JSON-LD that matches what users can actually see on the page.',
  },
  {
    question: 'Is this a replacement for SEO?',
    answer:
      'No. It extends SEO into AI-mediated discovery. Traditional crawlability, titles and page quality still matter, but LLMO adds structured context, entity consistency and agent-readable references.',
  },
];

export default function LLMOPage() {
  return (
    <div className="flex flex-col gap-10">
      <JsonLd id="jsonld-llmo-faq" data={faqPageJsonLd({ id: `${SITE_URL}/llmo#faq`, faqs: llmoFaqs })} />
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Agent-ready visibility</h1>
        <p className="text-zinc-700 dark:text-zinc-300">
          abvx llmo is a pragmatic set of improvements that makes your site and docs easier to parse
          for humans and language models: clear page intent, predictable structure, and fewer dead ends.
        </p>
      </header>

      <section className="rounded-xl border border-black/10 bg-black/5 p-6 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">What it includes</h2>
        <ul className="mt-3 list-disc space-y-1 pl-4">
          <li>Information architecture: navigation, page hierarchy, and content clusters.</li>
          <li>Internal linking and anchor text that reflects user intent.</li>
          <li>Metadata hygiene: titles, descriptions, canonicalization.</li>
          <li>Structured data basics (JSON-LD) where it helps entity understanding.</li>
          <li>Agent-ready docs patterns: predictable, referenceable, reusable pages.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-black/10 bg-black/5 p-6 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">What it is not</h2>
        <ul className="mt-3 list-disc space-y-1 pl-4">
          <li>No gimmicks and no promises of rankings.</li>
          <li>No keyword stuffing.</li>
          <li>No heavy “SEO content” that makes the product harder to understand.</li>
        </ul>
      </section>

      <FAQSection id="llmo-faq-title" title="LLMO methodology questions." faqs={llmoFaqs} />

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
          href="/about"
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-950 hover:border-black/30 dark:border-white/15 dark:text-white dark:hover:border-white/30"
        >
          About Anton (ABVX)
        </Link>
      </section>
    </div>
  );
}
