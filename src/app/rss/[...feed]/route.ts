import {publicRss} from '@/lib/public-rss';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, {params}: {params: Promise<{feed: string[]}>}) {
  const xml = await publicRss((await params).feed.join('/'));
  if (xml === null) return new Response('Feed not found', {status: 404});
  return new Response(xml, {headers: {
    'Content-Type': 'application/rss+xml; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }});
}
