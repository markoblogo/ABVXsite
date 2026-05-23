import FAQSection from '@/components/FAQSection';
import BookCatalogueCard from '@/components/BookCatalogueCard';
import ProjectCatalogueCard from '@/components/ProjectCatalogueCard';
import JsonLd from '@/components/JsonLd';
import PageHeader from '@/components/PageHeader';
import SectionPanel from '@/components/SectionPanel';
import { getArtifactsBySection, getBooksBySection } from '@/content';
import type { Artifact, Book, ContentFaq } from '@/content';
import { toPublicArtifact } from '@/content/public-props';
import { fetchMn7rFeed, type FeedItem } from '@/lib/feeds';
import { artifactListItem, bookListItem, collectionPageJsonLd, faqPageJsonLd, focusOgImage, itemListJsonLd, metadataWithImage, SITE_URL } from '@/lib/seo';
import type { Metadata } from 'next';
import Link from 'next/link';

const focusDescription =
  'Expert map of agro commodity market infrastructure: trading systems, benchmark indexes, monitoring layers, market fronts and AI-assisted workflows for physical commodity markets.';

export const metadata: Metadata = metadataWithImage({
  title: 'Agro Commodity Market Infrastructure',
  description: focusDescription,
  canonicalPath: '/focus',
  image: focusOgImage,
});

export const revalidate = 900;

const focusGroups = [
  {
    title: 'Trading & Brokerage Platforms',
    description:
      'Platforms where brokerage teams, market participants or trading workflows can manage real or simulated commodity-market transactions, deal pipelines and execution layers.',
    slugs: ['mn7r', 'cropto'],
    variant: 'primary',
  },
  {
    title: 'Market Intelligence, Monitoring & Indexes',
    description:
      'Monitoring and index products that turn fragmented market data, news, logistics, weather, crop, signal and commodity-market context into readable intelligence.',
    slugs: ['cropto-monitor', 'mn7r-blog', 'last30days-cropto', 'spike-spot-commodity-index-ukraine', 'uga-index'],
    variant: 'standard',
  },
  {
    title: 'Market Fronts & Partner Landings',
    description:
      'Market-facing landing pages, decks and commercial fronts for commodity infrastructure projects, partner ventures and trading-service concepts.',
    slugs: ['trade-solution-eu', 'cropto-market-risk-deck', 'liqua'],
    variant: 'standard',
  },
] as const;

const focusBookGroup = {
  title: 'Books & Field Manuals',
  description:
    'Publishing surfaces, practical manuals and free editions connected to agro-commodity brokerage, operational market workflows and the MN7R infrastructure ecosystem.',
  slugs: ['mn7r-agro-commodity-brokerage-en-free-edition', 'mn7r-agro-commodity-brokerage-ua-free-edition'],
} as const;

const focusFaqs: ContentFaq[] = [
  {
    question: 'What belongs in the ABVX Focus area?',
    answer:
      'Focus contains the active agro-commodity infrastructure layer: brokerage systems, market intelligence surfaces, benchmark indexes, partner fronts and practical tools for physical commodity markets.',
  },
  {
    question: 'Why are benchmark and monitoring systems grouped together?',
    answer:
      'They solve the same infrastructure problem from different angles. Indexes provide structured reference pricing, while monitoring systems provide market context, signals and situational awareness.',
  },
  {
    question: 'Is every Focus project a trading platform?',
    answer:
      'No. Some projects support execution, but others are reference-data, benchmark, intelligence, risk, landing or coordination layers around the physical agro-commodity market ecosystem.',
  },
];

const focusPillarLinks = [
  { label: 'Cropto', href: '/work/cropto', description: 'market infrastructure and trading-service layer' },
  { label: 'MN7R', href: '/work/mn7r', description: 'brokerage operating system and transaction workflow layer' },
  { label: 'SPIKE', href: '/work/spike-spot-commodity-index-ukraine', description: 'Ukrainian spot benchmark and reference-price layer' },
  { label: 'UGA Index', href: '/work/uga-index', description: 'Ukrainian export benchmark platform' },
  { label: 'Cropto Monitor', href: '/work/cropto-monitor', description: 'commodity signals and monitoring terminal' },
  { label: 'Liqua', href: '/work/liqua', description: 'market-front and commercial coordination layer' },
];

const infrastructureLayers = [
  {
    title: 'Trading and brokerage layer',
    description:
      'Systems for deal flow, brokerage coordination, transaction context, counterparties, execution workflows and operational market memory.',
    links: ['MN7R', 'Cropto'],
  },
  {
    title: 'Monitoring and intelligence layer',
    description:
      'Dashboards and signal surfaces for prices, logistics, weather, policy, risk, freight, ports, crop conditions and live situational awareness.',
    links: ['Cropto Monitor'],
  },
  {
    title: 'Benchmark and index layer',
    description:
      'Reference-price infrastructure that turns fragmented spot indications into structured benchmarks for comparison, analysis and market coordination.',
    links: ['SPIKE', 'UGA Index'],
  },
  {
    title: 'Market front and partner layer',
    description:
      'External-facing product surfaces, landing systems and partner fronts that translate infrastructure into concrete offers, narratives and collaboration entry points.',
    links: ['Cropto', 'Liqua'],
  },
];

