import HeroPoster from '@/components/HeroPoster';
import HomepageLatestCard from '@/components/HomepageLatestCard';
import JsonLd from '@/components/JsonLd';
import MarqueeTicker from '@/components/MarqueeTicker';
import SectionPanel from '@/components/SectionPanel';
import TagList from '@/components/TagList';
import { getLatestSectionEntryBook, getLatestSectionEntryWork } from '@/content';
import { fetchMediumFeed, fetchMn7rFeed, fetchSubstackFeed, type FeedItem } from '@/lib/feeds';
import { collectionPageJsonLd, defaultOgImage, itemListJsonLd, metadataWithImage, SITE_URL } from '@/lib/seo';
import type { Metadata } from 'next';
import Link from 'next/link';

const homeDescription =
  'Anton Biletskyi-Volokh builds AI-native operating systems for complex markets: agro-commodity brokerage, trading workflows, market intelligence and agentic development infrastructure.';

export const metadata: Metadata = metadataWithImage({
  title: 'ABVX',
  description: homeDescription,
  canonicalPath: '/',
  image: defaultOgImage,
});

export const revalidate = 900;

const heroLabels = [
  'MARKET INFRASTRUCTURE',
  'AGRO BROKERAGE',
  'AI-NATIVE SYSTEMS',
  'WORKFLOW ORCHESTRATION',
  'MARKET INTELLIGENCE',
  'STRATEGIC GTM',
];

const fallbackLatest = {
  focus: {
    title: 'Current Focus',
    summary:
      'Agro-commodity trading infrastructure, brokerage workflows, market interfaces, indexes, standards and AI-assisted tools.',
  },
  systems: {
    title: 'Systems Catalogue',
    summary:
      'Web services, agentic development experiments, protocols, AI/dev utilities, language systems and technical companions.',
  },
  books: {
    title: 'ABVX Press',
    summary:
      'Books, translations, series and publishing projects across AI, strategy, language, culture, markets and systems thinking.',
  },
  medium: {
    title: 'Medium',
    summary:
      'Applied AI reviews, product notes, and research breakdowns from the Medium archive.',
  },
  substack: {
    title: 'Substack',
    summary:
      'Longer essays and field notes on validation, decisions, automation, and AI-native work.',
  },
  mn7rBlog: {
    title: 'MN7R Blog',
    summary:
      'Operational notes, brokerage workflows, execution systems and market infrastructure research from the MN7R ecosystem.',
  },
};

