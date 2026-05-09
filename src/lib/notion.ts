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
    // Covers change often; for staging we want freshest data.
    cache: 'no-store',
  });

  const json = (await res.json()) as { message?: string };
  if (!res.ok) {
    const msg = json?.message || res.statusText;
    throw new Error(`Notion API error ${res.status}: ${msg}`);
  }
  return json as T;
}

type NotionTextFragment = {
  plain_text?: string;
};

export type NotionProperty = {
  type?: string;
  title?: NotionTextFragment[];
  rich_text?: NotionTextFragment[];
  url?: string | null;
  email?: string | null;
  phone_number?: string | null;
  select?: { name?: string } | null;
  multi_select?: Array<{ name?: string }>;
  number?: number | null;
  checkbox?: boolean;
  relation?: Array<{ id?: string }>;
  files?: Array<{
    type?: string;
    external?: { url?: string };
    file?: { url?: string };
  }>;
};

export function propText(prop: NotionProperty): string {
  if (!prop) return '';
  const t = prop.type;
  if (t === 'title') return (prop.title || []).map((x) => x.plain_text || '').join('');
  if (t === 'rich_text') return (prop.rich_text || []).map((x) => x.plain_text || '').join('');
  if (t === 'url') return prop.url || '';
  if (t === 'email') return prop.email || '';
  if (t === 'phone_number') return prop.phone_number || '';
  if (t === 'select') return prop.select?.name || '';
  if (t === 'multi_select') return (prop.multi_select || []).map((x) => x.name || '').join(', ');
  if (t === 'number') return prop.number === null || prop.number === undefined ? '' : String(prop.number);
  if (t === 'checkbox') return prop.checkbox ? 'true' : 'false';
  // relation -> ids
  if (t === 'relation') return (prop.relation || []).map((x) => x.id || '').join(',');
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
  if (!prop) return null;
  if (prop.type === 'url') return prop.url || null;
  if (prop.type === 'files') {
    const f = (prop.files || [])[0];
    if (!f) return null;
    if (f.type === 'external') return f.external?.url || null;
    if (f.type === 'file') return f.file?.url || null;
    return null;
  }
  const u = propText(prop);
  return u ? u : null;
}

export type DataSourceQueryResponse = {
  object: 'list';
  results: Array<{
    id: string;
    properties?: Record<string, NotionProperty>;
    cover?: {
      type?: string;
      external?: { url?: string };
      file?: { url?: string };
    };
  }>;
  has_more: boolean;
  next_cursor: string | null;
};

export async function queryDataSource(
  dataSourceId: string,
  body: Record<string, unknown> = {},
): Promise<DataSourceQueryResponse> {
  return notionFetch<DataSourceQueryResponse>(`/data_sources/${dataSourceId}/query`, {
    method: 'POST',
    body: JSON.stringify({ page_size: 100, ...body }),
  });
}
