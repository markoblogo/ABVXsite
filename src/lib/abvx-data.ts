import { propNumber, propText, propUrl, queryDataSource, type NotionProperty } from './notion';

// Notion IDs (current workspace)
// Ecosystem DB: 2f83d845-eb21-8045-b543-ea749b4e38a9
const DS_ECOSYSTEMS = '2f83d845-eb21-80f3-ae17-000b19f8a8c8';
// My Products DB: 2b43d845-eb21-80d4-be8a-c8de3f89d715
const DS_PRODUCTS = '2b43d845-eb21-80be-9968-000b982244a7';
// My Books DB: 2853d845-eb21-801a-a959-fe0c366cbea5 (data source with actual rows)
const DS_BOOKS = '2853d845-eb21-800e-a5ae-000b6a38ddd4';

export type Ecosystem = {
  id: string;
  name: string;
  slug: string;
  status?: string;
  tagline?: string;
  primaryUrl?: string;
  priority?: number;
  coverImage?: string;
};

export type Project = {
  id: string;
  name: string;
  type?: string;
  assetType?: string;
  stage?: string;
  tagline?: string;
  website?: string;
  github?: string;
  demo?: string;
  statusNote?: string;
  coverImage?: string;
  ecosystemIds: string[];
  primaryDirection?: string;
  relatedDirections: string[];
  initiative?: string;
  parentInitiative?: string;
  pressCluster?: string;
  pressSubcluster?: string;
  langCluster?: string;
  langSubcluster?: string;
  techCluster?: string;
  techSubcluster?: string;
  croptoCluster?: string;
  croptoSubcluster?: string;
  reviewNotes?: string;
};

export type Book = {
  id: string;
  name: string;
  slug: string;
  section?: string; // "Раздел"
  assetType?: string;
  site?: string;
  teaser?: string;
  pdf?: string;
  amazon?: string;
  paper?: string;
  coverImage?: string;
  ecosystemIds: string[];
  primaryDirection?: string;
  relatedDirections: string[];
  initiative?: string;
  parentInitiative?: string;
  pressCluster?: string;
  pressSubcluster?: string;
  langCluster?: string;
  langSubcluster?: string;
  techCluster?: string;
  techSubcluster?: string;
  croptoCluster?: string;
  croptoSubcluster?: string;
  reviewNotes?: string;
};

function idsFromRelation(prop: unknown): string[] {
  if (!prop || typeof prop !== 'object' || (prop as { type?: string }).type !== 'relation') {
    return [];
  }
  return ((prop as RelationProperty).relation || []).map((x) => x.id);
}

function cleanLabel(s: string | undefined): string | undefined {
  if (!s) return undefined;
  // Remove most emoji / pictographic glyphs + variation selectors.
  const out = s
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return out || undefined;
}

function cleanStatus(s: string | undefined): string | undefined {
  // Keep status as-is (after emoji cleanup). UI decides how to display/highlight.
  return cleanLabel(s);
}

function propUrlAny(props: NotionProps, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = propUrl(props[key]);
    if (value) return value;
  }
  return undefined;
}

function splitLabels(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((x) => cleanLabel(x))
    .filter(Boolean) as string[];
}

function relatedDirections(props: NotionProps): string[] {
  const textValue = cleanLabel(propText(props['Related Directions Text']));
  const multiValue = cleanLabel(propText(props['Related Directions']));
  return splitLabels(textValue || multiValue);
}

function structureProps(props: NotionProps) {
  return {
    assetType:
      cleanLabel(propText(props['Asset Type V2'])) ||
      cleanLabel(propText(props['Artifact Type'])) ||
      undefined,
    primaryDirection: cleanLabel(propText(props['Primary Direction'])) || undefined,
    relatedDirections: relatedDirections(props),
    initiative: cleanLabel(propText(props.Initiative)) || undefined,
    parentInitiative: cleanLabel(propText(props['Parent Initiative'])) || undefined,
    pressCluster: cleanLabel(propText(props['Press Cluster'])) || undefined,
    pressSubcluster: cleanLabel(propText(props['Press Subcluster'])) || undefined,
    langCluster: cleanLabel(propText(props['Lang Cluster'])) || undefined,
    langSubcluster: cleanLabel(propText(props['Lang Subcluster'])) || undefined,
    techCluster: cleanLabel(propText(props['Tech Cluster'])) || undefined,
    techSubcluster: cleanLabel(propText(props['Tech Subcluster'])) || undefined,
    croptoCluster: cleanLabel(propText(props['Cropto Cluster'])) || undefined,
    croptoSubcluster: cleanLabel(propText(props['Cropto Subcluster'])) || undefined,
    reviewNotes: cleanLabel(propText(props['Review Notes'])) || undefined,
  };
}

