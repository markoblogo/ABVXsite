import JsonLd from '@/components/JsonLd';
import PageHeader from '@/components/PageHeader';
import { socialLinks } from '@/content/navigation';
import { aboutPageJsonLd, defaultOgImage, metadataWithImage } from '@/lib/seo';
import type { Metadata } from 'next';
import Link from 'next/link';

const aboutDescription =
  'About Anton Biletskyi-Volokh: AI-native systems for complex markets, agro-commodity brokerage infrastructure, agentic development workflows, strategic product systems and collaboration context.';

export const metadata: Metadata = metadataWithImage({
  title: 'About / Method - AI-native systems for complex markets',
  description: aboutDescription,
  canonicalPath: '/about',
  image: defaultOgImage,
});

const buildAreas = [
  {
    title: 'Agro-commodity market infrastructure',
    text: 'Digital systems for physical commodity brokerage, trading workflows, market intelligence, local commodity indexes, liquidity layers and structured execution.',
  },
  {
    title: 'AI-native development systems',
    text: 'Agentic workflows, Codex-style development systems, reusable agent skills, project instruction layers and validation-gated workflows.',
  },
  {
    title: 'Strategic product and go-to-market systems',
    text: 'Brand architecture, product narratives, validation frameworks, launch systems, market-entry strategy and commercial storytelling for complex products.',
  },
  {
    title: 'Publishing and language infrastructure',
    text: 'Books, translation systems, reader kits, constructed-language experiments and publishing workflows that turn ideas into durable public assets.',
  },
];

const methodQuestions = [
  'What needs to be measured?',
  'What needs to be standardized?',
  'What needs to be made visible?',
  'What needs to be automated?',
  'What needs to be explained well enough that people can use it?',
  'What can AI agents help execute, verify or accelerate?',
];

const operatingLines = [
  {
    title: 'Current Focus',
    href: '/focus',
    text: 'Agro-commodity brokerage, market intelligence, commodity indexes and AI-assisted market workflows.',
  },
  {
    title: 'Systems Catalogue',
    href: '/systems',
    text: 'Agentic development tools, reusable skillpacks, project instruction layers and orchestration systems.',
  },
  {
    title: 'ABVX Press',
    href: '/books',
    text: 'Books, field manuals, translations, free editions and publishing lines.',
  },
  {
    title: 'Writing',
    href: '/writing',
    text: 'Applied AI notes, market-infrastructure thinking, validation essays and field observations.',
  },
];

const machineIndexes = [
  {
    title: 'llms.txt',
    href: '/llms.txt',
    text: 'Plain-text public index for LLM crawlers, AI agents and answer engines.',
  },
  {
    title: 'content-index.json',
    href: '/content-index.json',
    text: 'Structured JSON inventory of public ABVX work, books, systems, links and relations.',
  },
];

const bestFitWork = [
  'AI-native product development',
  'agro-commodity market infrastructure',
  'international brokerage and trading workflows',
  'B2B/B2C strategic marketing',
  'market intelligence and operational dashboards',
  'agentic development workflows',
  'go-to-market systems for complex products',
  'publishing and knowledge-product infrastructure',
];

const currentProjectLinks = [
  { label: 'MN7R', href: '/work/mn7r' },
  { label: 'Cropto', href: '/work/cropto' },
  { label: 'Cropto Monitor', href: '/work/cropto-monitor' },
  { label: '1D3X', href: '/work/1d3x' },
  { label: 'SPIKE', href: '/work/spike-spot-commodity-index-ukraine' },
  { label: 'UGA Index', href: '/work/uga-index' },
  { label: 'Liqua', href: '/work/liqua' },
  { label: 'ABVX Agent Skills', href: '/work/abvx-agent-skills' },
  { label: 'AGENTS.md Generator', href: '/work/agents-md-generator' },
  { label: 'SET', href: '/work/set' },
  { label: 'Decision Map', href: '/work/decision-map' },
  { label: 'ABVX Lab', href: '/work/abvx-lab' },
];

function socialHref(label: string) {
  return socialLinks.find((item) => item.label === label)?.href;
}

