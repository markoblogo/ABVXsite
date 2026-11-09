import assert from 'node:assert/strict';
import test from 'node:test';
import {renderSitemap} from '../src/lib/sitemap-xml.mjs';

test('localized sitemap emits standard fields before extension elements',()=>{
  const xml=renderSitemap([{url:'https://abvx.xyz/books/example',lastModified:new Date('2026-11-01T12:00:00Z'),changeFrequency:'monthly',priority:0.6,alternates:{languages:{en:'https://abvx.xyz/books/example',fr:'https://abvx.xyz/fr/books/example'}}}]);
  assert.match(xml,/<url>\s*<loc>https:\/\/abvx.xyz\/books\/example<\/loc>\s*<lastmod>2026-11-01T12:00:00.000Z<\/lastmod>\s*<changefreq>monthly<\/changefreq>\s*<priority>0.6<\/priority>\s*<xhtml:link/);
  assert.match(xml,/xmlns:xhtml="http:\/\/www.w3.org\/1999\/xhtml"/);
  assert.match(xml,/hreflang="fr" href="https:\/\/abvx.xyz\/fr\/books\/example"/);
});

test('XML text and attributes escape reserved characters',()=>{
  const xml=renderSitemap([{url:'https://abvx.xyz/writing/example?a=1&b=2',alternates:{languages:{en:'https://abvx.xyz/writing/example?a=1&b="two"'}}}]);
  assert.match(xml,/<loc>https:\/\/abvx.xyz\/writing\/example\?a=1&amp;b=2<\/loc>/);
  assert.match(xml,/href="https:\/\/abvx.xyz\/writing\/example\?a=1&amp;b=&quot;two&quot;"/);
});

test('optional values stay optional and zero priority is preserved',()=>{
  const xml=renderSitemap([{url:'https://abvx.xyz/writing/example',priority:0},{url:'https://abvx.xyz/books/example',lastModified:'2026-11-01'}]);
  assert.equal((xml.match(/<url>/g)||[]).length,2);
  assert.match(xml,/<priority>0<\/priority>/);
  assert.match(xml,/<lastmod>2026-11-01<\/lastmod>/);
  assert.ok(!xml.includes('xmlns:xhtml'));
  assert.ok(!xml.includes('undefined'));
});
