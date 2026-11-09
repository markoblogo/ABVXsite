import sitemap from '@/lib/sitemap';
import {renderSitemap} from '@/lib/sitemap-xml.mjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(renderSitemap(await sitemap()), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
