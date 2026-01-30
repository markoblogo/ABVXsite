export const NOTION_VERSION = '2025-09-03';

const NOTION_API_BASE = 'https://api.notion.com/v1';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export async function notionFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = requireEnv('NOTION_TOKEN');

  const res = await fetch(`${NOTION_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    // Next.js: cache by default on server components; we prefer revalidate.
    next: { revalidate: 300 },
  });

  const json = (await res.json()) as any;
  if (!res.ok) {
    const msg = json?.message || res.statusText;
    throw new Error(`Notion API error ${res.status}: ${msg}`);
  }
  return json as T;
}

export type NotionProperty = any;

export function propText(prop: NotionProperty): string {
  if (!prop) return '';
  const t = prop.type;
  if (t === 'title') return (prop.title || []).map((x: any) => x.plain_text).join('');
  if (t === 'rich_text') return (prop.rich_text || []).map((x: any) => x.plain_text).join('');
  if (t === 'url') return prop.url || '';
  if (t === 'email') return prop.email || '';
  if (t === 'phone_number') return prop.phone_number || '';
  if (t === 'select') return prop.select?.name || '';
  if (t === 'multi_select') return (prop.multi_select || []).map((x: any) => x.name).join(', ');
  if (t === 'number') return prop.number === null || prop.number === undefined ? '' : String(prop.number);
  if (t === 'checkbox') return prop.checkbox ? 'true' : 'false';
  // relation -> ids
  if (t === 'relation') return (prop.relation || []).map((x: any) => x.id).join(',');
  return '';
}

export function propNumber(prop: NotionProperty): number | null {
  if (!prop) return null;
  if (prop.type === 'number') return prop.number ?? null;
  const txt = propText(prop);
  if (!txt) return null;
  const n = Number(txt);
  return Number.isFinite(n) ? n : null;
}

export function propUrl(prop: NotionProperty): string | null {
  const u = propText(prop);
  return u ? u : null;
}

export type DataSourceQueryResponse = {
  object: 'list';
  results: Array<any>;
  has_more: boolean;
  next_cursor: string | null;
};

export async function queryDataSource(dataSourceId: string, body: any = {}): Promise<DataSourceQueryResponse> {
  return notionFetch<DataSourceQueryResponse>(`/data_sources/${dataSourceId}/query`, {
    method: 'POST',
    body: JSON.stringify({ page_size: 100, ...body }),
  });
}
