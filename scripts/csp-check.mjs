import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { qaRoutes } from './qa-routes.mjs';

process.env.QA_PORT ||= '3212';

const { withQaServer } = await import('./qa-server.mjs');

const outDir = path.join(process.cwd(), '.cache', 'csp-check');
const cspNeedles = [
  'content security policy',
  'violates the following content security policy',
  'refused to load',
  'refused to execute',
  'refused to apply',
  'unsafe-eval',
  'eval',
];

const requiredCspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'nonce-",
  "'strict-dynamic'",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn-images-1.medium.com",
  "connect-src 'self'",
  'object-src \'none\'',
  "base-uri 'self'",
  "frame-ancestors 'none'",
];

const requiredReportOnlyDirectives = [
  "script-src 'self' 'nonce-",
  "'strict-dynamic'",
  "script-src-attr 'none'",
  "connect-src 'self'",
  'report-uri /api/csp-report',
  'report-to csp-endpoint',
];

const headerRoutes = [...qaRoutes, { path: '/work/cropto-market-risk-deck', slug: 'youtube-embed', label: 'YouTube embed' }];

function routeUrl(baseUrl, routePath) {
  return new URL(routePath, baseUrl).toString();
}

function isCspMessage(message) {
  const text = message.toLowerCase();
  return cspNeedles.some((needle) => text.includes(needle));
}

function isReportOnlyCspMessage(message) {
  return message.toLowerCase().includes('report-only');
}

