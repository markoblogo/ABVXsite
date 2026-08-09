import JsonLd from '@/components/JsonLd';
import AmiTrackedLink from '@/components/ami/AmiTrackedLink';
import { absoluteUrl, defaultOgImage, SITE_URL } from '@/lib/seo';
import { amiCopy, amiProducts, type AmiLocale } from '@/lib/ami-content';
import Image from 'next/image';

type Props = {
  locale: AmiLocale;
};

const productLinkMap: Record<string, string> = {
  MN7R: 'https://mn7r.com/',
  'Cropto Monitor': 'https://abvx.xyz/work/cropto-monitor',
  'SPIKE SPOT INDEX': 'https://spike.1d3x.com/en',
  'UGA Index': 'https://uga.1d3x.com/',
  '1D3X': 'https://1d3x.com/',
  Cropto: 'https://cr0pto.com/',
  Liqua: 'https://liqua.cr0pto.com/',
};

function isExternal(href: string) {
  return href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:');
}

export default function AmiLanding({ locale }: Props) {
  const copy = amiCopy[locale];
  const alternate = amiCopy[locale === 'en' ? 'fr' : 'en'];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${absoluteUrl(copy.path)}#page`,
        name: copy.title,
        url: absoluteUrl(copy.path),
        inLanguage: locale,
        description: copy.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        publisher: { '@id': `${SITE_URL}/#organization` },
        about: { '@id': `${SITE_URL}/#organization` },
        image: defaultOgImage.url,
      },
      {
        '@type': 'ItemList',
        '@id': `${absoluteUrl(copy.path)}#products`,
        name: locale === 'en' ? 'AMI ecosystem products' : "Produits de l'écosystème AMI",
        itemListElement: amiProducts.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'CreativeWork',
            name: product.name,
            url: product.href,
            description: product.summary,
          },
        })),
      },
    ],
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd id={`ami-jsonld-${locale}`} data={jsonLd} />

      <section className="overflow-hidden rounded-[2rem] border border-zinc-300/70 bg-zinc-950 text-zinc-50 shadow-2xl shadow-zinc-950/20">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col justify-between gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                {copy.heroEyebrow}
              </div>
              <AmiTrackedLink
                href={copy.alternatePath}
                eventName="AMI Language Switch"
                props={{ from: copy.locale, to: alternate.locale }}
                className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-white/35 hover:text-white"
              >
                {copy.alternateLabel}
              </AmiTrackedLink>
            </div>

            <div className="max-w-3xl">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {copy.heroTitle}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl">
                {copy.heroSummary}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <AmiTrackedLink
                  href="#ecosystem"
                  eventName="AMI CTA"
                  props={{ locale, cta: 'explore_ecosystem' }}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                >
                  {copy.heroPrimaryCta}
                </AmiTrackedLink>
                <AmiTrackedLink
                  href="#contact"
                  eventName="AMI CTA"
                  props={{ locale, cta: 'work_together' }}
                  className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/45 hover:bg-white/6"
                >
                  {copy.heroSecondaryCta}
                </AmiTrackedLink>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-zinc-400">
              {['Brokerage operations', 'Market intelligence', 'Benchmarks & indices', 'AI knowledge layer'].map((chip) => (
                <span key={chip} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 border-t border-white/10 bg-white/[0.03] p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-900">
              <Image src="/media/work/liqua/hero.webp" alt="Liqua market infrastructure surface" width={1600} height={900} className="h-full w-full object-cover" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-zinc-900">
                <Image src="/media/work/mn7r/hero.png" alt="MN7R brokerage operations workspace" width={1600} height={900} className="h-full w-full object-cover" />
              </div>
              <div className="relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-zinc-900">
                <Image src="/media/work/spike-spot-commodity-index-ukraine/hero.webp" alt="SPIKE benchmark surface" width={1600} height={900} className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="ecosystem" className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6">
          <div className="eyebrow">{copy.sectionLabels.ecosystem}</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{copy.sectionLabels.ecosystem}</h2>
          <p className="mt-3 max-w-4xl text-base leading-7 text-zinc-700 dark:text-zinc-300">{copy.ecosystemIntro}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-5">
          {copy.ecosystemLayers.map((layer) => (
            <div key={layer.name} className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">{layer.name}</div>
              <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{layer.detail}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {layer.links.map((label) => {
                  const href = productLinkMap[label];
                  return href ? (
                    <AmiTrackedLink
                      key={label}
                      href={href}
                      external={isExternal(href)}
                      eventName="AMI Ecosystem Link"
                      props={{ locale, label }}
                      className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white"
                    >
                      {label}
                    </AmiTrackedLink>
                  ) : (
                    <span key={label} className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6">
          <div className="eyebrow">{copy.sectionLabels.products}</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{copy.sectionLabels.products}</h2>
          <p className="mt-3 max-w-4xl text-base leading-7 text-zinc-700 dark:text-zinc-300">{copy.productsIntro}</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {amiProducts.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="relative aspect-[16/10] overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
                <Image src={product.image} alt={product.imageAlt} fill className="object-cover" />
              </div>
              <div className="p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">{product.role}</div>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{product.name}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{product.summary}</p>
                <div className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">{product.proofLabel}</div>
                <AmiTrackedLink
                  href={product.href}
                  external
                  eventName="AMI Product Click"
                  props={{ locale, product: product.id }}
                  className="mt-5 inline-flex items-center text-sm font-semibold text-zinc-950 underline underline-offset-4 transition hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
                >
                  Explore ↗
                </AmiTrackedLink>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="eyebrow">{copy.sectionLabels.cortex}</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{copy.cortexTitle}</h2>
          <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">{copy.cortexSummary}</p>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            {copy.cortexBullets.map((bullet) => (
              <li key={bullet} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="eyebrow">{copy.sectionLabels.built}</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{copy.builtTitle}</h2>
          <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">{copy.builtSummary}</p>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            {copy.builtProofs.map((proof) => (
              <li key={proof} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                {proof}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="eyebrow">{copy.sectionLabels.knowledge}</div>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{copy.knowledgeTitle}</h2>
        <p className="mt-4 max-w-4xl text-base leading-7 text-zinc-700 dark:text-zinc-300">{copy.knowledgeSummary}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {copy.knowledgeBullets.map((bullet) => (
            <div key={bullet} className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5 text-sm leading-6 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              {bullet}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="eyebrow">{copy.sectionLabels.workWithAmi}</div>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{copy.workWithAmiTitle}</h2>
        <p className="mt-4 max-w-4xl text-base leading-7 text-zinc-700 dark:text-zinc-300">{copy.workWithAmiSummary}</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {copy.collaborationPaths.map((path) => (
            <div key={path.id} className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{path.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{path.summary}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {path.audience.map((item) => (
                  <li key={item} className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="rounded-[2rem] border border-zinc-950 bg-zinc-950 p-6 text-zinc-50 shadow-2xl shadow-zinc-950/15">
        <div className="eyebrow text-zinc-400">{copy.sectionLabels.contact}</div>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">{copy.contactTitle}</h2>
        <p className="mt-4 max-w-4xl text-base leading-7 text-zinc-300">{copy.contactSummary}</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <ul className="grid gap-3 text-sm leading-6 text-zinc-300">
            {copy.contactBullets.map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-start gap-3 lg:flex-col">
            <AmiTrackedLink
              href="mailto:a.biletskiy@gmail.com?subject=AMI%20infrastructure"
              external
              eventName="AMI Contact Click"
              props={{ locale, type: 'email' }}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              Email directly
            </AmiTrackedLink>
            <AmiTrackedLink
              href="https://www.linkedin.com/in/abvcreative/"
              external
              eventName="AMI Contact Click"
              props={{ locale, type: 'linkedin' }}
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/45 hover:bg-white/6"
            >
              LinkedIn ↗
            </AmiTrackedLink>
          </div>
        </div>
        <p className="mt-6 text-xs leading-6 text-zinc-500">{copy.footerNote}</p>
      </section>
    </div>
  );
}
