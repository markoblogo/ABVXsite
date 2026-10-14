import assert from 'node:assert/strict';

// Runs in a browser against inert server HTML, without executing page scripts.
export function readSeoDocument(html) {
 const doc=new DOMParser().parseFromString(html,'text/html');
 const jsonld=[...doc.querySelectorAll('script[type="application/ld+json"]')].map(script=>{
  try { return JSON.parse(script.textContent); } catch { return null; }
 });
 return {title:doc.title,description:doc.querySelector('meta[name="description"]')?.content,
  canonical:[...doc.querySelectorAll('link[rel="canonical"]')].map(link=>link.getAttribute('href')),
  robots:[...doc.querySelectorAll('meta[name="robots"],meta[name="googlebot"]')].map(meta=>meta.content).join(','),
  h1:doc.querySelectorAll('h1').length,lang:doc.documentElement.lang,jsonld,
  alternates:[...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map(link=>[link.hreflang,link.getAttribute('href')]),
  links:[...doc.querySelectorAll('a[href]')].map(link=>link.getAttribute('href'))};
}
export function assertSeoPage(record,url,headerRobots='') {
 assert.ok(record.title?.trim(),url+' missing title');
 assert.ok(record.description?.trim(),url+' missing description');
 assert.equal(record.canonical.length,1,url+' canonical count');
 assert.equal(new URL(record.canonical[0]).href,new URL(url).href,url+' noncanonical sitemap page');
 assert.doesNotMatch(record.robots+','+headerRobots,/\b(?:noindex|none)\b/i,url+' excluded from indexing');
 assert.equal(record.h1,1,url+' heading count');assert.ok(record.lang,url+' missing language');
 assert.ok(record.jsonld.every(value=>value&&typeof value==='object'),url+' invalid JSON-LD');
}