function coverUrlFromPage(page: NotionPage): string | undefined {
  const cover = page?.cover;
  if (!cover) return undefined;
  if (cover.type === 'external') return cover.external?.url || undefined;
  if (cover.type === 'file') return cover.file?.url || undefined;
  return undefined;
}

export async function getEcosystems(): Promise<Ecosystem[]> {
  const res = await queryDataSource(DS_ECOSYSTEMS);
  const out = res.results.map((r) => {
    const p = r.properties || {};
    return {
      id: r.id,
      name: cleanLabel(propText(p.Name)) || '',
      slug: propText(p.Slug),
      status: cleanStatus(propText(p.Status)) || undefined,
      tagline: cleanLabel(propText(p.Tagline)) || undefined,
      primaryUrl: propUrl(p['Primary URL']) || undefined,
      priority: propNumber(p.Priority) ?? undefined,
      coverImage: coverUrlFromPage(r),
    } satisfies Ecosystem;
  });

  out.sort((a, b) => (a.priority ?? 9999) - (b.priority ?? 9999));
  return out;
}

export async function getProjects(): Promise<Project[]> {
  const res = await queryDataSource(DS_PRODUCTS);
  const out = res.results.map((r) => {
    const p = r.properties || {};
    return {
      id: r.id,
      name: cleanLabel(propText(p.Name)) || '',
      type: cleanLabel(propText(p.Type)) || undefined,
      stage: cleanLabel(propText(p.Stage)) || undefined,
      tagline: cleanLabel(propText(p.Tagline)) || undefined,
      website: propUrl(p.Website) || undefined,
      github: propUrl(p.GitHub) || undefined,
      demo: propUrlAny(p, [
        'Demo',
        'Video',
        'Teaser',
        'Teaser video',
        'YouTube demo',
        'Youtube demo',
      ]) || undefined,
      statusNote: cleanLabel(propText(p['Status note'])) || undefined,
      coverImage: coverUrlFromPage(r),
      ecosystemIds: idsFromRelation(p.Ecosystem),
      ...structureProps(p),
    } satisfies Project;
  });

  // Keep stable: name asc
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export async function getBooks(): Promise<Book[]> {
  const res = await queryDataSource(DS_BOOKS);
  const out = res.results.map((r) => {
    const p = r.properties || {};
    return {
      id: r.id,
      name: cleanLabel(propText(p.Name)) || '',
      slug: propText(p.Slug),
      section: cleanLabel(propText(p['Раздел'])) || undefined,
      site: propUrl(p.Site) || undefined,
      teaser: propUrlAny(p, [
        'Teaser',
        'Teaser video',
        'Video',
        'Video teaser',
        'YouTube teaser',
        'Youtube teaser',
      ]) || undefined,
      pdf: propUrl(p.Pdf) || undefined,
      amazon: propUrl(p['e-book Amazon']) || undefined,
      paper: propUrl(p['Paper book']) || undefined,
      coverImage: coverUrlFromPage(r),
      ecosystemIds: idsFromRelation(p.Ecosystem),
      ...structureProps(p),
    } satisfies Book;
  });

  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export async function getBookBySlug(slug: string): Promise<Book | null> {
  const books = await getBooks();
  return books.find((b) => b.slug === slug) || null;
}

export async function getEcosystemBySlug(slug: string): Promise<Ecosystem | null> {
  const e = await getEcosystems();
  return e.find((x) => x.slug === slug) || null;
}
type NotionProps = Record<string, NotionProperty>;

type RelationProperty = {
  type: 'relation';
  relation?: Array<{ id: string }>;
};

type NotionPage = {
  cover?: {
    type?: string;
    external?: { url?: string };
    file?: { url?: string };
  };
};
