import BreadcrumbNav from '@/components/BreadcrumbNav';
import FAQSection from '@/components/FAQSection';
import JsonLd from '@/components/JsonLd';
import { getServicePageBySlug, servicePages } from '@/content/service-pages';
import { breadcrumbJsonLd, defaultOgImage, faqPageJsonLd, metadataWithImage, SITE_URL } from '@/lib/seo';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return servicePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getServicePageBySlug(slug);

  if (!page) {
    return {};
  }

  return metadataWithImage({
    title: page.metaTitle,
    description: page.summary,
    canonicalPath: `/work-with-me/${page.slug}`,
    image: defaultOgImage,
  });
}

export default async function WorkWithMeServicePage({ params }: PageProps) {
  const { slug } = await params;
  const page = getServicePageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="work-with-me-page flex flex-col gap-10">
      <JsonLd
        id={`jsonld-service-${page.slug}-faq`}
        data={faqPageJsonLd({ id: `${SITE_URL}/work-with-me/${page.slug}#faq`, faqs: page.faqs })}
      />
      <JsonLd
        id={`jsonld-service-${page.slug}-breadcrumb`}
        data={breadcrumbJsonLd([
          { name: 'ABVX', url: SITE_URL },
          { name: 'Work with me', url: `${SITE_URL}/work-with-me` },
          { name: page.shortTitle, url: `${SITE_URL}/work-with-me/${page.slug}` },
        ])}
      />

      <BreadcrumbNav
        items={[
          { label: 'Work with me', href: '/work-with-me' },
          { label: page.shortTitle },
        ]}
      />

      <header className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 dark:border-white/10 dark:bg-white/[0.03] sm:p-7">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="wm-chip wm-chip--accent">{page.eyebrow}</span>
          {page.tags.slice(0, 3).map((tag) => (
            <span className="wm-chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <h1 className="max-w-3xl text-2xl font-semibold tracking-tight sm:text-3xl">{page.title}</h1>
        <p className="mt-3 max-w-3xl text-zinc-700 dark:text-zinc-300">{page.summary}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="wm-btn wm-btn--primary" href="#start-conversation">
            Start a conversation
          </a>
          <Link className="wm-btn wm-btn--secondary" href="/about">
            Check background
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Service fit, deliverables and proof">
        <div className="wm-card rounded-xl p-5">
          <div className="wm-chip">Best fit</div>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
            {page.bestFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="wm-card rounded-xl p-5">
          <div className="wm-chip">Typical output</div>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
            {page.deliverables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="wm-card wm-card--accent rounded-xl p-5">
          <div className="wm-chip wm-chip--accent">Evidence</div>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
            {page.proofPoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wm-panel rounded-xl p-6" aria-labelledby="related-work-title">
        <h2 id="related-work-title" className="text-lg font-semibold">
          Related public evidence
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {page.related.map((item) => (
            <Link className="wm-card rounded-xl p-4 no-underline" href={item.href} key={item.href}>
              <span className="text-sm font-semibold">{item.label}</span>
              <span className="mt-2 block text-sm text-zinc-600 dark:text-zinc-300">{item.note}</span>
            </Link>
          ))}
        </div>
      </section>

      <FAQSection id="service-faq-title" title="Common fit questions." faqs={page.faqs} />

      <section className="wm-cta flex flex-col gap-3 rounded-xl p-6" id="start-conversation">
        <h2 className="text-lg font-semibold">Start with a short brief</h2>
        <p className="text-sm">
          Send what you are building, who needs to understand it, and what decision or launch moment is blocked.
        </p>
        <div className="flex flex-wrap gap-3">
          <a className="wm-btn wm-btn--primary" href="https://www.linkedin.com/in/abvcreative/" target="_blank" rel="noopener noreferrer">
            LinkedIn DM
          </a>
          <a className="wm-btn wm-btn--secondary" href="mailto:a.biletskiy@gmail.com">
            Email
          </a>
          <Link className="wm-btn wm-btn--secondary" href="/work-with-me">
            All collaboration tracks
          </Link>
        </div>
      </section>
    </div>
  );
}
