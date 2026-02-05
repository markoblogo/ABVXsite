import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Legacy Notion public page URLs often end with a 32-char hex page id.
// Example: /Hi-I-m-Anton-Biletskyi-Volokh-2853d845eb21814e88e0fb116e6e729e
const LEGACY_NOTION_PATH_RE = /^\/[^/]+-[a-f0-9]{32}$/i;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (LEGACY_NOTION_PATH_RE.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)'],
};
