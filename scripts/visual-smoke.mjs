import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { qaRoutes, qaViewports } from './qa-routes.mjs';
import { withQaServer } from './qa-server.mjs';

const outDir = path.join(process.cwd(), '.cache', 'visual-smoke');

function routeUrl(baseUrl, routePath) {
  return new URL(routePath, baseUrl).toString();
}

async function inspectMedia(page) {
  return page.evaluate(() => {
    const selectors = [
      '.media-panel',
      '.homepage-latest-card__media',
      '.featured-writing-card__media',
      '.recent-writing-card__media',
      '.project-catalogue-card__media',
      '.book-catalogue-card__cover-link',
      '.work-related-card__media',
      '.book-related-card__media',
    ];

    const mediaBlocks = [...document.querySelectorAll(selectors.join(','))].filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 24 && rect.height > 24;
    });

    return mediaBlocks.map((element) => {
      const rect = element.getBoundingClientRect();
      const img = element.querySelector('img');
      const iframe = element.querySelector('iframe');
      const placeholder = element.querySelector('[class*="placeholder"]');
      const label =
        element.getAttribute('aria-label') ||
        element.closest('article')?.querySelector('h1,h2,h3')?.textContent?.trim() ||
        element.closest('section')?.querySelector('h1,h2,h3')?.textContent?.trim() ||
        element.textContent?.trim().slice(0, 80) ||
        element.className;

      return {
        label,
        className: element.className,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        hasImage: Boolean(img),
        hasIframe: Boolean(iframe),
        hasPlaceholder: Boolean(placeholder),
        imageSrc: img?.currentSrc || img?.src || '',
        imageNaturalWidth: img?.naturalWidth || 0,
        imageNaturalHeight: img?.naturalHeight || 0,
        imageComplete: img?.complete || false,
      };
    });
  });
}

async function loadLazyMedia(page) {
  await page.evaluate(async () => {
    const step = Math.max(360, Math.round(window.innerHeight * 0.75));
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() =>
    [...document.images]
      .filter((img) => img.getBoundingClientRect().width > 24 && img.getBoundingClientRect().height > 24)
      .every((img) => img.complete),
  { timeout: 15_000 }).catch(() => undefined);
}

function mediaFailures(mediaBlocks) {
  return mediaBlocks.filter((block) => {
    if (block.hasIframe) return false;
    if (block.hasPlaceholder) return true;
    if (!block.hasImage) return true;
    return !block.imageComplete || block.imageNaturalWidth < 8 || block.imageNaturalHeight < 8;
  });
}

await withQaServer(async (baseUrl) => {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const failures = [];

  try {
    for (const viewport of qaViewports) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
      });

      for (const route of qaRoutes) {
        const url = routeUrl(baseUrl, route.path);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
        await loadLazyMedia(page);
        await page.screenshot({
          path: path.join(outDir, `${route.slug}-${viewport.name}.png`),
          fullPage: true,
        });

        const mediaBlocks = await inspectMedia(page);
        const broken = mediaFailures(mediaBlocks);
        const result = {
          route: route.path,
          viewport: viewport.name,
          url,
          mediaBlocks: mediaBlocks.length,
          brokenMediaBlocks: broken,
        };
        results.push(result);
        if (broken.length) failures.push(result);
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }

  writeFileSync(path.join(outDir, 'report.json'), `${JSON.stringify(results, null, 2)}\n`);

  for (const result of results) {
    console.log(`${result.brokenMediaBlocks.length ? 'FAIL' : 'OK'} ${result.viewport} ${result.route}: ${result.mediaBlocks} media blocks`);
    for (const broken of result.brokenMediaBlocks) {
      console.log(`  empty/broken: ${broken.label} (${broken.width}x${broken.height}) ${broken.imageSrc}`);
    }
  }

  if (failures.length) {
    throw new Error(`Visual smoke failed: ${failures.length} route/viewport combinations have empty or broken media blocks.`);
  }
});
