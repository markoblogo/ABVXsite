import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {chromium} from 'playwright';
import {excludeQaAnalytics,createQaPage} from '../scripts/qa-browser.mjs';

test('QA blocks analytics before the first page or a popup can send events', async () => {
 const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<button onclick="window.open(\'/popup\')">Open</button><script>window.ignore=localStorage.getItem("plausible_ignore"); fetch("https://plausible.io/api/event",{method:"POST",body:"synthetic"}).catch(()=>{}).finally(()=>window.finished=true);</script>');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser,sent=0;
 try {
  browser=await chromium.launch({headless:true});
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
 } finally {try {await browser?.close();} finally {await new Promise(resolve=>server.close(resolve));}}
});

test('performance mode preserves HTTP caching and excludes analytics using the official flag',async()=>{
 let assetRequests=0,events=0,browser;
 const server=createServer((req,res)=>{
  if(req.url==='/shared.js') {
   assetRequests++;res.setHeader('Content-Type','text/javascript');res.setHeader('Cache-Control','public, max-age=3600');
   res.end('window.ignore=localStorage.getItem("plausible_ignore"); if(window.ignore!=="true") fetch("/event",{method:"POST"});');
  }else if(req.url==='/event'){events++;res.end('ok');}
  else {res.setHeader('Content-Type','text/html');res.end('<script src="/shared.js"></script>');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {
  browser=await chromium.launch({headless:true});
  const page=await createQaPage(browser,{}, {blockAnalyticsRequests:false});
  const base=`http://127.0.0.1:${server.address().port}`;
  for(const route of ['/first','/second']) {
   await page.goto(base+route);
   assert.equal(await page.evaluate(()=>window.ignore),'true');
  }
  assert.equal(events,0);
  assert.equal(assetRequests,1,'the second page must reuse the shared asset from HTTP cache');
 } finally {try {await browser?.close();} finally {await new Promise(resolve=>server.close(resolve));}}
});

test('analytics QA exits promptly when the browser executable is missing',()=>{
 const folder=mkdtempSync(path.join(tmpdir(),'qa-no-browser-'));
 try {
  const env={...process.env,PLAYWRIGHT_BROWSERS_PATH:folder};
  // This is a standalone test runner, not a child managed by our runner's IPC.
  delete env.NODE_TEST_CONTEXT;
  const result=spawnSync(process.execPath,['--test','--test-name-pattern=^QA blocks','test/qa-analytics.test.mjs'],{
   env,encoding:'utf8',timeout:5000,
  });
  assert.equal(result.error,undefined,'a missing browser must fail without leaving the fixture server listening');
  assert.equal(result.signal,null);
  assert.equal(result.status,1);
  assert.match(result.stdout+result.stderr,/Executable doesn't exist/);
 } finally {rmSync(folder,{recursive:true,force:true});}
});
