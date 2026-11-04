import {test} from 'node:test';import assert from 'node:assert/strict';
import {bookLocaleErrors,bookLocaleAlternates,localizedBookDescription} from '../src/lib/book-locales.mjs';
const c={summary:'French description',body:'Full description',seoTitle:'Title',seoDescription:'Description'};
const book={type:'book',slug:'a-book',language:'fr',descriptionLocales:{en:{...c,summary:'English description'},fr:c}};
test('one edition keeps French book language with English descriptive copy',()=>{const v=localizedBookDescription(book);assert.equal(v.summary,'English description');assert.equal(v.language,'fr');assert.equal(v.slug,book.slug);assert.equal(bookLocaleErrors(book).length,0)});
test('reciprocal canonicals cover English and French without duplicate records',()=>assert.deepEqual(bookLocaleAlternates(book),{en:'https://abvx.xyz/books/a-book',fr:'https://abvx.xyz/fr/books/a-book','x-default':'https://abvx.xyz/books/a-book'}));
test('reject incomplete or unsafe locale payload shapes',()=>{for(const descriptionLocales of [[],{en:c},{en:c,fr:{...c,body:''}},{en:c,fr:c,de:c}])assert.ok(bookLocaleErrors({...book,descriptionLocales}).length);assert.deepEqual(bookLocaleErrors({type:'book'}),[])});
