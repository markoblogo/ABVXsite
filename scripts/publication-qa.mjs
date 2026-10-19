import { readSeoDocument, assertSeoPage } from './seo-page-contract.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { withQaServer } from './qa-server.mjs';
import { catalogueCardVideoId } from './catalogue-video.mjs';
import { contentFiles, parseContentFile } from './content-lib.mjs';
import { catalogueHubs } from './publication-scope.mjs';
import { isAllowedAudioUrl } from '../src/lib/media-policy.mjs';
import {findYouTubeVideos} from '../src/lib/youtube-url.mjs';

export function internalPagePaths(hrefs,base='https://abvx.xyz') {
 const origin=new URL(base).origin;
 const paths=new Set();
 for(const href of hrefs) {
  const url=new URL(href,base);
  if(url.origin===origin&&!/\.(?:pdf|epub|png|jpe?g|webp|avif|gif|svg|ico|zip|mp4|mp3|m4b|m4a|ogg|wav|flac|aac|opus|webm)$/i.test(url.pathname)) paths.add(url.pathname);
 }
 return [...paths];
}
// Binary downloads need link availability proof, not a buffered body transfer.
export async function assertInternalLink(request, url) {
 const method = internalPagePaths([url], url).length ? 'get' : 'head';
 const response = await request[method](url);
 try { assert.ok(response.status() >= 200 && response.status() < 400, url + ' broken internal link'); }
 finally { await response.dispose(); }
}
export async function checkInternalLinks(request, hrefs, sourceUrl, requestBase = sourceUrl) {
 const origin = new URL(sourceUrl).origin;
 const targets = new Set(hrefs.map(href => new URL(href, sourceUrl)).filter(url => url.origin === origin).map(url => url.pathname + url.search));
 await boundedMap([...targets], target => assertInternalLink(request, new URL(target, requestBase).href));
}
export async function boundedMap(values, fn, concurrency=6) {
 let next=0;
 await Promise.all(Array.from({length:Math.min(concurrency,values.length)},async()=>{
  while(next<values.length) {const i=next++;await fn(values[i],i);}
 }));
}
export function assertCatalogueVideo(data,frames,folder='work') {
 for(const video of findYouTubeVideos(data.links||[])){
 const id=catalogueCardVideoId(video.url,folder);
 assert.ok(frames.some(frame=>typeof frame.src==='string'&&frame.src.match(/^https:\/\/www\.youtube-nocookie\.com\/embed\/([\w-]{11})(?:[?#]|$)/)?.[1]===id&&frame.title?.trim()&&frame.loading==='lazy'&&frame.referrerPolicy==='strict-origin-when-cross-origin'),'exact lazy privacy-enhanced catalogue video and accessible title: '+video.url);
 }
}
export function assertCatalogueImage(data,images) {
 const image=data.heroImage||data.media||data.coverImage;
 if(!image)return;
 assert.ok(images.some(rendered=>{
  const url=new URL(rendered.src,'https://abvx.xyz');
  const src=url.pathname==='/_next/image'?url.searchParams.get('url'):rendered.src;
  return src===image.src&&rendered.loaded;
 }),'requested catalogue image must render successfully');
}
export async function assertCatalogueDownloads(request,data,base,folder='work') {
 const audio=folder==='books'&&data.type!=='series'?(data.links||[]).find(link=>link.type==='audio'):null;
 assert.ok(!audio||isAllowedAudioUrl(audio.url),'playable book audio is blocked by media CSP');
 await boundedMap((data.links||[]).filter(link=>['pdf','epub','audio','audiobook'].includes(link.type)),async link=>{
  const url=new URL(link.url,'https://abvx.xyz');
  const target=url.origin==='https://abvx.xyz'?new URL(url.pathname+url.search,base).href:url.href;
  const response=await request.head(target);
  try{
   assert.ok(response.status()>=200&&response.status()<400,target+' catalogue media unavailable');
   if(link===audio)assert.ok(isAllowedAudioUrl(response.url(),base)||isAllowedAudioUrl(response.url()),'playable audio redirect is blocked by media CSP');
  }
  finally{await response.dispose();}
 });
}
export async function publicationQa(scope) {
 assert.ok(['publication-v1','catalogue-v1'].includes(scope.profile));assert.ok(scope.routes.length);
 const sources=[...contentFiles('writing'),...contentFiles('working-stories'),...contentFiles('work'),...contentFiles('books'),...contentFiles('series')].map(file=>{
  const folder=file.replaceAll('\\','/').split('/').at(-2);
  return {...parseContentFile(file),folder:folder==='series'?'books':folder};
 });
 await withQaServer(async base=>{
  const browser=await chromium.launch({headless:true});
  try {
   const page=await browser.newPage();
   const get=async route=>{const res=await page.request.get(base+route,{timeout:30_000});assert.equal(res.status(),200,route);return res;};
   const [xml,index,llms]=await Promise.all([get('/sitemap.xml').then(r=>r.text()),get('/content-index.json').then(r=>r.json()),get('/llms.txt').then(r=>r.text())]);
   const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
   assert.equal(new Set(urls).size,urls.length,'duplicate sitemap URL');
   assert.equal(new Set(index.items.map(item=>item.canonicalUrl)).size,index.items.length,'duplicate index URL');
   const hubHtml=new Map();
   await boundedMap(scope.hubs,async route=>{
    const html=await (await get(route)).text();assert.match(html,/<h1[\s>]/,route+' heading');
    hubHtml.set(route,html);
    const canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
    assert.ok(canonical,route+' canonical');
    assert.equal(new URL(canonical).href,new URL('https://abvx.xyz'+route).href,route+' canonical');
   });
   for(const route of scope.routes) {
    const url='https://abvx.xyz'+route;
    assert.ok(urls.includes(url),route+' sitemap');
    assert.ok(index.items.some(item=>item.canonicalUrl===url),route+' index');
    assert.ok(llms.includes('URL: '+url+'\n'),route+' LLM index');
    const source=sources.find(({data,folder})=>route===(scope.profile==='catalogue-v1'?(data.canonicalPath||`/${folder}/${data.slug}`):`/writing/${data.type==='working-story'?'working-stories/':''}${data.slug}`));
    assert.ok(source,route+' source');const {data}=source;
    const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:30_000});
    assert.equal(response.status(),200,route);assert.equal(new URL(page.url()).pathname,route,'unexpected redirect');
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),url);
    assert.equal((await page.locator('h1').textContent()).trim(),source.folder==='books'?(data.displayTitle||data.shortTitle||data.title):data.title);
    assert.ok(await page.title(),route+' title');
    assertSeoPage(await page.evaluate(readSeoDocument,await response.text()),url,response.headers()['x-robots-tag']);
    const main=await page.locator('main').innerText();
    const schema=await page.locator('script[type="application/ld+json"]').allTextContents();
    const objects=schema.flatMap(text=>{const value=JSON.parse(text);return value['@graph']||[value];});
    const recipe=objects.find(item=>item['@type']==='Recipe');
    if(data.type==='recipe') {
     assert.ok(recipe,route+' Recipe');assert.deepEqual(recipe.recipeIngredient,data.recipe.ingredients.map(i=>`${i.quantityText} ${i.name}`));
     for(const ingredient of recipe.recipeIngredient) assert.ok(main.includes(ingredient),route+' ingredient');
     assert.equal(await page.locator('main a[href="/writing/kitchen-notes"]').count(),1,'collection navigation');
    }
    if(data.videoUrl) {
     assert.equal(await page.locator('main iframe[src*="youtube-nocookie.com/embed/"]').count(),1,'video embed');
     assert.ok(objects.some(item=>item['@type']==='VideoObject'&&Number.isFinite(Date.parse(item.uploadDate))),'video metadata');
    }
    if(scope.profile==='catalogue-v1') {
     const type=source.folder==='books'?(data.type==='series'?'CreativeWorkSeries':'Book'):undefined;
     assert.ok(objects.some(item=>item.url===url && (!type||item['@type']===type)),route+' entity metadata');
     assertCatalogueVideo(data,await page.locator('main iframe').evaluateAll(frames=>frames.map(frame=>({src:frame.getAttribute('src'),title:frame.getAttribute('title'),loading:frame.getAttribute('loading'),referrerPolicy:frame.getAttribute('referrerpolicy')}))),source.folder);
     for(const link of data.links||[]) assert.ok(await page.locator('main a').evaluateAll((links,url)=>links.some(a=>a.getAttribute('href')===url),link.url),route+' outbound link');
     const image=data.heroImage||data.media||data.coverImage;
     if(image){
      await page.waitForFunction(src=>[...document.querySelectorAll('main img')].some(img=>{
       const url=new URL(img.getAttribute('src'),location.href);
       return (url.pathname==='/_next/image'?url.searchParams.get('url'):img.getAttribute('src'))===src&&img.complete&&img.naturalWidth>0;
      }),image.src);
      assertCatalogueImage(data,await page.locator('main img').evaluateAll(images=>images.map(img=>({src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0}))));
     }
     await assertCatalogueDownloads(page.request,data,base,source.folder);
     if(source.folder==='books'&&data.type!=='series'&&data.links?.some(link=>link.type==='audio')){
      assert.equal(await page.locator('audio').getAttribute('src'),null,'audio must remain opt-in');
      assert.equal(await page.locator('audio').getAttribute('preload'),'none');
     }
     for(const hub of catalogueHubs(data,source.folder)||[])assert.ok(hubHtml.get(hub)?.includes(`href="${route}"`),route+' missing from '+hub);
    }
    const internal=await page.locator('main a[href]').evaluateAll(links=>links.map(a=>a.getAttribute('href')));
    await checkInternalLinks(page.request, internal, url, base);
    const images=await page.locator('main img').evaluateAll(imgs=>imgs.map(img=>img.getAttribute('src')).filter(Boolean));
    await boundedMap([...new Set(images)].filter(src=>src.startsWith('/')),async src=>{await get(src);});
    for(const width of [320,390,1280]) {
     await page.setViewportSize({width,height:900});
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),route+' overflow');
    }
    const collection=scope.profile==='catalogue-v1'?'/'+(data.primarySection||(source.folder==='books'?'books':'systems')):data.type==='working-story'?'/writing/working-stories':data.collection==='kitchen-notes'?'/writing/kitchen-notes':'/writing';
    const hub=await (await get(collection)).text();assert.ok(hub.includes(`href="${route}"`),route+' collection link');
   }
   console.log(`Publication QA passed: ${scope.routes.length} materials, ${scope.hubs.length} hubs, media, metadata, mobile and public indexes. Scope: ${JSON.stringify(scope)}`);
  } finally {await browser.close();}
 });
}
