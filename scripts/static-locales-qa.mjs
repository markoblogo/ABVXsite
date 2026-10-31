import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {staticPaths,staticLocales,localizedPath,staticAlternates} from '../src/lib/static-locales.mjs';
const seo=JSON.parse(readFileSync('content/static-pages.json','utf8'));
export async function checkStaticLocales(page,base){
 const titles=new Set();
 const preserved={};
 const englishText={};
 for(const path of staticPaths)for(const locale of staticLocales){
  const route=localizedPath(path,locale);
  // Direct HTTP loads prove SSR language without relying on the client effect.
  const response=await page.request.get(base+route);
  assert.equal(response.status(),200,route);
  const html=await response.text();assert.match(html,new RegExp(`<html[^>]+lang="${locale}"`),route+' SSR language');
  await page.goto(base+route,{waitUntil:'domcontentloaded'});
  const title=await page.title();assert.ok(title.startsWith(seo[path][locale][0]),route+' title');titles.add(title);
  assert.equal(await page.locator('html').getAttribute('lang'),locale);
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).href,new URL('https://abvx.xyz'+route).href);
  for(const [language,href] of Object.entries(staticAlternates(path)))assert.equal(new URL(await page.locator(`link[rel="alternate"][hreflang="${language}"]`).getAttribute('href')).href,new URL(href).href);
  assert.equal(await page.locator('.site-languages a').count(),3);
  assert.equal(await page.locator('.site-languages a[aria-current="page"]').innerText(),locale.toUpperCase());
  // Catalogue/library blocks must retain exact source text and original URLs.
  const blocks=await page.locator('main [lang="en"]').evaluateAll(nodes=>nodes.map(node=>({text:node.textContent.replace(/\s+/g,' ').trim(),links:[...node.querySelectorAll('a')].map(a=>a.getAttribute('href'))})));
  if(locale==='en')preserved[path]=blocks;else assert.deepEqual(blocks,preserved[path],route+' untranslated blocks');
  const textNodes=await page.locator('main').evaluate(main=>{const out=[];const walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){if(node.parentElement.closest('[lang="en"],script'))continue;const text=node.textContent.replace(/\s+/g,' ').trim();if(text.length>16&&!/^[\w-]+\.(json|txt)$/.test(text))out.push(text);}return out;});
  if(locale==='en')englishText[path]=textNodes;else for(const text of textNodes)assert.ok(!englishText[path].includes(text),route+' untranslated static copy: '+text);

  if(locale!=='en')assert.notEqual(await page.locator('h1').innerText(),{'/':'From an idea to something that works.','/about':'Marketing, creative direction and product experience.','/work-with-me':'Marketing, creative direction and product thinking. With the ability to build.'}[path]);
  for(const width of [390,768,1440]){
   await page.setViewportSize({width,height:1000});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow '+width);
   const identity=await page.locator('.site-header__identity').boundingBox();const selector=await page.locator('.site-languages').boundingBox();
   assert.ok(selector.x>=identity.x&&selector.x+selector.width<=identity.x+identity.width+1,route+' selector outside identity');
  }
 }
 assert.equal(titles.size,9);
 await page.goto(base+'/fr/about',{waitUntil:'domcontentloaded'});
 await page.locator('.site-languages a[hreflang="uk"]').click();await page.waitForURL(base+'/uk/about');await page.waitForFunction(()=>document.documentElement.lang==='uk');
 assert.equal(await page.locator('html').getAttribute('lang'),'uk');
 await page.locator('.site-nav a[href="/uk/work-with-me"]').click();await page.waitForURL(base+'/uk/work-with-me');await page.waitForFunction(()=>document.documentElement.lang==='uk');
 assert.equal(await page.locator('html').getAttribute('lang'),'uk');
 await page.locator('.site-nav a[href="/systems"]').click();await page.waitForURL(base+'/systems');await page.waitForFunction(()=>document.documentElement.lang==='en');
 assert.equal(await page.locator('.site-languages').count(),0);
 assert.equal(await page.locator('html').getAttribute('lang'),'en');
 console.log('Static locales PASS: nine SSR pages, reciprocal alternates, preserved blocks, client navigation and 27 responsive layouts.');
}
