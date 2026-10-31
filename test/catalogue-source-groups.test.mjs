import test from 'node:test';import assert from 'node:assert/strict';
import {groupCatalogueSources} from '../src/lib/catalogue-source-groups.mjs';
const source=(type,slug,visibility='public')=>'---\n'+JSON.stringify({type,slug,visibility})+'\n---\nOriginal body';
test('request projection retains source bytes, ordering, sections and visibility rules',()=>{
 const book=source('book','one'),work=source('tool','two'),series=source('series','three'),section=source('catalogue-section','four'),unknown=source('unknown','five');
 const result=groupCatalogueSources([book,work,series,section,unknown,source('book','private','private'),source('book','draft','draft')]);
 assert.deepEqual(result.visible,[book,work,series,section,unknown]);assert.deepEqual(result.families,{books:[book],work:[work],series:[series],sections:[section]});assert.equal(result.records.length,5);
});
test('subsequent snapshots cannot reuse withdrawn or edited records',()=>{
 const old=source('book','old'),fresh=source('book','new');groupCatalogueSources([old]);assert.deepEqual(groupCatalogueSources([fresh]).families.books,[fresh]);assert.deepEqual(groupCatalogueSources([]).visible,[]);
});
test('malformed source still fails closed',()=>assert.throws(()=>groupCatalogueSources(['bad'])));
