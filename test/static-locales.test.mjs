import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {staticPaths,staticLocales,localizedPath,staticLocation,staticAlternates} from '../src/lib/static-locales.mjs';
const copy=JSON.parse(readFileSync('src/content/static-translations.json','utf8'));
const seo=JSON.parse(readFileSync('content/static-pages.json','utf8'));
test('only three static pages have reciprocal, self-including locale routes',()=>{
 const routes=new Set();
 for(const path of staticPaths)for(const locale of staticLocales){
  const url=localizedPath(path,locale);routes.add(url);
  assert.deepEqual(staticLocation(url),{locale,path});
  assert.equal(staticAlternates(path)[locale],'https://abvx.xyz'+url);
  assert.equal(staticAlternates(path)['x-default'],'https://abvx.xyz'+path);
  assert.equal(seo[path][locale].length,2);
  assert.ok(seo[path][locale].every(s=>s.length>35));
 }
 assert.equal(routes.size,9);
 for(const path of ['/books','/work/framewright','/writing','/fr/ami','/uk/books','/about/extra']){
  assert.equal(staticLocation(path),null);
  assert.equal(localizedPath(path,'fr'),path);
 }
});
test('both translations cover every declared static copy entry without empty fallbacks',()=>{
 for(const [english,variants] of Object.entries(copy))for(const locale of ['fr','uk']){
  assert.equal(typeof variants[locale],'string',english);
  assert.ok(variants[locale].trim(),english);
 }
 assert.ok(Object.keys(copy).length>100);
});
