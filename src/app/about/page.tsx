import FAQSection from '@/components/FAQSection';
import JsonLd from '@/components/JsonLd';
import PageHeader from '@/components/PageHeader';
import type { ContentFaq } from '@/content';
import { socialLinks } from '@/content/navigation';
import { aboutPageJsonLd, defaultOgImage, faqPageJsonLd, metadataWithImage, SITE_URL } from '@/lib/seo';
import type { Metadata } from 'next';
import Link from 'next/link';

const aboutDescription =
  'About Anton Biletskyi-Volokh: product, growth and AI-native systems leader with 20+ years across technology, international GTM, brand, market infrastructure and publishing.';

export const metadata: Metadata = metadataWithImage({
  title: 'About Anton - Product, growth and AI-native systems',
  description: aboutDescription,
  canonicalPath: '/about',
  image: defaultOgImage,
});

const proofPoints = [
  { label: 'Experience', value: '20+ years across product, growth, brand and international business' },
  { label: 'Technology work', value: '30+ technology and startup projects across AI, Web3 and digital products' },
  { label: 'Brand building', value: '20+ consumer and hospitality brands created' },
  { label: 'Operations', value: '50+ hospitality venues managed or co-owned' },
  { label: 'Location', value: 'France-based, remote / hybrid, EU work authorization' },
  { label: 'Languages', value: 'Ukrainian, Russian, English and improving French' },
];

const aboutFaqs: ContentFaq[] = [
  {
    question: 'What kind of work is Anton Biletskyi-Volokh best suited for?',
    answer:
      'Anton is best suited for product, GTM, growth, AI-native workflow and market-infrastructure work where the product is complex, the market needs clearer framing, and strategy must become executable systems.',
  },
  {
    question: 'What is the practical experience behind ABVX?',
    answer:
      'The public ABVX work builds on 20+ years across strategic marketing, product, brand, international business and operations, including 30+ technology and startup projects, 20+ consumer and hospitality brands, and 50+ managed or co-owned venues.',
  },
  {
    question: 'Is ABVX a portfolio, a company or a publishing system?',
    answer:
      'ABVX is Anton’s public working index: part portfolio, part systems catalogue, part publishing surface and part proof layer for current work in AI-native systems, market infrastructure, books and applied strategy.',
  },
  {
    question: 'How should a potential employer or client read this site?',
    answer:
      'Start with About for the professional frame, Focus for agro-commodity and market-infrastructure work, Systems for AI-native operating tools, Books for publishing and knowledge-product experiments, and Writing for applied AI and validation thinking.',
  },
];

const buildAreas = [
  {
    title: 'Product, GTM and growth systems',
    text: 'Positioning, market-entry logic, launch systems, sales enablement and growth work for products that need a clearer path from idea to revenue.',
  },
  {
    title: 'AI-native operating workflows',
    text: 'Agentic development systems, validation gates, reusable skills and disciplined AI-assisted production workflows for complex knowledge work.',
  },
  {
    title: 'Market infrastructure and data products',
    text: 'Digital systems for brokerage, market intelligence, commodity indexes, monitoring, execution coordination and decision support.',
  },
  {
    title: 'Brand, content and publishing machines',
    text: 'Brand architecture, editorial systems, books, landing pages and public knowledge products that package complex expertise into usable assets.',
  },
];

const methodQuestions = [
  'Clarify the market, user, buyer and decision context.',
  'Turn the product into a simple, testable proposition.',
  'Build the operating system: workflows, content, data, tools and feedback loops.',
  'Use AI agents where they improve speed, validation or throughput.',
  'Make the result legible enough that customers, partners and teams can act on it.',
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
  'Head of Product Marketing / GTM',
  'CMO / Head of Growth for early-stage or international products',
  'AI-native product and workflow development',
  'Market infrastructure, data products and operational dashboards',
  'B2B/B2C strategic marketing and category creation',
  'Go-to-market systems for complex technical products',
  'Publishing, knowledge-product and content systems',
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
      <JsonLd id="jsonld-about-faq" data={faqPageJsonLd({ id: `${SITE_URL}/about#faq`, faqs: aboutFaqs })} />
      <PageHeader
        eyebrow="About"
        title="Product and growth systems for complex markets."
        summary="I help turn complex products, markets and bodies of knowledge into clear propositions, useful systems and executable growth paths."
      />

      <section className="about-intro" aria-labelledby="about-positioning-title">
        <div>
          <div className="eyebrow">Positioning</div>
          <h2 id="about-positioning-title">Between product, market and system.</h2>
        </div>
        <div className="about-intro__copy">
          <p>
            I am a senior product, marketing and growth operator with 20+ years of
            experience across technology, consumer products, hospitality and
            international business.
          </p>
          <p>
            My strongest work is in environments where the product is promising but
            not yet easy to explain, sell, operate or scale: new categories,
            international launches, complex B2B systems, AI products, market-data
            tools, publishing systems and businesses that need sharper positioning.
          </p>
          <p>
            I have worked with 30+ technology and startup projects, created 20+
            consumer and hospitality brands, and managed or co-owned 50+ venues.
            That mix matters: I think in product, brand, customer behavior,
            operations and commercial execution at the same time.
          </p>
          <p>
            ABVX is my public working index. It shows the current shape of the
            work: agro-commodity market infrastructure, AI-agent workflows,
            strategic product systems, books, language experiments and public
            writing on applied AI and validation.
          </p>
        </div>
      </section>

      <section className="about-signal-grid" aria-label="Current relevance">
        {proofPoints.slice(0, 3).map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="about-proof" aria-label="Professional proof points">
        {proofPoints.slice(3).map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <p>{item.value}</p>
          </article>
        ))}
      </section>

      <section className="about-section" aria-labelledby="about-build-title">
        <div className="about-section__header">
          <div className="eyebrow">What I do</div>
          <h2 id="about-build-title">Useful when things are not yet obvious.</h2>
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
          <h2 id="about-method-title">Strategy has to become something people can use.</h2>
          <p>
            I usually start by finding the structure under the mess: what the buyer
            is trying to decide, what the market does not yet understand, what the
            team keeps repeating manually, and what proof is needed before the next
            bet. The output can be a GTM plan, product narrative, dashboard, agent
            workflow, launch system, book, website or operating process.
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

      <FAQSection
        id="about-faq-title"
        eyebrow="For employers and clients"
        title="How to read this site."
        faqs={aboutFaqs}
      />

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
            I am open to consulting, partnerships and selected full-time or
            fractional roles where product, market and execution are tightly linked.
            Good fits include Head of Product Marketing, GTM, CMO/Head of Growth,
            AI-native product work, market infrastructure and complex B2B/B2C
            launches.
          </p>
          <p>
            Best fit: teams building something complex, technical or market-facing
            where the product needs a sharper proposition, a working growth system,
            or a clearer operational layer.
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
          <p>
            Education includes the University of Oxford Saïd Business School
            programme in AI and Digital Transformation in Government, Kyiv National
            University of Culture and Arts, and Bridgestone Corporate University.
            For the full career timeline, see LinkedIn.
          </p>
          <a href={linkedIn} target="_blank" rel="noopener noreferrer">
            LinkedIn profile -&gt;
          </a>
        </section>
      ) : null}
    </div>
  );
}