const focusUseCases = [
  'Compare Ukrainian grain and oilseed spot references without relying only on informal bilateral quote circulation.',
  'Monitor logistics, weather, freight, policy and port context around physical agro-commodity markets.',
  'Give brokerage teams a clearer operating surface for market memory, client context and transaction workflows.',
  'Expose benchmark methodology and reference-pricing logic in a way analysts, exporters, processors and traders can inspect.',
  'Connect product fronts, partner landings and commercial narratives back to the underlying market infrastructure.',
  'Prepare market data and project pages for AI-assisted discovery, retrieval and structured understanding.',
];

function itemsForGroup(artifacts: Artifact[], slugs: readonly string[]): Artifact[] {
  const bySlug = new Map(artifacts.map((artifact) => [artifact.slug, artifact]));
  return slugs.map((slug) => bySlug.get(slug)).filter((item): item is Artifact => Boolean(item));
}

function booksForGroup(books: Book[], slugs: readonly string[] = []): Book[] {
  const bySlug = new Map(books.map((book) => [book.slug, book]));
  return slugs.map((slug) => bySlug.get(slug)).filter((item): item is Book => Boolean(item));
}

function linkByLabel(label: string) {
  return focusPillarLinks.find((item) => item.label === label);
}

function slugifyFragment(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function safeLatestMn7rFeed(feedUrl?: string): Promise<FeedItem | null> {
  if (!feedUrl) return null;
  try {
    const items = await fetchMn7rFeed(feedUrl);
    return items[0] || null;
  } catch {
    return null;
  }
}

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const time = new Date(iso);
  if (Number.isNaN(time.valueOf())) return undefined;
  return time.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function siteLink(artifact: Artifact): string | undefined {
  return artifact.links.find((link) => link.type === 'site')?.url;
}

function feedCardProps(artifact: Artifact, latest: FeedItem | null) {
  if (artifact.slug !== 'mn7r-blog') return {};

  return {
    href: latest?.url || siteLink(artifact) || `/work/${artifact.slug}`,
    title: latest?.title || artifact.title,
    summary: latest?.excerpt || artifact.summary,
    image: latest?.coverImage
      ? {
          src: latest.coverImage,
          alt: latest.title,
          role: 'rss-image' as const,
          mediaRole: 'rss-image' as const,
        }
      : undefined,
    meta: latest?.publishedAt ? `MN7R Blog / ${formatDate(latest.publishedAt)}` : 'MN7R Blog / live RSS',
  };
}

export default async function FocusPage() {
  const artifacts = getArtifactsBySection('focus');
  const books = getBooksBySection('focus').filter((book) => book.type !== 'series');
  const listedArtifacts = focusGroups.flatMap((group) => itemsForGroup(artifacts, group.slugs));
  const listedBooks = booksForGroup(books, focusBookGroup.slugs);
  const mn7rBlog = artifacts.find((artifact) => artifact.slug === 'mn7r-blog');
  const mn7rLatest = await safeLatestMn7rFeed(mn7rBlog?.rssFeed?.enabled ? mn7rBlog.rssFeed.url : undefined);

  return (
    <div className="route-focus grid gap-8">
      <JsonLd
        id="jsonld-focus-page"
        data={collectionPageJsonLd({
          id: `${SITE_URL}/focus#page`,
          name: 'Current Focus',
          description: focusDescription,
          url: `${SITE_URL}/focus`,
          image: focusOgImage,
        })}
      />
      <JsonLd
        id="jsonld-focus-list"
        data={itemListJsonLd({
          id: `${SITE_URL}/focus#items`,
          name: 'Focus market infrastructure projects',
          items: [...listedArtifacts.map(artifactListItem), ...listedBooks.map(bookListItem)],
        })}
      />
      <JsonLd id="jsonld-focus-faq" data={faqPageJsonLd({ id: `${SITE_URL}/focus#faq`, faqs: focusFaqs })} />
      <PageHeader
        eyebrow="Current Focus"
        title="Agro Commodity Trading Infrastructure"
        summary="Digital infrastructure, standards, indexes, workflows and AI-assisted tools for physical agro-commodity markets."
      >
        <div className="focus-pillar-links" aria-label="Key infrastructure projects">
          {focusPillarLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </PageHeader>

      <section className="focus-explainer" aria-labelledby="agro-market-infrastructure-title">
        <div className="focus-product-group__header">
          <div className="eyebrow">Pillar page</div>
          <h2 id="agro-market-infrastructure-title">What agro commodity market infrastructure means.</h2>
          <p>
            Agro commodity market infrastructure is the digital and methodological layer around
            physical grain and oilseed markets: systems that help participants observe prices,
            compare benchmarks, coordinate trading workflows and understand market context.
          </p>
        </div>

        <div className="focus-explainer-grid">
          <section className="focus-explainer-panel">
            <div className="eyebrow">Definition</div>
            <h3>Not one product category.</h3>
            <p>
              It includes trading and brokerage systems like <Link href="/work/mn7r">MN7R</Link>,
              market infrastructure surfaces like <Link href="/work/cropto">Cropto</Link>,
              reference-price products like <Link href="/work/spike-spot-commodity-index-ukraine">SPIKE</Link> and{' '}
              <Link href="/work/uga-index">UGA Index</Link>, and intelligence terminals like{' '}
              <Link href="/work/cropto-monitor">Cropto Monitor</Link>.
            </p>
          </section>
          <section className="focus-explainer-panel">
            <div className="eyebrow">Why it matters</div>
            <h3>Physical markets are fragmented.</h3>
            <p>
              Commodity-market decisions depend on port access, logistics, freight, currency,
              policy, quality, crop conditions, exporter demand and processor demand. Infrastructure
              turns that fragmented context into repeatable workflows, reference points and shared
              market language.
            </p>
          </section>
        </div>
      </section>

      <section className="focus-layer-map" aria-labelledby="infrastructure-layers-title">
        <div className="focus-product-group__header">
          <div className="eyebrow">Ecosystem map</div>
          <h2 id="infrastructure-layers-title">Benchmark, monitoring and trading layers.</h2>
          <p>
            The focus area is organized as an ecosystem rather than a flat portfolio. Each layer
            supports a different part of market coordination.
          </p>
        </div>
        <div className="focus-layer-grid">
          {infrastructureLayers.map((layer) => (
            <section key={layer.title} className="focus-layer-panel">
              <h3>{layer.title}</h3>
              <p>{layer.description}</p>
              <div className="focus-layer-links">
                {layer.links.map((label) => {
                  const item = linkByLabel(label);
                  if (!item) return null;
                  return (
                    <Link key={item.href} href={item.href}>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="focus-use-cases" aria-labelledby="focus-use-cases-title">
        <div className="focus-product-group__header">
          <div className="eyebrow">Use cases</div>
          <h2 id="focus-use-cases-title">What this infrastructure is for.</h2>
          <p>
            These projects are built around concrete market operations: reference pricing,
            monitoring, brokerage workflows, partner entry points and AI-readable public context.
          </p>
        </div>
        <ol className="focus-use-case-list">
          {focusUseCases.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      {focusGroups.map((group) => {
        const groupItems = itemsForGroup(artifacts, group.slugs);
        if (!groupItems.length) return null;
        const titleId = slugifyFragment(group.title);

        return (
          <section key={group.title} className="home-section focus-product-group" aria-labelledby={titleId}>
            <div className="focus-product-group__header">
              <div className="eyebrow">Focus group</div>
              <h2 id={titleId}>{group.title}</h2>
              <p>{group.description}</p>
            </div>
            <div className={group.variant === 'primary' ? 'focus-platform-grid' : 'focus-product-grid'}>
              {groupItems.map((artifact) => (
                <ProjectCatalogueCard
                  key={artifact.id}
                  artifact={toPublicArtifact(artifact)}
                  tone="focus"
                  {...feedCardProps(artifact, mn7rLatest)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {listedBooks.length ? (
        <section className="home-section focus-product-group focus-book-group" aria-labelledby="books-field-manuals">
          <div className="focus-product-group__header">
            <div className="eyebrow">Focus library</div>
            <h2 id="books-field-manuals">{focusBookGroup.title}</h2>
            <p>{focusBookGroup.description}</p>
          </div>
          <div className="focus-book-grid">
            {listedBooks.map((book) => (
              <BookCatalogueCard
                key={book.id}
                book={book}
                tone={book.type === 'free-book' || book.type === 'free-edition' || book.type === 'companion' ? 'free-resource' : 'book'}
                variantLabel={book.type === 'free-book' || book.type === 'free-edition' ? 'FREE RESOURCE' : 'BOOK'}
                mediaVariant="landscape"
                metaOverride="Безкоштовне українське видання"
              />
            ))}
          </div>
        </section>
      ) : null}

      <FAQSection id="focus-faq-title" title="Focus methodology questions." faqs={focusFaqs} />

      <SectionPanel title="Partnerships and market systems" eyebrow="CTA" accent>
        <p>
          Open to conversations around brokerage infrastructure, market interfaces,
          commodity data products, standards, indexes, AI-assisted workflows and
          practical collaboration in physical agro-commodity markets.
        </p>
        <Link className="panel-link" href="mailto:a.biletskiy@gmail.com">
          Start a conversation
        </Link>
      </SectionPanel>
    </div>
  );
}
