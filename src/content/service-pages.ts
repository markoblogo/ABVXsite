import type { ContentFaq } from './types';

export type ServicePage = {
  slug: string;
  eyebrow: string;
  title: string;
  shortTitle: string;
  metaTitle: string;
  summary: string;
  tags: string[];
  bestFor: string[];
  deliverables: string[];
  proofPoints: string[];
  related: Array<{ label: string; href: string; note: string }>;
  faqs: ContentFaq[];
};

export const servicePages: ServicePage[] = [
  {
    slug: 'ai-gtm-consultant',
    eyebrow: 'AI GTM / positioning',
    title: 'AI GTM consultant for complex products',
    shortTitle: 'AI GTM consultant',
    metaTitle: 'AI GTM consultant for complex products | ABVX',
    summary:
      'Positioning, launch narrative and execution systems for AI, technical and market-facing products that are hard to explain, sell or scale.',
    tags: ['AI GTM', 'positioning', 'product marketing', 'complex products', 'launch systems'],
    bestFor: [
      'AI or technical products with a strong product but a vague market story.',
      'Founders and teams preparing a launch, pilot, grant, investor deck or partner conversation.',
      'Products that need to be legible to humans, search engines and LLM agents at the same time.',
    ],
    deliverables: [
      'Buyer/job-to-be-done map, category language and positioning narrative.',
      'Landing page, deck or site structure that explains the product without buzzword fog.',
      'Evidence map: proof points, use cases, objections, risks and next-step calls to action.',
    ],
    proofPoints: [
      'Public ABVX work combines AI-native systems, publishing, market infrastructure and GTM execution.',
      'About page documents 20+ years across product, growth, brand and international business.',
      'The site exposes machine-readable indexes and structured content for search and LLM retrieval.',
    ],
    related: [
      { label: 'About Anton', href: '/about', note: 'Background and operating model.' },
      { label: 'Systems catalogue', href: '/systems', note: 'AI-native systems and execution surfaces.' },
      { label: 'LLMO / SEO Revolution', href: '/books/llmo-seo-revolution', note: 'Book on search visibility in the AI era.' },
    ],
    faqs: [
      {
        question: 'What kind of AI GTM work is this best for?',
        answer:
          'It is strongest for complex products where the technical value exists, but the buyer, category, proof and next step are not yet clear enough for a public launch or serious partnership conversation.',
      },
      {
        question: 'Is this only strategy?',
        answer:
          'No. The useful output is usually a shippable artifact: a landing page structure, positioning system, sales narrative, partner brief, deck outline or content architecture that the team can publish and test.',
      },
    ],
  },
  {
    slug: 'ai-workflow-systems',
    eyebrow: 'AI workflow systems',
    title: 'AI workflow systems for teams that need execution discipline',
    shortTitle: 'AI workflow systems',
    metaTitle: 'AI workflow systems consultant | ABVX',
    summary:
      'Agentic workflows, project instruction layers, validation gates and human review loops for teams adopting AI without losing control.',
    tags: ['AI workflows', 'agentic systems', 'Codex', 'validation gates', 'operations'],
    bestFor: [
      'Teams using AI tools heavily but lacking repeatable operating discipline.',
      'Repositories, publishing pipelines or internal workflows where mistakes become expensive.',
      'Leaders who want AI acceleration with explicit gates, evidence and handoff notes.',
    ],
    deliverables: [
      'Workflow map: intake, context, execution, validation, documentation and release proof.',
      'Agent instructions, reusable checklists, QA gates and project operating conventions.',
      'A lean first implementation that improves one recurring workflow instead of redesigning everything.',
    ],
    proofPoints: [
      'ABVX-OS and ABVX publishing workflows use gated AI production, QA and post-submission learning.',
      'Public systems include agent skills, instruction layers and machine-readable content indexes.',
      'The work emphasizes proof-first release claims rather than tool demos.',
    ],
    related: [
      { label: 'ABVX OS', href: '/work/abvx-os', note: 'Local-first control plane for personal AI work.' },
      { label: 'AGENTS.md Generator', href: '/work/agents-md-generator', note: 'Instruction surfaces for agentic repositories.' },
      { label: 'Systems catalogue', href: '/systems', note: 'Reusable AI-native systems and tools.' },
    ],
    faqs: [
      {
        question: 'What is an AI workflow system?',
        answer:
          'It is the operating layer around AI work: what context the agent receives, what it is allowed to change, how work is checked, when humans approve, and what proof is required before claiming the result is done.',
      },
      {
        question: 'Can this start small?',
        answer:
          'Yes. The best first project is usually one painful recurring workflow, such as publishing QA, proposal production, repository onboarding, research synthesis or release verification.',
      },
    ],
  },
  {
    slug: 'llmo-consultant',
    eyebrow: 'LLMO / answer-engine visibility',
    title: 'LLMO consultant for agent-ready visibility',
    shortTitle: 'LLMO consultant',
    metaTitle: 'LLMO consultant for AI search visibility | ABVX',
    summary:
      'Search and answer-engine readiness for people, products and portfolios: structured pages, machine-readable indexes, FAQ schema and citation-friendly content.',
    tags: ['LLMO', 'SEO', 'AI search', 'answer engines', 'structured data'],
    bestFor: [
      'Experts, founders and technical teams whose work exists online but is hard for AI systems to summarize accurately.',
      'Sites that have good projects or products but weak canonical pages and thin machine-readable structure.',
      'Portfolios and product catalogs that need clearer entry points for clients, recruiters or partners.',
    ],
    deliverables: [
      'Audit of current crawlable pages, titles, descriptions, structured data and internal links.',
      'Canonical page plan for core offers, products, proof points and FAQs.',
      'Implementation of JSON-LD, llms.txt, content-index.json and citation-friendly page copy where appropriate.',
    ],
    proofPoints: [
      'ABVX exposes public llms.txt, content-index.json, sitemap, schema and structured portfolio pages.',
      'The About, Work, Books and service pages are designed as human-readable and machine-readable surfaces.',
      'The site now has focused entry points for high-intent search and LLM retrieval.',
    ],
    related: [
      { label: 'LLMO overview', href: '/llmo', note: 'Public explanation of the ABVX LLMO method.' },
      { label: 'llms.txt', href: '/llms.txt', note: 'Machine-readable public site map.' },
      { label: 'Content index', href: '/content-index.json', note: 'Structured public inventory for crawlers and agents.' },
    ],
    faqs: [
      {
        question: 'Is LLMO different from SEO?',
        answer:
          'It overlaps with SEO, but the emphasis is on being accurately understood and cited by answer engines and AI agents: clear entities, canonical pages, structured data, FAQs, internal links and machine-readable indexes.',
      },
      {
        question: 'Can this help a very low-traffic site?',
        answer:
          'Yes, but it is a foundation, not a traffic switch. It makes the site easier to understand and cite; distribution, external links and useful public material are still needed for growth.',
      },
    ],
  },
  {
    slug: 'kdp-publishing-automation',
    eyebrow: 'AI publishing systems',
    title: 'KDP publishing automation and AI-assisted book production',
    shortTitle: 'KDP publishing automation',
    metaTitle: 'KDP publishing automation and AI book production | ABVX',
    summary:
      'Fast, gated nonfiction publishing systems for market discovery, source-dependent drafting, layout, QA, commercial packaging and post-publication learning.',
    tags: ['KDP', 'publishing automation', 'AI books', 'book production', 'commercial packaging'],
    bestFor: [
      'Teams or solo operators who want a repeatable nonfiction publishing pipeline rather than a one-off manuscript.',
      'Source-dependent books, visual guides, workbooks and buyer decision systems where accuracy and packaging matter.',
      'Portfolios that need market selection, production gates, layout QA and post-publication learning loops.',
    ],
    deliverables: [
      'Publishing pipeline design: radar, product gate, source ledger, draft, QA, layout, metadata and release gates.',
      'A first book experiment scoped for realistic human involvement and commercial learning.',
      'Reusable checklists for TOC, EPUB/PDF, margins, typography, pricing, metadata and Amazon preview issues.',
    ],
    proofPoints: [
      'ABVX publishing work includes PMP, ham radio, French road signs, solar proposal and other KDP experiments.',
      'The process uses product gates, factual ledgers, visual QA, KDP-safe margin checks and commercial package recalculation.',
      'Book landing cards and site integration connect the publishing pipeline back to the public portfolio.',
    ],
    related: [
      { label: 'ABVX Press', href: '/books', note: 'Public catalogue of books and publishing projects.' },
      { label: 'Book Landing', href: '/work/book-landing', note: 'Book landing system for portfolio and product pages.' },
      { label: 'Ham Radio Technician Visual Cram Map', href: '/books/ham-radio-technician-visual-cram-map-2026-2030', note: 'Example of a diagram-first KDP product.' },
    ],
    faqs: [
      {
        question: 'Does AI replace editorial judgment in this process?',
        answer:
          'No. The point is a gated system: market thesis, source hierarchy, claim ledger, factual QA, layout QA and human publishing gates where the product or risk requires them.',
      },
      {
        question: 'What kinds of books fit this model?',
        answer:
          'It fits compact nonfiction, visual guides, workbooks and practical buyer systems better than prestige literary projects or topics that require unverified subject-matter judgment.',
      },
    ],
  },
  {
    slug: 'agro-commodity-market-infrastructure',
    eyebrow: 'Agro commodity infrastructure',
    title: 'Agro-commodity market infrastructure and brokerage systems',
    shortTitle: 'Agro market infrastructure',
    metaTitle: 'Agro commodity market infrastructure consultant | ABVX',
    summary:
      'Brokerage workflows, market-intelligence surfaces, commodity-index logic and execution-layer systems for physical grain and oilseed markets.',
    tags: ['agro commodities', 'brokerage', 'market intelligence', 'commodity indexes', 'grain markets'],
    bestFor: [
      'Commodity, brokerage or agri-market teams building digital infrastructure around real physical-market workflows.',
      'Projects that need a clear distinction between trading, monitoring, benchmarks, indexes and execution systems.',
      'Grant, partner or pilot narratives where the market logic must be easy to understand.',
    ],
    deliverables: [
      'Workflow map of participants, data, execution steps, documents, signals and risk points.',
      'Product structure for brokerage workspace, monitoring surface, benchmark layer or index methodology.',
      'Commercial and partner narrative that explains why the infrastructure matters.',
    ],
    proofPoints: [
      'Public ABVX focus work includes MN7R, Cropto, SPIKE, UGA Index and commodity-market publishing projects.',
      'The current public site is organized around market infrastructure, systems and publishing layers.',
      'Experience spans international business, operations, product and strategic marketing.',
    ],
    related: [
      { label: 'Current Focus', href: '/focus', note: 'Agro-market infrastructure projects.' },
      { label: 'MN7R', href: '/work/mn7r', note: 'International agro-commodity brokerage infrastructure.' },
      { label: 'Cropto', href: '/work/cropto', note: 'Commodity-market platform work.' },
    ],
    faqs: [
      {
        question: 'Is this pure agricultural consulting?',
        answer:
          'No. The focus is market infrastructure: workflows, product systems, intelligence layers, data surfaces, commercial narratives and execution tooling around physical commodity markets.',
      },
      {
        question: 'Where does AI fit?',
        answer:
          'AI is useful when it supports a real workflow: monitoring, summarization, document handling, broker assistance, research, validation or decision support. It should not replace market logic.',
      },
    ],
  },
  {
    slug: 'product-marketing-complex-products',
    eyebrow: 'Product marketing / complex products',
    title: 'Product marketing for complex products and systems',
    shortTitle: 'Complex product marketing',
    metaTitle: 'Product marketing for complex products | ABVX',
    summary:
      'Narrative, positioning, offer design and proof architecture for products that cross technical, operational and commercial boundaries.',
    tags: ['product marketing', 'complex products', 'positioning', 'B2B', 'category design'],
    bestFor: [
      'Products that are real and useful but currently hard to explain in one page.',
      'Teams selling to multiple stakeholders with different languages, objections and proof needs.',
      'Portfolios that need to connect strategy, product, market evidence and execution artifacts.',
    ],
    deliverables: [
      'Audience map, objections, use cases, proof hierarchy and message architecture.',
      'Homepage, landing page, deck or offer structure that turns complexity into a sequence.',
      'Content and internal-link plan for buyers, partners, recruiters or grant evaluators.',
    ],
    proofPoints: [
      'ABVX combines product, growth, brand, publishing and systems work in one public portfolio.',
      'The site’s books, systems and focus sections demonstrate long-form explanation for complex domains.',
      'About page documents a cross-functional background across product, growth, brand and international business.',
    ],
    related: [
      { label: 'About Anton', href: '/about', note: 'Background and credibility.' },
      { label: 'Writing', href: '/writing', note: 'Essays and public thinking.' },
      { label: 'Books', href: '/books', note: 'Long-form explanation and commercial publishing work.' },
    ],
    faqs: [
      {
        question: 'What makes complex-product marketing different?',
        answer:
          'The challenge is not just persuasion. It is sequencing: define the buyer, explain the system, prove the value, handle risk and make the next action obvious without flattening the product into a slogan.',
      },
      {
        question: 'Can this support recruiting or consulting positioning too?',
        answer:
          'Yes. The same architecture helps a potential employer, client or partner understand what you do, why it matters and where your evidence lives.',
      },
    ],
  },
];

export function getServicePageBySlug(slug: string) {
  return servicePages.find((page) => page.slug === slug);
}
