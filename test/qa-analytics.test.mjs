import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {chromium} from 'playwright';
import {excludeQaAnalytics} from '../scripts/qa-browser.mjs';

test('QA blocks analytics before the first page or a popup can send events', async () => {
 const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<button onclick="window.open(\'/popup\')">Open</button><script>window.ignore=localStorage.getItem("plausible_ignore"); fetch("https://plausible.io/api/event",{method:"POST",body:"synthetic"}).catch(()=>{}).finally(()=>window.finished=true);</script>');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 let sent=0;
 try {
  const context=await browser.newContext({serviceWorkers:'block'});
  // A simulated upstream collector must never receive even synthetic QA events.
  await context.route('https://plausible.io/**',async route=>{sent++;await route.fulfill({body:'ok'});});
  await excludeQaAnalytics(context);
  const page=await context.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(()=>window.finished);
  assert.equal(await page.evaluate(()=>window.ignore),'true');
  const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'Open'}).click();
  const child=await popup;await child.waitForLoadState('load');
  await child.waitForFunction(()=>window.finished);
  assert.equal(await child.evaluate(()=>window.ignore),'true');
  assert.equal(sent,0);
 } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
});