export default function AboutPage() {
  const linkedIn = socialHref('LinkedIn');
  const email = socialHref('Email');

  return (
    <div className="route-about about-page grid gap-8">
      <JsonLd id="jsonld-about-page" data={aboutPageJsonLd()} />
      <PageHeader
        eyebrow="About / Method"
        title="AI-native systems for complex markets."
        summary="I build agentic development tools and agro-commodity market infrastructure."
      />

      <section className="about-intro" aria-labelledby="about-positioning-title">
        <div>
          <div className="eyebrow">Positioning</div>
          <h2 id="about-positioning-title">Markets need operating systems.</h2>
        </div>
        <div className="about-intro__copy">
          <p>
            I build AI-native operating systems, market infrastructure and strategic
            workflows for complex B2B and B2C environments.
          </p>
          <p>
            My current focus is international agro-commodity brokerage and trading
            infrastructure: digital workspaces, market-intelligence layers,
            commodity-index systems, execution workflows and AI-assisted tools for
            grain and oilseed markets.
          </p>
          <p>
            Before moving deeper into AI-native development, I spent more than 25
            years working across strategic marketing, creative direction, product
            development, brand systems, go-to-market strategy and international
            business communication. That background shapes how I build now.
          </p>
          <p>
            I do not treat software as isolated apps. I treat it as operational
            infrastructure: systems that help people see markets more clearly,
            coordinate work, validate decisions, package expertise and move from
            strategy to execution.
          </p>
          <p>
            ABVX is the working surface for this approach. It brings together
            agro-market infrastructure, AI-agent workflows, developer tools,
            publishing systems, language experiments and strategic content into
            one public ecosystem.
          </p>
        </div>
      </section>

      <section className="about-signal-grid" aria-label="Current relevance">
        <article>
          <span>Current center</span>
          <strong>International agro-commodity brokerage infrastructure</strong>
        </article>
        <article>
          <span>AI layer</span>
          <strong>Agent-assisted workflows, validation gates and operating discipline</strong>
        </article>
        <article>
          <span>Business layer</span>
          <strong>Strategic marketing, product systems and go-to-market execution</strong>
        </article>
      </section>

      <section className="about-section" aria-labelledby="about-build-title">
        <div className="about-section__header">
          <div className="eyebrow">What I build</div>
          <h2 id="about-build-title">Four operating lines.</h2>
        </div>
        <div className="about-card-grid">
          {buildAreas.map((item, index) => (
            <article className="about-card" key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <div className="about-project-strip" aria-label="Current projects">
          {currentProjectLinks.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </div>
      </section>

      <section className="about-method" aria-labelledby="about-method-title">
        <div className="about-method__statement">
          <div className="eyebrow">How I work</div>
          <h2 id="about-method-title">I usually start with the system, not the surface.</h2>
          <p>
            Before designing a site, writing a deck, building a tool or shaping a
            launch, I look for the operating structure underneath. The final output
            can be a product, dashboard, protocol, agent workflow, website, book,
            index, pitch deck, market interface or launch system. The method stays
            the same: turn messy expertise into usable infrastructure.
          </p>
        </div>
        <ol className="about-method__questions">
          {methodQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </section>

      <section className="about-section" aria-labelledby="about-lines-title">
        <div className="about-section__header">
          <div className="eyebrow">Current operating lines</div>
          <h2 id="about-lines-title">Where the work lives now.</h2>
        </div>
        <div className="about-line-grid">
          {operatingLines.map((item) => (
            <Link className="about-line-card" href={item.href} key={item.href}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <span>Open -&gt;</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="about-section" aria-labelledby="about-machine-title">
        <div className="about-section__header">
          <div className="eyebrow">Machine-readable index</div>
          <h2 id="about-machine-title">Public data for crawlers and agents.</h2>
        </div>
        <div className="about-line-grid about-line-grid--machine">
          {machineIndexes.map((item) => (
            <Link className="about-line-card" href={item.href} key={item.href}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <span>Open -&gt;</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="about-work" aria-labelledby="about-work-title">
        <div className="about-work__copy">
          <div className="eyebrow">Work with me</div>
          <h2 id="about-work-title">Work with me</h2>
          <p>
            I am open to consulting, partnerships, grant-backed projects and
            selected full-time or fractional roles where the work involves complex
            systems, market infrastructure, product strategy, AI-native workflows,
            publishing systems or go-to-market.
          </p>
          <p>
            Best fit: teams building something complex, technical, market-facing
            and not yet fully structured.
          </p>
          <div className="link-strip">
            <a href={email || '/about'}>Contact</a>
            {linkedIn ? (
              <a href={linkedIn} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            ) : null}
            {email ? <a href={email}>Email</a> : null}
          </div>
        </div>
        <div className="about-work__fit">
          <h3>Best-fit work</h3>
          <ul>
            {bestFitWork.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {linkedIn ? (
        <section className="about-career-note" aria-label="Career timeline">
          <p>For the full career timeline, see LinkedIn.</p>
          <a href={linkedIn} target="_blank" rel="noopener noreferrer">
            LinkedIn profile -&gt;
          </a>
        </section>
      ) : null}
    </div>
  );
}
