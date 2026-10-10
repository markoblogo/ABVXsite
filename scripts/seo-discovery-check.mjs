import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contentFiles, parseContentFile } from './content-lib.mjs';
import { chromium } from 'playwright';
import { withQaServer } from './qa-server.mjs';
import { indexedWorkingStories, readWorkingStories, workingStoryPath } from '../src/content/working-stories-lib.mjs';

const workingSeries = JSON.parse(readFileSync('content/working-stories.json', 'utf8'));

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
    const titles = new Map();
    for (const url of routes) {
      const response = await page.request.get(base + new URL(url).pathname);
      assert.equal(response.status(), 200, url);
      const html = await response.text();
      const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
      assert.ok(title, url + ' missing title');
      assert.ok(!titles.has(title), `Duplicate title: ${url} and ${titles.get(title)}`);
      titles.set(title, url);
    }

    const indexResponse = await page.request.get(base + '/content-index.json');
    assert.equal(indexResponse.status(), 200);
    const index = await indexResponse.json();
    const llmsResponse = await page.request.get(base + '/llms.txt');
    assert.equal(llmsResponse.status(), 200);
    const llms = await llmsResponse.text();
    const indexUrls = new Set(index.items.map((item) => item.canonicalUrl));
    const seriesRoute = '/writing/working-stories';
    assert.ok(indexUrls.has('https://abvx.xyz' + seriesRoute));
    assert.ok(llms.includes('URL: https://abvx.xyz' + seriesRoute + '\n'));
    assert.ok(routes.includes('https://abvx.xyz' + seriesRoute));
    const publicStories = indexedWorkingStories(readWorkingStories(), index);
    const missingStory = await page.request.get(base + '/writing/working-stories/unknown-story-for-qa');
    assert.equal(missingStory.status(), 404, 'unknown Working Story must not return 500');
    const publicStoryUrls = new Set(publicStories.map((story) => 'https://abvx.xyz' + workingStoryPath(story)));
    for (const story of readWorkingStories()) {
      const url = 'https://abvx.xyz' + workingStoryPath(story);
      const visible = publicStoryUrls.has(url);
      assert.equal(indexUrls.has(url), visible, url + ' JSON visibility');
      assert.equal(llms.includes('URL: ' + url + '\n'), visible, url + ' LLM visibility');
      assert.equal(routes.includes(url), visible, url + ' sitemap visibility');
      if (visible) {
        const record = index.items.find((item) => item.canonicalUrl === url);
        for (const field of ['story_id', 'cluster', 'period', 'book', 'source_session', 'source']) assert.ok(!(field in record), field + ' leaked publicly');
        await page.goto(base + workingStoryPath(story));
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), url);
        assert.equal(await page.locator('html').getAttribute('lang'), story.language);
        if (story.coverImage) {
          assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'), 'https://abvx.xyz' + story.coverImage.src);
          assert.equal(await page.locator('.working-story-body img').count(), 1 + (story.illustrations || []).length);
          for (const width of [320, 390, 768, 1280]) {
            await page.setViewportSize({ width, height: 900 });
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'illustrated Working Story overflow');
            const figure = page.locator('.working-story-body .media-panel--writing').first();
            const layout = await figure.evaluate((element) => ({ width: element.getBoundingClientRect().width, maxHeight: getComputedStyle(element).maxHeight, aspectRatio: getComputedStyle(element).aspectRatio }));
            assert.equal(layout.maxHeight, 'none', 'article media must not use the compact-card height');
            assert.equal(layout.aspectRatio, 'auto', 'article media must preserve original proportions');
            assert.ok(layout.width > Math.min(width - 100, 600), 'article cover must span the reading column');
          }
        }
        if (story.caseStudy) {
          const links = page.locator(`main a[href="${story.caseStudy.url}"]`);
          assert.ok(await links.count());
          for (const link of await links.all()) {
            assert.equal(await link.getAttribute('target'), '_blank');
            assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
          }
        }
      }
    }
    for (const width of [360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + '/writing');
      assert.equal(await page.locator(`main a[href="${seriesRoute}"]`).count(), 1);
      await page.locator(`main a[href="${seriesRoute}"]`).click();
      await page.waitForURL(base + seriesRoute);
      assert.equal(await page.locator('h1').textContent(), 'Working Stories');
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://abvx.xyz' + seriesRoute);
      if (!publicStories.length) assert.ok((await page.locator('main').innerText()).includes(workingSeries.emptyState));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Working Stories horizontal overflow');
    }
    for (const folder of ['work', 'books', 'series', 'writing']) {
      for (const file of contentFiles(folder)) {
        const { data } = parseContentFile(file);
        const path = data.canonicalPath || `/${folder === 'series' ? 'books' : folder}/${data.slug}`;
        const url = 'https://abvx.xyz' + path;
        if (['private', 'draft'].includes(data.visibility)) {
          assert.ok(!indexUrls.has(url), url + ' leaked non-public content');
          assert.ok(!llms.includes('URL: ' + url + '\n'), url + ' leaked into llms');
        } else {
          assert.ok(indexUrls.has(url), url + ' missing from JSON index');
          assert.ok(llms.includes('URL: ' + url + '\n'), url + ' missing from llms');
        }
      }
    }

    const editorials = JSON.parse(readFileSync('content/editorial/index.json', 'utf8'));
    const sitemapEntries = new Map([...xml.matchAll(/<url>(.*?)<\/url>/gs)].map((match) => {
      const entry = match[1];
      return [entry.match(/<loc>(.*?)<\/loc>/)?.[1], entry.match(/<lastmod>(.*?)<\/lastmod>/)?.[1]];
    }));
    for (const article of editorials) {
      assert.ok(Number.isFinite(Date.parse(article.publishedAt)), article.slug + ' invalid publication date');
      assert.ok(Date.parse(article.updatedAt) >= Date.parse(article.publishedAt), article.slug + ' reversed dates');
      const url = `https://abvx.xyz/editorial/${article.section}/${article.slug}`;
      assert.equal(sitemapEntries.get(url), new Date(article.updatedAt).toISOString(), url + ' stale lastmod');
      const indexed = index.items.find((item) => item.canonicalUrl === url);
      assert.equal(indexed?.updatedAt, article.updatedAt, url + ' stale index date');
    }
    for (const route of ['/about', '/focus']) {
      const sources = editorials.filter((article) => article.section === route.slice(1));
      const latest = Math.max(...sources.map((article) => Date.parse(article.updatedAt)));
      assert.ok(Date.parse(sitemapEntries.get('https://abvx.xyz' + route)) >= latest, route + ' excludes editorial updates');
    }
    const pageMetadata = JSON.parse(readFileSync('content/pages.json', 'utf8'));
    assert.ok(Date.parse(sitemapEntries.get('https://abvx.xyz/about')) >= Date.parse(pageMetadata['/about'].updatedAt), '/about excludes static page updates');
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + '/books');
      const hub = page.locator('main a[href="/toki-pona"]');
      assert.equal(await hub.count(), 1);
      await hub.click();
      await page.waitForURL(base + '/toki-pona');
      for (const path of ['/books/the-strange-case-of-dr-jekyll-and-mr-hyde-in-toki-pona', '/books/stoic-wisdom-toki-pona', '/work/toki-pona-ai-translator']) {
        assert.equal(await page.locator(`main a[href="${path}"]`).count(), 1);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Toki Pona horizontal overflow');
    }
    await page.goto(base);
    assert.ok((await page.title()).startsWith('AI-native Systems & Market Infrastructure'));
    console.log(`SEO discovery checks passed: ${routes.length} unique page titles and routes, complete public indexes, editorial dates, localized metadata and mobile/desktop Toki Pona navigation.`);
  } finally {
    await browser.close();
  }
});
