import HeroPoster from '@/components/HeroPoster';
import LatestCard from '@/components/LatestCard';
import MarqueeTicker from '@/components/MarqueeTicker';
import SectionPanel from '@/components/SectionPanel';
import TagList from '@/components/TagList';
import { getLatestArtifact, getLatestBook } from '@/content';
import { fetchMediumFeed, fetchSubstackFeed, type FeedItem } from '@/lib/feeds';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ABVX',
  description:
    'ABVX is the working index of Anton Biletskiy-Volokh: strategy, AI-native development, market infrastructure, web services, language experiments, books and essays.',
  alternates: { canonical: 'https://abvx.xyz' },
};

export const revalidate = 900;

const heroLabels = [
  'MARKET INFRASTRUCTURE',
  'AI SYSTEMS',
  'WEB SERVICES',
  'LANGUAGE EXPERIMENTS',
  'BOOKS',
  'ESSAYS',
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
};

async function safeLatestFeed(
  source: 'medium' | 'substack',
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
  const [mediumLatest, substackLatest] = await Promise.all([
    safeLatestFeed('medium', fetchMediumFeed, 'https://abvcreative.medium.com/feed'),
    safeLatestFeed('substack', fetchSubstackFeed, 'https://abvx.substack.com/feed'),
  ]);

  const latestFocus = getLatestArtifact('focus');
  const latestSystem = getLatestArtifact('systems');
  const latestBook = getLatestBook();

  return (
    <div className="home-redesign">
      <HeroPoster
        eyebrow="ABVX / WORKING INDEX"
        title="Systems that survive contact with reality."
        summary="ABVX is the working index of Anton Biletskiy-Volokh: strategy, AI-native development, market infrastructure, web services, language experiments, books and essays."
      >
        <TagList tags={heroLabels} />
        <div className="hero-actions">
          <Link href="#explore-the-work">Explore the work</Link>
          <Link href="/writing">Read latest writing</Link>
        </div>
      </HeroPoster>

      <MarqueeTicker
        items={[
          'Market infrastructure',
          'AI-native development',
          'Web services and protocols',
          'Constructed-language experiments',
          'Books and essays',
        ]}
      />

      <section className="about-snapshot" aria-labelledby="about-snapshot-title">
        <div className="eyebrow">About snapshot</div>
        <h2 id="about-snapshot-title">LinkedIn has the timeline. This site has the work.</h2>
        <div className="about-snapshot__copy">
          <p>
            For more than 25 years, I have worked across strategic marketing,
            creative direction, product development and go-to-market, building
            brands, products, technologies and launch systems for companies,
            partners and my own ventures.
          </p>
          <p>
            Today I combine that background with AI-native workflows and agentic
            development to build practical systems: market infrastructure, web
            services, protocols, language experiments and publishing projects.
          </p>
          <p>
            My current business focus is digital infrastructure for agro-commodity
            trading and brokerage. My broader work spans applied AI, systems
            design, constructed languages, books, translations and long-form
            writing.
          </p>
        </div>
      </section>

      <section className="home-section" aria-labelledby="latest-title">
        <div className="home-section__header">
          <div className="eyebrow">Latest from ABVX</div>
          <h2 id="latest-title">Five entry points into the current work.</h2>
        </div>
        <div className="home-latest-grid">
          <LatestCard
            title={latestFocus?.title || fallbackLatest.focus.title}
            summary={latestFocus?.summary || fallbackLatest.focus.summary}
            href="/focus"
            meta="Current Focus"
            image={latestFocus?.thumbnail}
            variant="project"
          />
          <LatestCard
            title={latestSystem?.title || fallbackLatest.systems.title}
            summary={latestSystem?.summary || fallbackLatest.systems.summary}
            href="/systems"
            meta="Systems Catalogue"
            image={latestSystem?.thumbnail}
            variant="project"
          />
          <LatestCard
            title={latestBook?.title || fallbackLatest.books.title}
            summary={latestBook?.summary || fallbackLatest.books.summary}
            href="/books"
            meta="ABVX Press"
            image={latestBook?.coverImage}
            variant="book"
          />
          <LatestCard
            title={mediumLatest?.title || fallbackLatest.medium.title}
            summary={mediumLatest?.excerpt || fallbackLatest.medium.summary}
            href={mediumLatest?.url}
            meta={`Medium${formatDate(mediumLatest?.publishedAt) ? ` / ${formatDate(mediumLatest?.publishedAt)}` : ''}`}
            image={mediumLatest?.coverImage ? { src: mediumLatest.coverImage, alt: mediumLatest.title } : undefined}
            variant="writing"
          />
          <LatestCard
            title={substackLatest?.title || fallbackLatest.substack.title}
            summary={substackLatest?.excerpt || fallbackLatest.substack.summary}
            href={substackLatest?.url}
            meta={`Substack${formatDate(substackLatest?.publishedAt) ? ` / ${formatDate(substackLatest?.publishedAt)}` : ''}`}
            image={substackLatest?.coverImage ? { src: substackLatest.coverImage, alt: substackLatest.title } : undefined}
            variant="writing"
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
              Agro-commodity trading infrastructure, brokerage workflows, market
              interfaces, indexes, standards and AI-assisted tools for physical
              commodity markets.
            </p>
            <Link className="panel-link" href="/focus">Open Focus</Link>
          </SectionPanel>
          <SectionPanel title="Systems Catalogue" eyebrow="02">
            <p>
              Web services, agentic development experiments, protocols, AI/dev
              utilities, language systems and technical companions for products,
              books and market infrastructure.
            </p>
            <Link className="panel-link" href="/systems">Open Systems</Link>
          </SectionPanel>
          <SectionPanel title="ABVX Press" eyebrow="03">
            <p>
              Books, translations, series and publishing projects across AI,
              strategy, language, culture, markets and systems thinking.
            </p>
            <Link className="panel-link" href="/books">Open Books</Link>
          </SectionPanel>
          <SectionPanel title="Writing" eyebrow="04">
            <p>
              Applied AI reviews, research breakdowns, build logs and essays on
              validation, decision-making, automation and AI-native work.
            </p>
            <Link className="panel-link" href="/writing">Open Writing</Link>
          </SectionPanel>
        </div>
      </section>
    </div>
  );
}
