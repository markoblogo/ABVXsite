import { fetchMediumFeed, fetchSubstackFeed } from '@/lib/feeds';
import { fetchYoutubeFeed } from '@/lib/youtube-feed';
import youtubeSettings from '../../../../../../content/youtube.json';

// Public metadata only, fixed providers only. The existing parsers/host policy apply.
export async function GET(_request: Request, { params }: { params: Promise<{ source: string }> }) {
  const { source } = await params;
  let items;
  if (source === 'medium') items = await fetchMediumFeed('https://abvcreative.medium.com/feed');
  else if (source === 'substack') items = await fetchSubstackFeed('https://abvx.substack.com/feed');
  else if (source === 'youtube') items = await fetchYoutubeFeed(youtubeSettings.feedUrl, youtubeSettings);
  else return Response.json({ error: 'Unknown Writing source' }, { status: 404 });
  if (!items.length) return Response.json({ error: 'Feed unavailable' }, { status: 503 });
  return Response.json(items, { headers: {
    'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=900',
    'X-Robots-Tag': 'noindex',
  } });
}
