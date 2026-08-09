export type AmiLocale = 'en' | 'fr';

type ProductCard = {
  id: string;
  name: string;
  role: string;
  summary: string;
  href: string;
  image: string;
  imageAlt: string;
  proofLabel: string;
};

type CollaborationPath = {
  id: string;
  title: string;
  audience: string[];
  summary: string;
};

type Layer = {
  name: string;
  detail: string;
  links: string[];
};

type AmiCopy = {
  locale: AmiLocale;
  path: string;
  alternatePath: string;
  languageLabel: string;
  alternateLabel: string;
  title: string;
  description: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSummary: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  sectionLabels: {
    ecosystem: string;
    products: string;
    cortex: string;
    built: string;
    knowledge: string;
    workWithAmi: string;
    contact: string;
  };
  ecosystemIntro: string;
  ecosystemLayers: Layer[];
  productsIntro: string;
  cortexTitle: string;
  cortexSummary: string;
  cortexBullets: string[];
  builtTitle: string;
  builtSummary: string;
  builtProofs: string[];
  knowledgeTitle: string;
  knowledgeSummary: string;
  knowledgeBullets: string[];
  workWithAmiTitle: string;
  workWithAmiSummary: string;
  collaborationPaths: CollaborationPath[];
  contactTitle: string;
  contactSummary: string;
  contactBullets: string[];
  footerNote: string;
};

export const amiProducts: ProductCard[] = [
  {
    id: 'mn7r',
    name: 'MN7R',
    role: 'Brokerage operations',
    summary: 'Private operating workspace for commodity brokerage teams across Deals, Clients, EXE, and controlled execution visibility.',
    href: 'https://mn7r.com/',
    image: '/media/work/mn7r/hero.png',
    imageAlt: 'MN7R brokerage workspace interface',
    proofLabel: 'Public site + working private workflow layer',
  },
  {
    id: 'cropto-monitor',
    name: 'Cropto Monitor',
    role: 'Market intelligence',
    summary: 'Configurable commodity-signals terminal combining market data, logistics, weather, policy, freight, and operational context.',
    href: 'https://abvx.xyz/work/cropto-monitor',
    image: '/media/work/cropto-monitor/hero.webp',
    imageAlt: 'Cropto Monitor commodity signals dashboard',
    proofLabel: 'Operational monitoring surface',
  },
  {
    id: 'spike',
    name: 'SPIKE SPOT INDEX',
    role: 'Benchmark layer',
    summary: 'Public Ukrainian spot benchmark infrastructure for grain and oilseed reference pricing, snapshots, and market visibility.',
    href: 'https://spike.1d3x.com/en',
    image: '/media/work/spike-spot-commodity-index-ukraine/hero.webp',
    imageAlt: 'SPIKE spot benchmark interface',
    proofLabel: 'Live public benchmark product',
  },
  {
    id: 'uga',
    name: 'UGA Index',
    role: 'Institutional index product',
    summary: 'Benchmark platform for daily Ukrainian grain and oilseed export price references developed with the Ukrainian Grain Association.',
    href: 'https://uga.1d3x.com/',
    image: '/media/work/uga-index/hero.webp',
    imageAlt: 'UGA Index benchmark dashboard',
    proofLabel: 'Live public partner-facing index surface',
  },
  {
    id: '1d3x',
    name: '1D3X',
    role: 'Index infrastructure',
    summary: 'Reusable launch platform for local commodity benchmarks: methodology, respondent workflows, calculation, publishing, and distribution.',
    href: 'https://1d3x.com/',
    image: '/media/work/1d3x/hero.webp',
    imageAlt: '1D3X index infrastructure landing',
    proofLabel: 'Live infrastructure front door',
  },
  {
    id: 'liqua',
    name: 'Liqua',
    role: 'Liquidity and execution layer',
    summary: 'Structured market-liquidity and execution environment designed to turn fragmented brokerage activity into scalable infrastructure.',
    href: 'https://liqua.cr0pto.com/',
    image: '/media/work/liqua/hero.webp',
    imageAlt: 'Liqua market-infrastructure landing page',
    proofLabel: 'Partner-facing commercial front',
  },
];

