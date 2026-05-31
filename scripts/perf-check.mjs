import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { qaRoutes } from './qa-routes.mjs';
import { withQaServer } from './qa-server.mjs';

process.env.QA_PORT ||= '3211';

const outDir = path.join(process.cwd(), '.cache', 'perf-check');

const thresholds = {
  domContentLoadedMs: Number(process.env.QA_DOM_CONTENT_LOADED_MS || 2500),
  loadMs: Number(process.env.QA_LOAD_MS || 4500),
  lcpMs: Number(process.env.QA_LCP_MS || 3500),
  cls: Number(process.env.QA_CLS || 0.1),
  brokenImages: 0,
};

function routeUrl(baseUrl, routePath) {
  return new URL(routePath, baseUrl).toString();
}

async function collectMetrics(page) {
  return page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paints = Object.fromEntries(
      performance.getEntriesByType('paint').map((entry) => [entry.name, Math.round(entry.startTime)]),
    );
    const images = [...document.images];
    const brokenImages = images
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src);

    return {
      ttfbMs: navigation ? Math.round(navigation.responseStart - navigation.requestStart) : 0,
      domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : 0,
      loadMs: navigation ? Math.round(navigation.loadEventEnd) : 0,
      firstPaintMs: paints['first-paint'] || 0,
      firstContentfulPaintMs: paints['first-contentful-paint'] || 0,
      lcpMs: Math.round(window.__qaLcp || 0),
      cls: Number((window.__qaCls || 0).toFixed(4)),
      imageCount: images.length,
      brokenImages,
      transferSizeKb: navigation ? Math.round((navigation.transferSize || 0) / 1024) : 0,
    };
  });
}

function metricFailures(metrics) {
  const failures = [];
  if (metrics.domContentLoadedMs > thresholds.domContentLoadedMs) {
    failures.push(`DCL ${metrics.domContentLoadedMs}ms > ${thresholds.domContentLoadedMs}ms`);
  }
  if (metrics.loadMs > thresholds.loadMs) {
    failures.push(`load ${metrics.loadMs}ms > ${thresholds.loadMs}ms`);
  }
  if (metrics.lcpMs && metrics.lcpMs > thresholds.lcpMs) {
    failures.push(`LCP ${metrics.lcpMs}ms > ${thresholds.lcpMs}ms`);
  }
  if (metrics.cls > thresholds.cls) {
    failures.push(`CLS ${metrics.cls} > ${thresholds.cls}`);
  }
  if (metrics.brokenImages.length > thresholds.brokenImages) {
    failures.push(`broken images ${metrics.brokenImages.length} > ${thresholds.brokenImages}`);
  }
  return failures;
}

await withQaServer(async (baseUrl) => {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
  const results = [];
  const failures = [];

  await page.addInitScript(() => {
    window.__qaLcp = 0;
    window.__qaCls = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      window.__qaLcp = last?.startTime || window.__qaLcp || 0;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__qaCls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  try {
    for (const route of qaRoutes) {
      const url = routeUrl(baseUrl, route.path);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
      await page.waitForTimeout(500);
      const metrics = await collectMetrics(page);
      const routeFailures = metricFailures(metrics);
      const result = { route: route.path, url, metrics, failures: routeFailures };
      results.push(result);
      if (routeFailures.length) failures.push(result);
    }
  } finally {
    await browser.close();
  }

  writeFileSync(path.join(outDir, 'report.json'), `${JSON.stringify({ thresholds, results }, null, 2)}\n`);

  for (const result of results) {
    const m = result.metrics;
    console.log(
      `${result.failures.length ? 'FAIL' : 'OK'} ${result.route}: DCL ${m.domContentLoadedMs}ms, load ${m.loadMs}ms, LCP ${m.lcpMs}ms, CLS ${m.cls}, images ${m.imageCount}, broken ${m.brokenImages.length}`,
    );
    for (const failure of result.failures) console.log(`  ${failure}`);
  }

  if (failures.length) {
    throw new Error(`Perf check failed: ${failures.length} routes exceeded thresholds.`);
  }
});
