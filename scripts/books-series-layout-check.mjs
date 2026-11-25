import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { chromium } from 'playwright';
import { createQaPage } from './qa-browser.mjs';
import { withQaServer } from './qa-server.mjs';

const observeOnly = process.argv.includes('--observe-only');
const output = process.env.BOOKS_LAYOUT_QA_OUTPUT || '.cache/books-series-layout.json';
const results = [];
async function inspect(root, selector, actionsSelector) {
  return root.evaluate((node, { selector, actionsSelector }) => {
    const media = node.querySelector(selector);
    const rect = media?.getBoundingClientRect();
    const image = media?.querySelector('img');
    const actions = node.querySelector(actionsSelector);
    const ar = actions?.getBoundingClientRect();
    const buttons = [...(actions?.querySelectorAll('.catalogue-actions__link') || [])].map(button => {
      const r = button.getBoundingClientRect();
      return { label: button.textContent.trim(), top: r.top, left: r.left, width: r.width, height: r.height, right: r.right };
    });
    const tags = node.querySelector('.tag-list');
    const tr = tags?.getBoundingClientRect();
    return {
      title: node.querySelector('h1,h3')?.textContent?.trim(),
      media: rect ? { width: rect.width, height: rect.height, ratio: rect.width / rect.height, objectFit: image ? getComputedStyle(image).objectFit : null } : null,
      buttons, actionWidth: ar?.width || 0, actionLeft: ar?.left || 0, actionRight: ar?.right || 0,
      tagsSeparate: !tr || !ar || ar.top >= tr.bottom - 1,
    };
  }, { selector, actionsSelector });
}
function check(layout, width) {
  if (observeOnly) return;
  if (layout.media) {
    assert.ok(Math.abs(layout.media.ratio - 1.6) < 0.035, layout.title + ': expected 16:10 media frame');
    assert.equal(layout.media.objectFit, 'contain', layout.title + ': image must remain uncropped');
  }
  const { buttons } = layout;
  assert.ok(layout.tagsSeparate, layout.title + ': tags and actions overlap');
  assert.ok(buttons.every(b => b.left >= layout.actionLeft - 1 && b.right <= layout.actionRight + 1), layout.title + ': button overflow');
  if (buttons.length) assert.ok(buttons.every(b => Math.abs(b.height - buttons[0].height) < 1), layout.title + ': inconsistent button height');
  if (width >= 980 && buttons.length > 1 && buttons.reduce((n,b) => n+b.width,0)+8*(buttons.length-1) <= layout.actionWidth-1)
    assert.ok(buttons.every(b => Math.abs(b.top-buttons[0].top) < 1), layout.title + ': links should share one row');
}

await withQaServer(async base => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1440, 1024, 390, 320]) {
      const page = await createQaPage(browser, { viewport: { width, height: 900 } });
      await page.goto(base + '/books', { waitUntil: 'domcontentloaded' });
      const lines = page.locator('.books-series-line');
      assert.ok(await lines.count(), 'publishing lines missing');
      const paths = [];
      for (const node of await lines.all()) {
        const layout = await inspect(node, '.books-series-line__media', '.books-series-line__actions .catalogue-actions');
        check(layout,width);
        results.push({ width, surface: 'catalogue', ...layout });
        const overview = node.locator('.editorial-section-link').first();
        if (await overview.count()) paths.push(await overview.getAttribute('href'));
      }
      if (!observeOnly) assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'books page has horizontal overflow at '+width);
      for (const path of [...new Set(paths)]) {
        const response = await page.goto(new URL(path,base).href, { waitUntil:'domcontentloaded' });
        assert.equal(response.status(),200,path);
        const hero = page.locator('.series-detail-hero');
        assert.equal(await hero.count(),1,path);
        const layout = await inspect(hero,'.series-detail-hero__media','.series-detail-hero__copy .catalogue-actions');
        check(layout,width);
        if (!observeOnly) assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path+' has horizontal overflow at '+width);
        results.push({ width,surface:'detail',path,...layout });
      }
      await page.context().close();
    }
  } finally { await browser.close(); }
});
mkdirSync(dirname(output), {recursive:true});
writeFileSync(output, JSON.stringify({ status: observeOnly ? 'OBSERVED' : 'PASS', results },null,2)+'\n');
console.log(`${observeOnly ? 'Observed' : 'Passed'} ${results.length} series layouts.`);
