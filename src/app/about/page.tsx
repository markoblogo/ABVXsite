import JsonLd from '@/components/JsonLd';
import PageHeader from '@/components/PageHeader';
import { socialLinks } from '@/content/navigation';
import { aboutPageJsonLd, defaultOgImage, metadataWithImage } from '@/lib/seo';
import type { Metadata } from 'next';
import Link from 'next/link';

const aboutDescription =
  'About Anton Biletskyi-Volokh, ABVX, working method, operating lines and collaboration context.';

export const metadata: Metadata = metadataWithImage({
  title: 'About / Method',
  description: aboutDescription,
  canonicalPath: '/about',
  image: defaultOgImage,
});

const buildAreas = [
  {
    title: 'Market infrastructure',
    text: 'Standards, indexes, trading workflows, brokerage interfaces and commodity-market systems.',
  },
  {
    title: 'AI-native systems',
    text: 'Agentic workflows, AI-assisted development, automation, visibility systems and practical tools.',
  },
  {
    title: 'Products and go-to-market',
    text: 'Brands, product concepts, validation systems, launches, narratives and market entry.',
  },
  {
    title: 'Language and publishing',
    text: 'Constructed-language experiments, translations, books, reader kits and publishing infrastructure.',
  },
];

const methodQuestions = [
  'What needs to be measured?',
  'What needs to be standardized?',
  'What needs to be made visible?',
  'What needs to be automated?',
  'What needs to be explained well enough that people can use it?',
];

const operatingLines = [
  {
    title: 'Current Focus',
    href: '/focus',
    text: 'Agro-commodity trading infrastructure.',
  },
  {
    title: 'Systems Catalogue',
    href: '/systems',
    text: 'Web services, AI/dev tools, protocols, dashboards, landing systems and language experiments.',
  },
  {
    title: 'ABVX Press',
    href: '/books',
    text: 'Books, translations, free kits and publishing projects.',
  },
  {
    title: 'Writing',
    href: '/writing',
    text: 'Applied AI notes, validation essays, agent workflows and field observations.',
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
  'building or validating a new product/system',
  'turning messy expertise into usable infrastructure',
  'developing AI-assisted workflows',
  'designing market-facing tools, standards or narratives',
  'launching niche publishing or knowledge products',
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
        title="Not a CV. A working method."
        summary="I build systems that turn strategy, markets, AI workflows, language and publishing into usable public work."
      />

      <section className="about-intro" aria-labelledby="about-positioning-title">
        <div>
          <div className="eyebrow">Positioning</div>
          <h2 id="about-positioning-title">ABVX is the work surface.</h2>
        </div>
        <div className="about-intro__copy">
          <p>
            I design and build complex systems that connect strategy, markets,
            technology, language and AI.
          </p>
          <p>
            For more than 25 years, I have worked across strategic marketing,
            creative direction, product development and go-to-market: creating
            brands, products, technologies and launch systems for companies,
            partners and my own ventures.
          </p>
          <p>
            ABVX is not my CV. It is a working index of recent projects, tools,
            books, experiments and writing.
          </p>
          <p>
            My current business focus is digital infrastructure for agro-commodity
            trading and brokerage. The broader pattern is more important: I build
            systems that make complex work usable, visible, measurable and easier
            to act on.
          </p>
          <p>
            That can become a product, a protocol, a dashboard, a standard, an
            index, a book, a language experiment, a website, an AI workflow or a
            launch system.
          </p>
        </div>
      </section>

      <section className="about-section" aria-labelledby="about-build-title">
        <div className="about-section__header">
          <div className="eyebrow">What I build</div>
          <h2 id="about-build-title">Work that becomes infrastructure.</h2>
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
      </section>

      <section className="about-method" aria-labelledby="about-method-title">
        <div className="about-method__statement">
          <div className="eyebrow">How I work</div>
          <h2 id="about-method-title">I usually start with the system, not the surface.</h2>
          <p>
            The output can be a product, a protocol, a market interface, a book,
            a website, an AI workflow or a launch system.
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
            I am open to consulting, partnerships and selected full-time roles
            where the work involves complex systems, market infrastructure,
            product strategy, AI-native workflows, publishing systems or
            go-to-market.
          </p>
          <div className="link-strip">
            <a href={email || '/about'}>Contact</a>
            {linkedIn ? (
              <a href={linkedIn} target="_blank" rel="noreferrer">
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
          <a href={linkedIn} target="_blank" rel="noreferrer">
            LinkedIn profile -&gt;
          </a>
        </section>
      ) : null}
    </div>
  );
}
