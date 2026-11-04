import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {createQaPage} from './qa-browser.mjs';
import {youtubeVideoId} from '../src/lib/youtube-url.mjs';
export async function verifyCatalogueVideo({base='https://abvx.xyz',route,videoUrl,output}){
 const id=youtubeVideoId(videoUrl);assert.ok(id);const browser=await chromium.launch({headless:true}),checks=[];
 try{for(const width of [1280,390]){const page=await createQaPage(browser,{viewport:{width,height:900}}),url=new URL(route,base);const response=await page.goto(url.href,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);let scope=page.locator('main');if(url.hash){const anchor=page.locator('[id="'+url.hash.slice(1)+'"]');scope=anchor.locator('xpath=ancestor-or-self::section[1]');}const frame=scope.locator(`iframe[src^="https://www.youtube-nocookie.com/embed/${id}?"]`);assert.equal(await frame.count(),1);await frame.scrollIntoViewIfNeeded();assert.equal(await frame.isVisible(),true);assert.ok((await frame.getAttribute('title'))?.trim());assert.equal(await frame.getAttribute('loading'),'lazy');assert.equal(await frame.getAttribute('referrerpolicy'),'strict-origin-when-cross-origin');const figure=frame.locator('xpath=ancestor::figure[1]');assert.equal(await figure.locator('a').filter({hasText:/YouTube/i}).count(),1);const href=await figure.locator('a').getAttribute('href');assert.equal(youtubeVideoId(href),id);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' width '+width+' must not overflow');checks.push({width,videoId:id,player:true,fallback:true,overflow:false});await page.close();}}finally{await browser.close();}
 const result={status:'VIDEO_PLAYER_VERIFIED',observedAt:new Date().toISOString(),route,checks};if(output)writeFileSync(output,JSON.stringify(result,null,2)+'\n',{mode:0o600});return result;
}
