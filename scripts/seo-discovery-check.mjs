import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { withQaServer } from './qa-server.mjs';

const french = '/writing/premiere-traduction-francaise-jeanne-bataillonneuse-miss-adrienne';
const ukrainian = '/writing/vyishov-pershyi-frantsuzkyi-pereklad-jeanne-bataillonneuse';
await withQaServer(async (base) => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const [route, language] of [['/', 'en'], ['/fr/ami', 'fr'], [french, 'fr'], [ukrainian, 'uk']]) {
      const serverHtml = await page.request.get(base + route);
      assert.match(await serverHtml.text(), new RegExp(`<html[^>]*lang="${language}"`), route + ' server language');
      const response = await page.goto(base + route);
      assert.equal(response.status(), 200, route);
      assert.equal(await page.locator('html').getAttribute('lang'), language, route);
      if (route.startsWith('/writing/')) {
        assert.equal(await page.locator('link[rel="alternate"][hreflang="fr"]').getAttribute('href'), 'https://abvx.xyz' + french);
        assert.equal(await page.locator('link[rel="alternate"][hreflang="uk"]').getAttribute('href'), 'https://abvx.xyz' + ukrainian);
        assert.ok(await page.locator('.native-writing-article__body strong').count());
        assert.ok(await page.locator('.native-writing-article__body a[href="/books/geo-chkouroupiy-jeanne-la-bataillonneuse"]').count());
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://abvx.xyz' + route);
        const text = await page.locator('.native-writing-article__body').innerText();
        assert.ok(!text.includes('**'), route + ' leaked Markdown');
      }
    }
    await page.goto(base + french);
    await page.locator('a[href="' + ukrainian + '"]').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
    await page.locator('header a[href="/books"]').first().click();
    await page.waitForURL(base + '/books');
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.goto(base + '/work-with-me/kdp-publishing-automation');
    assert.equal(await page.locator('a[href="/work/book-landing"]').count(), 0);
    const link = page.locator('main a[href="/work/book-landings"]').first();
    assert.ok(await link.count());
    await link.click();
    assert.equal((await page.request.get(page.url())).status(), 200);
    const sitemap = await page.request.get(base + '/sitemap.xml');
    assert.equal(sitemap.status(), 200);
    const xml = await sitemap.text();
    assert.ok(xml.includes('https://abvx.xyz' + french));
    assert.ok(xml.includes('https://abvx.xyz' + ukrainian));
    assert.ok(xml.includes('hreflang="fr"'));
    assert.ok(xml.includes('hreflang="uk"'));
    const routes = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    assert.equal(new Set(routes).size, routes.length);
    for (const url of routes) {
      const response = await page.request.get(base + new URL(url).pathname);
      assert.equal(response.status(), 200, url);
    }
    console.log(`SEO discovery checks passed: ${routes.length} sitemap routes, localized HTML, reciprocal hreflang, navigation, Markdown and book links.`);
  } finally {
    await browser.close();
  }
});