export const amiCopy: Record<AmiLocale, AmiCopy> = {
  en: {
    locale: 'en',
    path: '/ami',
    alternatePath: '/fr/ami',
    languageLabel: 'English',
    alternateLabel: 'Français',
    title: 'AMI — Agro Market Infrastructure',
    description:
      'AMI is the public front door to a connected agro-commodity infrastructure ecosystem: brokerage operations, market intelligence, benchmark layers, trading tools, and a bounded AI knowledge layer for physical commodity markets.',
    heroEyebrow: 'Agro Market Infrastructure',
    heroTitle: 'Digital infrastructure for physical commodity markets.',
    heroSummary:
      'Brokerage operations, market intelligence, benchmark layers, trading tools, and AI-assisted knowledge workflows — built as one connected ecosystem of working systems rather than isolated product sites.',
    heroPrimaryCta: 'Explore the ecosystem',
    heroSecondaryCta: 'Discuss a project / Work together',
    sectionLabels: {
      ecosystem: 'The ecosystem',
      products: 'Products & infrastructure',
      cortex: 'Cortex AI layer',
      built: 'Built, not proposed',
      knowledge: 'Knowledge & open infrastructure',
      workWithAmi: 'Work with AMI',
      contact: 'Contact',
    },
    ecosystemIntro:
      'AMI does not present one monolithic platform. It presents a market-infrastructure stack: execution workflows, benchmark products, monitoring surfaces, market-facing commercial fronts, and a bounded AI knowledge layer around physical commodity markets.',
    ecosystemLayers: [
      {
        name: 'Brokerage operations',
        detail: 'Execution discipline, counterparty context, post-trade control, and role-based workflow visibility.',
        links: ['MN7R'],
      },
      {
        name: 'Market intelligence',
        detail: 'Operational monitoring for prices, logistics, weather, policy, freight, and changing market conditions.',
        links: ['Cropto Monitor'],
      },
      {
        name: 'Benchmarks & indices',
        detail: 'Reference-price infrastructure for fragmented spot markets and repeatable local benchmark launches.',
        links: ['SPIKE SPOT INDEX', 'UGA Index', '1D3X'],
      },
      {
        name: 'Trading & market-front layers',
        detail: 'Commercial and product surfaces that translate infrastructure into concrete trading, liquidity, and partner narratives.',
        links: ['Cropto', 'Liqua'],
      },
      {
        name: 'AI / knowledge layer',
        detail: 'Bounded context, retrieval, and research support across the infrastructure stack without pretending that AI replaces market judgment.',
        links: ['Cortex'],
      },
    ],
    productsIntro:
      'The ecosystem already includes working public products, partner-facing surfaces, and operational systems. AMI exists to show how they reinforce each other.',
    cortexTitle: 'Cortex is the horizontal knowledge layer.',
    cortexSummary:
      'Cortex is not presented as a separate AI startup product. It is the bounded knowledge and retrieval layer used to support context, research, project memory, and agent-assisted workflows across the commodity infrastructure stack.',
    cortexBullets: [
      'bounded context and retrieval support',
      'market and project memory',
      'research support for operator workflows',
      'governed AI assistance across infrastructure surfaces',
    ],
    builtTitle: 'Working systems, public proof, real infrastructure.',
    builtSummary:
      'AMI is built around deployed products, public benchmark pages, partner-ready landings, documented methodology, and operational tooling. It is not a concept portfolio and does not depend on invented traction claims.',
    builtProofs: [
      'live public benchmark surfaces on 1D3X, SPIKE, and UGA Index',
      'working partner-facing commercial infrastructure surfaces such as Liqua',
      'public proof pages and ecosystem catalogue on ABVX',
      'operational brokerage workflow evidence from MN7R public positioning',
      'public guides, manuals, and benchmark methodology framing where already published',
    ],
    knowledgeTitle: 'Knowledge, methodology, and open infrastructure matter here.',
    knowledgeSummary:
      'The ecosystem includes public methodology, benchmark logic, guides, and open explanatory surfaces because physical commodity infrastructure needs credibility, not just UI polish.',
    knowledgeBullets: [
      'benchmark and methodology framing through 1D3X, SPIKE, and UGA Index',
      'public operational and market-infrastructure writing through ABVX and MN7R',
      'book and manual surfaces connected to commodity-market practice',
    ],
    workWithAmiTitle: 'Three ways to work with AMI.',
    workWithAmiSummary:
      'AMI is designed to support partnership conversations, commercial discussions, and concrete entry points into existing ecosystem products without forcing one engagement model.',
    collaborationPaths: [
      {
        id: 'tech-partners',
        title: 'Technology / ecosystem partners',
        audience: ['AI providers', 'cloud/data partners', 'accelerators', 'funds', 'strategic infrastructure partners'],
        summary: 'For organizations interested in supporting, accelerating, or extending the infrastructure stack itself.',
      },
      {
        id: 'commodity-companies',
        title: 'Commodity companies',
        audience: ['brokers', 'traders', 'processors', 'market operators', 'European commodity businesses'],
        summary: 'For firms exploring custom systems, digital transformation, AI-enabled operations, consulting, partnership, or embedded product leadership around their workflows.',
      },
      {
        id: 'market-clients',
        title: 'Market clients / product users',
        audience: ['index users', 'benchmark partners', 'market-intelligence users', 'ecosystem collaborators'],
        summary: 'For organizations interested in a specific live product, benchmark, monitoring surface, or partner-facing infrastructure module.',
      },
    ],
    contactTitle: 'Direct contact, no funnel theatre.',
    contactSummary:
      'AMI is currently operated by Anton Biletskyi-Volokh in France under the AMI trade name. The ecosystem can be discussed directly for partnership, product, consulting, or strategic collaboration conversations.',
    contactBullets: [
      'Email: a.biletskiy@gmail.com',
      'LinkedIn: abvcreative',
      'Public ecosystem map: abvx.xyz/focus',
    ],
    footerNote: 'AMI is an ecosystem surface, not a claim that all infrastructure is one legal company.',
  },
  fr: {
    locale: 'fr',
    path: '/fr/ami',
    alternatePath: '/ami',
    languageLabel: 'Français',
    alternateLabel: 'English',
    title: 'AMI — Agro Market Infrastructure',
    description:
      'AMI est la porte d’entrée publique d’un écosystème d’infrastructure agro-commodities: opérations de courtage, intelligence de marché, couches de benchmark, outils de trading et couche de connaissance IA gouvernée pour les marchés physiques.',
    heroEyebrow: 'Agro Market Infrastructure',
    heroTitle: 'Infrastructure numérique pour les marchés physiques de matières premières.',
    heroSummary:
      'Opérations de courtage, intelligence de marché, couches de benchmark, outils de trading et workflows de connaissance assistés par IA — réunis en un écosystème cohérent de systèmes réels, et non en une collection de sites isolés.',
    heroPrimaryCta: 'Explorer l’écosystème',
    heroSecondaryCta: 'Discuter d’un projet / Collaborer',
    sectionLabels: {
      ecosystem: 'L’écosystème',
      products: 'Produits & infrastructure',
      cortex: 'Couche IA Cortex',
      built: 'Construit, pas hypothétique',
      knowledge: 'Connaissance & infrastructure ouverte',
      workWithAmi: 'Travailler avec AMI',
      contact: 'Contact',
    },
    ecosystemIntro:
      'AMI ne présente pas une plateforme monolithique. Il présente une pile d’infrastructure de marché: workflows d’exécution, produits de benchmark, surfaces de monitoring, fronts commerciaux et couche de connaissance IA autour des marchés physiques.',
    ecosystemLayers: [
      {
        name: 'Opérations de courtage',
        detail: 'Discipline d’exécution, contexte contrepartie, contrôle post-trade et visibilité workflow par rôles.',
        links: ['MN7R'],
      },
      {
        name: 'Intelligence de marché',
        detail: 'Monitoring opérationnel des prix, de la logistique, de la météo, de la réglementation, du fret et des changements de marché.',
        links: ['Cropto Monitor'],
      },
      {
        name: 'Benchmarks & indices',
        detail: 'Infrastructure de prix de référence pour les marchés spot fragmentés et lancements répétables de benchmarks locaux.',
        links: ['SPIKE SPOT INDEX', 'UGA Index', '1D3X'],
      },
      {
        name: 'Couches trading & fronts marché',
        detail: 'Surfaces commerciales et produit qui transforment l’infrastructure en offres, récits et points d’entrée concrets.',
        links: ['Cropto', 'Liqua'],
      },
      {
        name: 'Couche IA / connaissance',
        detail: 'Contexte gouverné, retrieval et support de recherche sans prétendre que l’IA remplace le jugement marché.',
        links: ['Cortex'],
      },
    ],
    productsIntro:
      'L’écosystème comprend déjà des produits publics actifs, des surfaces partenaires et des systèmes opérationnels. AMI existe pour montrer comment ces éléments se renforcent mutuellement.',
    cortexTitle: 'Cortex est la couche transversale de connaissance.',
    cortexSummary:
      'Cortex n’est pas présenté comme une startup IA autonome. C’est la couche de connaissance et de retrieval gouvernée qui soutient le contexte, la recherche, la mémoire projet et les workflows assistés à travers la pile.',
    cortexBullets: [
      'support de contexte et de retrieval borné',
      'mémoire marché et mémoire projet',
      'support de recherche pour les workflows opérateurs',
      'assistance IA gouvernée à travers les surfaces de l’infrastructure',
    ],
    builtTitle: 'Des systèmes en fonctionnement, des preuves publiques, une vraie infrastructure.',
    builtSummary:
      'AMI s’appuie sur des produits déployés, des pages publiques de benchmark, des landings partenaires, une méthodologie documentée et des outils opérationnels. Ce n’est ni un deck conceptuel ni un récit de traction inventée.',
    builtProofs: [
      'surfaces publiques actives sur 1D3X, SPIKE et UGA Index',
      'surfaces commerciales partenaires opérationnelles comme Liqua',
      'pages publiques et cartographie d’écosystème sur ABVX',
      'preuves de workflow de courtage via le positionnement public de MN7R',
      'guides, manuels et cadrage méthodologique déjà publiés',
    ],
    knowledgeTitle: 'La méthode et la connaissance font partie de l’infrastructure.',
    knowledgeSummary:
      'L’écosystème inclut méthodologie publique, logique de benchmark, guides et surfaces explicatives ouvertes, car une infrastructure de marché physique a besoin de crédibilité, pas seulement d’un bon design.',
    knowledgeBullets: [
      'cadres méthodologiques via 1D3X, SPIKE et UGA Index',
      'écriture publique opérationnelle et market-infrastructure via ABVX et MN7R',
      'surfaces de livres et de manuels liées à la pratique réelle du marché',
    ],
    workWithAmiTitle: 'Trois façons de travailler avec AMI.',
    workWithAmiSummary:
      'AMI sert à ouvrir des conversations de partenariat, des échanges commerciaux et des points d’entrée vers les produits existants, sans imposer un modèle unique d’engagement.',
    collaborationPaths: [
      {
        id: 'tech-partners',
        title: 'Partenaires technologiques / écosystème',
        audience: ['fournisseurs IA', 'partenaires cloud/data', 'accélérateurs', 'fonds', 'partenaires infrastructure'],
        summary: 'Pour les organisations qui souhaitent soutenir, accélérer ou prolonger la pile d’infrastructure elle-même.',
      },
      {
        id: 'commodity-companies',
        title: 'Entreprises commodities',
        audience: ['courtiers', 'traders', 'transformateurs', 'opérateurs de marché', 'entreprises européennes du secteur'],
        summary: 'Pour les sociétés qui explorent des systèmes sur mesure, la transformation digitale, des opérations assistées par IA, du conseil, des partenariats ou un leadership produit embarqué.',
      },
      {
        id: 'market-clients',
        title: 'Clients marché / utilisateurs produit',
        audience: ['utilisateurs d’indices', 'partenaires benchmark', 'utilisateurs market intelligence', 'collaborateurs écosystème'],
        summary: 'Pour les organisations intéressées par un produit actif précis, un benchmark, une surface de monitoring ou un module d’infrastructure partenaire.',
      },
    ],
    contactTitle: 'Contact direct, sans fiction commerciale.',
    contactSummary:
      'AMI est aujourd’hui opéré par Anton Biletskyi-Volokh en France sous le nom commercial AMI. L’écosystème peut être discuté directement pour des partenariats, produits, missions de conseil ou collaborations stratégiques.',
    contactBullets: [
      'Email : a.biletskiy@gmail.com',
      'LinkedIn : abvcreative',
      'Carte publique de l’écosystème : abvx.xyz/focus',
    ],
    footerNote: 'AMI est une surface d’écosystème, pas l’affirmation que toute l’infrastructure relève d’une seule société.',
  },
};
