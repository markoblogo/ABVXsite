import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildContentSecurityPolicy, generateNonce } from './lib/csp-policy';

// Legacy Notion public page URLs often end with a 32-char hex page id.
// Example: /Hi-I-m-Anton-Biletskyi-Volokh-2853d845eb21814e88e0fb116e6e729e
const LEGACY_NOTION_PATH_RE = /^\/[^/]+-[a-f0-9]{32}$/i;

function setCspHeaders(headers: Headers, nonce: string) {
  headers.set('Content-Security-Policy', buildContentSecurityPolicy(nonce));
  headers.set('Content-Security-Policy-Report-Only', buildContentSecurityPolicy(nonce, { reportOnly: true }));
  headers.set('Reporting-Endpoints', 'csp-endpoint="/api/csp-report"');
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  setCspHeaders(requestHeaders, nonce);

  if (LEGACY_NOTION_PATH_RE.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    const response = NextResponse.redirect(url, 308);
    setCspHeaders(response.headers, nonce);
    return response;
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  setCspHeaders(response.headers, nonce);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
