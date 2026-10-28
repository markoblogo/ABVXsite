// Shared rendered catalogue configuration: pages and publication preflight use
// the same group and series membership instead of duplicating placement rules.
/** @param {{primarySeriesSlug?:string,seriesSlugs?:string[]}} book @param {string[]} displayedSeries */
export function isStandaloneCatalogueBook(book,displayedSeries) {
 return !book.primarySeriesSlug&&!displayedSeries.some(slug=>book.seriesSlugs?.includes(slug));
}
/** @type {Array<{title:string,description:string,groups:Array<{title:string,description?:string,slugs:string[]}>}>} */
export const systemsEcosystems = [
  {
    title: 'Agro Market Infrastructure Systems',
    description: 'Trading, monitoring and market infrastructure systems for physical agro-commodity operations.',
    groups: [
      {
        title: 'Trading & Brokerage Platforms',
        slugs: ['cropto', 'mn7r'],
      },
      {
        title: 'Monitoring & Intelligence',
        slugs: ['cropto-monitor', 'last30days-cropto', '1d3x', 'spike-spot-commodity-index-ukraine', 'uga-index'],
      },
      {
        title: 'Market Fronts & Landings',
        slugs: ['ami', 'ami-books-physical-commodity-markets', 'liqua', 'trade-solution-eu', 'cropto-market-risk-deck'],
      },
    ],
  },
  {
    title: 'Publishing & Language Systems',
    description: 'Publishing companion systems, translation tools and experimental language infrastructure.',
    groups: [
      {
        title: 'Publishing Companion Sites',
        slugs: [
          'chinese-wisdom-toki-pona-landing',
          'stoic-wisdom-toki-pona-landing',
          'ukrainian-modernism-landing',
          'toki-pona-free-kits-landing',
          'pictiq-landing',
        ],
      },
      {
        title: 'Language Tools, Protocols & Experiments',
        slugs: ['toki-pona-ai-translator', 'sitelen-layer-plugin', 'pictiq', 'sitelen-emoji-truth'],
      },
    ],
  },
  {
    title: 'AI-native Development Systems',
    description: 'AI-native workflows, orchestration systems, reusable agent skillpacks, project instruction layers, development protocols and operational tooling.',
    groups: [
      {
        title: 'Workflow & Orchestration',
        description:
          'Operational systems for AI-assisted development: orchestration layers, project instruction surfaces and reusable agent skillpacks that turn messy project work into structured, reviewable execution. This layer is where ABVX experiments with AI-native operating discipline: not just prompting models, but defining how agents receive context, choose workflows, verify results, hand off work and avoid unsafe or wasteful actions.',
        slugs: ['set', 'agents-md-generator', 'abvx-agent-skills'],
      },
      {
        title: 'Development Surfaces & Interfaces',
        description:
          'Development surfaces, interfaces and operational environments for AI-native workflows, publishing and programmable systems.',
        slugs: ['abvx-lab', 'ascii-theme', 'llmo-site'],
      },
      {
        title: 'Protocols & Decision Systems',
        description:
          'Protocols, decision systems and structured operational interfaces for AI-native coordination, reasoning and development communication.',
        slugs: ['id', 'decision-map', 'git-tweet'],
      },
    ],
  },
  {
    title: 'Standalone Utilities & Experiments',
    description: 'Independent utilities, interfaces and small software experiments outside the main ecosystems.',
    groups: [
      {
        title: 'Commercial Sites & Interfaces',
        description:
          'Commercial presentation surfaces, booking-oriented interfaces and lightweight operational web systems outside the main ecosystem clusters.',
        slugs: ['blue-jay-vodka', 'azurmenton', 'tdm-enduro-tours'],
      },
      {
        title: 'Standalone Utilities',
        slugs: ['ytmamp', 'abvx-shortener'],
      },
    ],
  },
];

export const officialSeriesSlugs = [
  'modernisme-ukrainien',
  'chinese-wisdom-toki-pona',
  'stoic-wisdom-toki-pona',
  'toki-pona-free-kits',
  'mn7r-commodity-brokerage-library',
  'good-dogs-of-the-apocalypse',
];

export const bookStandaloneGroups = [
  {
    title: 'Business, AI & Marketing',
    description: 'Independent strategy, marketing, productivity and AI books outside the formal publishing series.',
    editorialSlugs: ['business-ai-marketing'],
  },
  {
    title: 'Language, AI & Toki Pona',
    description: 'Standalone books where language systems, Toki Pona and AI-native thinking become the main subject.',
    editorialSlugs: ['language-ai-toki-pona'],
  },
  {
    title: 'Practical Guides & Reference',
    description: 'Applied guides, visual references and decision tools for practical real-world situations.',
    editorialSlugs: ['practical-guides-reference-en', 'practical-guides-reference-uk'],
  },
  {
    title: 'Fiction',
    description: 'Original fiction and translations outside the non-fiction and classical translation lines.',
    editorialSlugs: ['fiction'],
  },
];

/** @type {Array<{title:string,description:string,slugs:string[],variant:"primary"|"standard"}>} */
export const focusGroups = [
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
    slugs: ['cropto-monitor', 'mn7r-blog', 'last30days-cropto', '1d3x', 'spike-spot-commodity-index-ukraine', 'uga-index'],
    variant: 'standard',
  },
  {
    title: 'Market Fronts & Partner Landings',
    description:
      'Market-facing landing pages, decks and commercial fronts for commodity infrastructure projects, partner ventures and trading-service concepts.',
    slugs: ['ami-books-physical-commodity-markets', 'trade-solution-eu', 'cropto-market-risk-deck', 'liqua'],
    variant: 'standard',
  },
];