function cspDirectiveValue(csp, directiveName) {
  const directive = csp
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${directiveName} `));
  return directive || '';
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const sha256Base64 = async (value) => {
      const data = new TextEncoder().encode(value);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return btoa(String.fromCharCode(...new Uint8Array(digest)));
    };

    const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map((script) => {
      try {
        JSON.parse(script.textContent || '');
        return { valid: true };
      } catch (error) {
        return { valid: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    const inlineScriptNodes = [...document.querySelectorAll('script:not([src])')];
    const nextChunks = [...document.querySelectorAll('script[src*="/_next/static/"]')].map((script) =>
      script.getAttribute('src'),
    );

    const brokenImages = [...document.images]
      .filter((img) => {
        const rect = img.getBoundingClientRect();
        return rect.width > 24 && rect.height > 24 && (!img.complete || img.naturalWidth < 8 || img.naturalHeight < 8);
      })
      .map((img) => ({
        src: img.currentSrc || img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }));

    const youtubeEmbeds = [...document.querySelectorAll('iframe[src*="youtube.com/embed"], iframe[src*="youtube-nocookie.com/embed"]')].map(
      (iframe) => iframe.getAttribute('src'),
    );

    return Promise.all(
      inlineScriptNodes.map(async (script) => ({
        id: script.id || null,
        type: script.getAttribute('type') || null,
        nonce: script.nonce || script.getAttribute('nonce') || null,
        bytes: (script.textContent || '').length,
        sha256: await sha256Base64(script.textContent || ''),
      })),
    ).then((inlineScripts) => ({
      jsonLd,
      inlineScripts,
      nextChunks,
      brokenImages,
      youtubeEmbeds,
    }));
  });
}

async function loadLazyImages(page) {
  await page.evaluate(async () => {
    const step = Math.max(360, Math.round(window.innerHeight * 0.75));
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page
    .waitForFunction(
      () =>
        [...document.images]
          .filter((img) => img.getBoundingClientRect().width > 24 && img.getBoundingClientRect().height > 24)
          .every((img) => img.complete),
      { timeout: 15_000 },
    )
    .catch(() => undefined);
}

await withQaServer(async (baseUrl) => {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const failures = [];

  try {
    for (const route of headerRoutes) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
      const consoleViolations = [];
      const pageErrors = [];

      page.on('console', (message) => {
        const text = message.text();
        if (isCspMessage(text) && !isReportOnlyCspMessage(text)) consoleViolations.push({ type: message.type(), text });
      });
      page.on('pageerror', (error) => {
        const text = error.message;
        if (isCspMessage(text) && !isReportOnlyCspMessage(text)) pageErrors.push(text);
      });

      const url = routeUrl(baseUrl, route.path);
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
      await loadLazyImages(page);
      const csp = response?.headers()['content-security-policy'] || '';
      const cspReportOnly = response?.headers()['content-security-policy-report-only'] || '';
      const reportingEndpoints = response?.headers()['reporting-endpoints'] || '';
      const missingDirectives = requiredCspDirectives.filter((directive) => !csp.includes(directive));
      const missingReportOnlyDirectives = requiredReportOnlyDirectives.filter((directive) => !cspReportOnly.includes(directive));
      const hasUnsafeEval = csp.includes("'unsafe-eval'");
      const scriptDirectives = [
        cspDirectiveValue(csp, 'script-src'),
        cspDirectiveValue(csp, 'script-src-elem'),
      ].join(' ');
      const scriptAllowsUnsafeInline = scriptDirectives.includes("'unsafe-inline'");
      const reportOnlyScriptDirectives = [
        cspDirectiveValue(cspReportOnly, 'script-src'),
        cspDirectiveValue(cspReportOnly, 'script-src-elem'),
      ].join(' ');
      const reportOnlyScriptAllowsUnsafe =
        reportOnlyScriptDirectives.includes("'unsafe-inline'") || reportOnlyScriptDirectives.includes("'unsafe-eval'");
      const headers = {
        csp,
        cspReportOnly,
        reportingEndpoints,
        referrerPolicy: response?.headers()['referrer-policy'] || '',
        contentTypeOptions: response?.headers()['x-content-type-options'] || '',
        frameOptions: response?.headers()['x-frame-options'] || '',
        permissionsPolicy: response?.headers()['permissions-policy'] || '',
        hsts: response?.headers()['strict-transport-security'] || '',
        coop: response?.headers()['cross-origin-opener-policy'] || '',
        originAgentCluster: response?.headers()['origin-agent-cluster'] || '',
      };
      const inspected = await inspectPage(page);
      const invalidJsonLd = inspected.jsonLd.filter((item) => !item.valid);
      const inlineScriptsWithoutNonce = inspected.inlineScripts.filter((script) => script.bytes > 0 && !script.nonce);
      const routeFailures = [
        ...missingDirectives.map((directive) => `missing CSP directive: ${directive}`),
        ...missingReportOnlyDirectives.map((directive) => `missing CSP report-only directive: ${directive}`),
        ...(hasUnsafeEval ? ['CSP still allows unsafe-eval'] : []),
        ...(scriptAllowsUnsafeInline ? ['CSP enforced script directives still allow unsafe-inline'] : []),
        ...(reportOnlyScriptAllowsUnsafe ? ['CSP report-only script directives still allow unsafe-inline/unsafe-eval'] : []),
        ...(inlineScriptsWithoutNonce.length ? [`inline scripts without nonce: ${inlineScriptsWithoutNonce.length}`] : []),
        ...(!reportingEndpoints.includes('csp-endpoint="/api/csp-report"') ? ['missing CSP Reporting-Endpoints header'] : []),
        ...(consoleViolations.length ? [`CSP/security console violations: ${consoleViolations.length}`] : []),
        ...(pageErrors.length ? [`CSP/security page errors: ${pageErrors.length}`] : []),
        ...(invalidJsonLd.length ? [`invalid JSON-LD scripts: ${invalidJsonLd.length}`] : []),
        ...(inspected.nextChunks.length === 0 ? ['no Next static chunks found'] : []),
        ...(inspected.brokenImages.length ? [`broken visible images: ${inspected.brokenImages.length}`] : []),
        ...(route.slug === 'youtube-embed' && inspected.youtubeEmbeds.length === 0 ? ['YouTube embed not found'] : []),
      ];

      const result = {
        route: route.path,
        url,
        headers,
        jsonLdScripts: inspected.jsonLd.length,
        inlineScripts: inspected.inlineScripts,
        nextChunks: inspected.nextChunks.length,
        youtubeEmbeds: inspected.youtubeEmbeds,
        brokenImages: inspected.brokenImages,
        consoleViolations,
        pageErrors,
        failures: routeFailures,
      };
      results.push(result);
      if (routeFailures.length) failures.push(result);
      await page.close();
    }
  } finally {
    await browser.close();
  }

  writeFileSync(path.join(outDir, 'report.json'), `${JSON.stringify(results, null, 2)}\n`);

  for (const result of results) {
    console.log(`${result.failures.length ? 'FAIL' : 'OK'} ${result.route}`);
    console.log(
      `  JSON-LD: ${result.jsonLdScripts}, Inline scripts: ${result.inlineScripts.length}, Next chunks: ${result.nextChunks}, YouTube embeds: ${result.youtubeEmbeds.length}`,
    );
    for (const failure of result.failures) console.log(`  ${failure}`);
  }

  if (failures.length) {
    throw new Error(`CSP check failed on ${failures.length} route(s). See ${path.join(outDir, 'report.json')}.`);
  }
});