async function safeLatestFeed(
  source: FeedItem['source'],
  fetcher: (url: string) => Promise<FeedItem[]>,
  url: string,
): Promise<FeedItem | null> {
  try {
    const items = await fetcher(url);
    return items.find((item) => item.source === source) || items[0] || null;
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

export default async function Home() {
  const [mediumLatest, substackLatest, mn7rLatest] = await Promise.all([
    safeLatestFeed('medium', fetchMediumFeed, 'https://abvcreative.medium.com/feed'),
    safeLatestFeed('substack', fetchSubstackFeed, 'https://abvx.substack.com/feed'),
    safeLatestFeed('mn7r', fetchMn7rFeed, 'https://mn7r.com/rss.xml'),
  ]);

  const latestFocus = getLatestSectionEntryWork('focus', 'mn7r-blog');
  const latestSystem = getLatestSectionEntryWork('systems', latestFocus?.slug);
  const latestBook = getLatestSectionEntryBook('books');

  return (
    <div className="home-redesign">
      <JsonLd
        id="jsonld-home-page"
        data={collectionPageJsonLd({
          id: `${SITE_URL}/#home`,
          name: 'ABVX',
          description: homeDescription,
          url: SITE_URL,
          image: defaultOgImage,
        })}
      />
      <JsonLd
        id="jsonld-home-list"
        data={itemListJsonLd({
          id: `${SITE_URL}/#home-items`,
          name: 'ABVX primary public sections',
          items: [
            { name: 'Current Focus', url: `${SITE_URL}/focus`, type: 'CollectionPage' },
            { name: 'Systems Catalogue', url: `${SITE_URL}/systems`, type: 'CollectionPage' },
            { name: 'ABVX Press', url: `${SITE_URL}/books`, type: 'CollectionPage' },
            { name: 'Writing', url: `${SITE_URL}/writing`, type: 'CollectionPage' },
            { name: 'About / Method', url: `${SITE_URL}/about`, type: 'AboutPage' },
          ],
        })}
      />
      <HeroPoster
        eyebrow="ABVX / AI-NATIVE SYSTEMS"
        title="AI-native systems for complex markets."
        summary="I build agentic development tools and agro-commodity market infrastructure: brokerage workspaces, market-intelligence layers, commodity-index systems and validation-gated AI workflows."
      >
        <TagList tags={heroLabels} />
        <div className="hero-actions">
          <Link href="#explore-the-work">Explore the work</Link>
          <Link href="/work-with-me">Work with me</Link>
        </div>
      </HeroPoster>

      <MarqueeTicker
        items={[
          'International agro-commodity brokerage',
          'Agent-assisted market workflows',
          'Commodity indexes and monitoring',
          'AI-native development',
          'Strategic product and go-to-market',
        ]}
      />

      <section className="about-snapshot" aria-labelledby="about-snapshot-title">
        <div className="eyebrow">About snapshot</div>
        <h2 id="about-snapshot-title">Markets, data, operations and AI agents in one operating layer.</h2>
        <div className="about-snapshot__copy">
          <p>
            I build infrastructure where markets, data, operational processes,
            AI agents and strategic marketing intersect. The current center is
            international agro-commodity brokerage and trading infrastructure.
          </p>
          <p>
            The work spans brokerage workspaces, market-intelligence surfaces,
            local commodity indexes, execution workflows and AI-assisted tools
            for grain and oilseed markets.
          </p>
          <p>
            Before moving deeper into AI-native development, I spent more than
            25 years across strategic marketing, creative direction, product
            development, brand systems, go-to-market strategy and international
            business communication. That background shapes how I build now.
          </p>
        </div>
      </section>

      <section className="home-section" aria-labelledby="latest-title">
        <div className="home-section__header">
          <div className="eyebrow">Latest from ABVX</div>
          <h2 id="latest-title">Six entry points into the current work.</h2>
        </div>
        <div className="home-latest-grid">
          <HomepageLatestCard
            title={latestFocus?.title || fallbackLatest.focus.title}
            summary={latestFocus?.summary || fallbackLatest.focus.summary}
            href={latestFocus ? `/work/${latestFocus.slug}` : '/focus'}
            label="Current Focus"
            detail={formatDate(latestFocus?.publishedAt)}
            image={latestFocus?.thumbnail}
            cta="Open focus item"
          />
          <HomepageLatestCard
            title={latestSystem?.title || fallbackLatest.systems.title}
            summary={latestSystem?.summary || fallbackLatest.systems.summary}
            href={latestSystem ? `/work/${latestSystem.slug}` : '/systems'}
            label="Systems Catalogue"
            detail={formatDate(latestSystem?.publishedAt)}
            image={latestSystem?.thumbnail}
            cta="Open system"
          />
          <HomepageLatestCard
            title={latestBook?.title || fallbackLatest.books.title}
            summary={latestBook?.summary || fallbackLatest.books.summary}
            href={latestBook ? `/books/${latestBook.slug}` : '/books'}
            label="ABVX Press"
            detail={formatDate(latestBook?.publishedAt)}
            image={latestBook?.coverImage}
            cta="Open book"
          />
          <HomepageLatestCard
            title={mediumLatest?.title || fallbackLatest.medium.title}
            summary={mediumLatest?.excerpt || fallbackLatest.medium.summary}
            href={mediumLatest?.url}
            label="Medium"
            detail={formatDate(mediumLatest?.publishedAt)}
            image={mediumLatest?.coverImage ? { src: mediumLatest.coverImage, alt: mediumLatest.title } : undefined}
            cta="Read on Medium"
          />
          <HomepageLatestCard
            title={substackLatest?.title || fallbackLatest.substack.title}
            summary={substackLatest?.excerpt || fallbackLatest.substack.summary}
            href={substackLatest?.url}
            label="Substack"
            detail={formatDate(substackLatest?.publishedAt)}
            image={substackLatest?.coverImage ? { src: substackLatest.coverImage, alt: substackLatest.title } : undefined}
            cta="Read on Substack"
          />
          <HomepageLatestCard
            title={mn7rLatest?.title || fallbackLatest.mn7rBlog.title}
            summary={mn7rLatest?.excerpt || fallbackLatest.mn7rBlog.summary}
            href={mn7rLatest?.url || 'https://mn7r.com/blog'}
            label="MN7R Blog"
            detail={formatDate(mn7rLatest?.publishedAt)}
            image={mn7rLatest?.coverImage ? { src: mn7rLatest.coverImage, alt: mn7rLatest.title, role: 'rss-image', mediaRole: 'rss-image' } : undefined}
            cta="Read on MN7R"
          />
        </div>
      </section>

      <section className="home-section" id="explore-the-work" aria-labelledby="explore-title">
        <div className="home-section__header">
          <div className="eyebrow">Explore the work</div>
          <h2 id="explore-title">One index, four public doors.</h2>
        </div>
        <div className="explore-grid">
          <SectionPanel title="Current Focus" eyebrow="01" accent>
            <p>
              Agro-commodity brokerage and trading infrastructure: MN7R, Cropto,
              market intelligence, commodity indexes, benchmark layers and
              AI-assisted workflow tools for physical markets.
            </p>
            <Link className="panel-link" href="/focus">Open Focus</Link>
          </SectionPanel>
          <SectionPanel title="Systems Catalogue" eyebrow="02">
            <p>
              Agentic development systems, reusable skillpacks, orchestration
              layers, project instruction surfaces, validation workflows and
              operational web tools.
            </p>
            <Link className="panel-link" href="/systems">Open Systems</Link>
          </SectionPanel>
          <SectionPanel title="ABVX Press" eyebrow="03">
            <p>
              Books, field manuals, translations and publishing systems that
              turn operational knowledge into durable public assets.
            </p>
            <Link className="panel-link" href="/books">Open Books</Link>
          </SectionPanel>
          <SectionPanel title="Writing" eyebrow="04">
            <p>
              Field notes on AI-native work, market infrastructure, validation,
              decision-making, automation and strategic product systems.
            </p>
            <Link className="panel-link" href="/writing">Open Writing</Link>
          </SectionPanel>
        </div>
      </section>
    </div>
  );
}
