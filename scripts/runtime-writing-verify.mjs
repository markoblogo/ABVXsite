import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {createQaPage} from './qa-browser.mjs';
import {parseMarkdownSource} from '../src/content/markdown-source.mjs';
import {digest} from '../src/content/runtime-writing.mjs';
import {writingImages} from '../src/content/runtime-writing-media.mjs';
const plain=value=>value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export async function verifyRuntimeWriting({base,receipt,command,output}){
 const production=new URL(base).origin==='https://abvx.xyz';
 assert.equal(receipt.status,'STORED');assert.equal(receipt.requestId,command.requestId);
 if(production)assert.match(receipt.engineVersion,/^[a-f0-9]{64}$/,'released engine fingerprint required');
 const {data,body}=parseMarkdownSource(command.source||'');
 assert.equal(receipt.originalSourceSha256,digest(command.source));
 const route=new URL(receipt.canonicalUrl).pathname,auth={authorization:'Bearer '+process.env.RUNTIME_WRITING_PUBLISH_TOKEN};
 const current=async()=>{const res=await fetch(new URL('/api/writing/manage',base),{headers:auth,signal:AbortSignal.timeout(30_000)});assert.equal(res.status,200);return res.json();};
 const first=await current();assert.equal(first.records[data.slug].revision,receipt.revision);assert.equal(first.engineVersion,receipt.engineVersion);assert.equal(first.records[data.slug].sourceSha256,receipt.sourceSha256);
 const browser=await chromium.launch({headless:true});let checks;
 try{
  const page=await createQaPage(browser),response=await page.goto(base+route,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  assert.equal(await page.locator('[data-content-revision]').getAttribute('data-content-revision'),receipt.revision);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),receipt.canonicalUrl);assert.equal((await page.locator('h1').textContent()).trim(),data.title);
  const visible=plain(await page.locator('.native-writing-article__body').innerText());let cursor=0;
  for(const raw of body.split('\n')){
   if(!raw.trim()||/^\s*(?:```[\w-]*|---|\*\*\*)\s*$/.test(raw)||/^https:\/\/www.youtube.com\/watch\?v=/.test(raw.trim()))continue;
   const line=plain(raw.replace(/^\s*(?:#{1,6}|[-*]|\d+[.)])\s+/,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1'));
   if(!line)continue;const index=visible.indexOf(line,cursor);assert.ok(index>=0,'Authored line missing or out of order: '+line.slice(0,60));cursor=index+line.length;
  }
  for(const image of writingImages(data)){
   const src=receipt.mediaMapping.find(x=>x.from===image.src)?.to||image.src;
   const img=page.getByRole('img',{name:image.alt,exact:true}).first();await img.scrollIntoViewIfNeeded();
   await img.evaluate(node=>node.decode());
   assert.ok(await img.evaluate((node,expected)=>{const url=new URL(node.getAttribute('src'),location.href);return node.naturalWidth>0&&(url.pathname==='/_next/image'?url.searchParams.get('url'):node.getAttribute('src'))===expected;},src), 'Image source mismatch: '+await img.getAttribute('src')+' expected '+src);
   if(image.caption)assert.ok((await page.locator('main').innerText()).includes(image.caption));
  }
  for(const width of [1280,390]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile/desktop overflow');}
  const fetchPublic=async path=>{const r=await fetch(base+path,{signal:AbortSignal.timeout(30_000)});assert.equal(r.status,200,path);return r.text();};
  const [index,xml,llms,hub,search]=await Promise.all(['/content-index.json','/sitemap.xml','/llms.txt','/writing/archive','/writing?q='+encodeURIComponent(data.title)].map(fetchPublic));
  assert.equal(JSON.parse(index).items.filter(x=>x.canonicalUrl===receipt.canonicalUrl).length,1);assert.ok(xml.includes('<loc>'+receipt.canonicalUrl+'</loc>'));assert.ok(llms.includes('URL: '+receipt.canonicalUrl+'\n'));assert.ok(hub.includes(route));assert.ok(search.includes(route));
  const last=await current();assert.equal(last.records[data.slug].revision,receipt.revision);assert.equal(last.engineVersion,receipt.engineVersion);
  checks={authoredText:'PASS',canonical:'PASS',revision:'PASS',media:'PASS',discovery:'PASS',search:'PASS',mobile:'PASS'};
 }finally{await browser.close();}
 const result={schemaVersion:1,profile:'runtime-writing-v1',status:production?'PUBLISHED_VERIFIED':'TEST_VERIFIED',receipt,verifiedAt:new Date().toISOString(),base,checks,commandSha256:digest(JSON.stringify(command))};
 if(output)writeFileSync(output,JSON.stringify(result,null,2)+'\n',{mode:0o600});return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=Object.fromEntries(process.argv.slice(2).reduce((a,x,i,all)=>i%2?a:[...a,[x.replace(/^--/,''),all[i+1]]],[]));
 verifyRuntimeWriting({base:args.base||'https://abvx.xyz',receipt:JSON.parse(readFileSync(args.receipt)),command:JSON.parse(readFileSync(args.command)),output:args.output}).then(x=>console.log(JSON.stringify({status:x.status,revision:x.receipt.revision}))).catch(e=>{console.error(e.message);process.exitCode=1;});
}
