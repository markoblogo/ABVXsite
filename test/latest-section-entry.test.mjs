import assert from 'node:assert/strict';
import test from 'node:test';
import { selectLatestSectionEntry } from '../src/content/latest-selection.mjs';
import {registerCatalogueItems, validateCatalogueDiscovery, withCatalogueTimes} from '../src/content/catalogue-chronology.mjs';

const items = [
  { slug: 'old-system', title: 'Old System', appearsIn: ['systems'], primarySection: 'systems', publishedAt: '2026-06-01', sortRank: 1 },
  { slug: 'blue-jay-vodka', title: 'Blue Jay Vodka', appearsIn: ['systems'], primarySection: 'systems', publishedAt: '2026-07-14', sortRank: 350 },
  { slug: 'cropto', title: 'Cropto', appearsIn: ['focus', 'systems'], primarySection: 'focus', publishedAt: '2026-05-06', updatedAt: '2026-07-15', sortRank: 10 },
];

test('selects the newest item actually shown in a section', () => {
  assert.equal(selectLatestSectionEntry(items, 'focus')?.slug, 'cropto');
  assert.equal(selectLatestSectionEntry(items, 'systems')?.slug, 'blue-jay-vodka');
});

test('old product edits and releases cannot replace a newer catalogue addition', () => {
  const edited = {...items[0], updatedAt:'2026-10-10', status:'released', sortRank:0};
  assert.equal(selectLatestSectionEntry([edited,...items.slice(1)],'systems')?.slug,'blue-jay-vodka');
});

test('first registration stays immutable through edits, repeated builds and removal', () => {
  const initial = [{kind:'work',slug:'one',publishedAt:'2020-01-01'}];
  const first = registerCatalogueItems({version:1,items:[]},initial,{now:'2026-10-09T00:00:00.000Z'});
  const next = registerCatalogueItems(first,[{...initial[0],publishedAt:'2026-10-10',updatedAt:'2026-10-10'},{kind:'work',slug:'two'}],{now:'2026-10-10T00:00:00.000Z'});
  assert.equal(next.items[0].addedAt,first.items[0].addedAt);
  assert.equal(next.items[1].addedAt,'2026-10-10T00:00:00.000Z');
  assert.deepEqual(registerCatalogueItems(next,[],{now:'2026-10-11T00:00:00.000Z'}),next);
  assert.deepEqual(registerCatalogueItems(next,initial,{now:'2026-10-11T00:00:00.000Z'}),next);
});

test('legacy unknown dates do not invent freshness; new items receive observed first times', () => {
  const legacy = registerCatalogueItems({version:1,items:[]},[{kind:'books',slug:'legacy'}],{now:'2026-10-09T00:00:00.000Z',bootstrap:true});
  assert.equal(legacy.items[0].addedAt,null);
  assert.equal(legacy.items[0].basis,'legacy-unknown');
  const updated = registerCatalogueItems(legacy,[{kind:'books',slug:'new-book'}],{now:'2026-10-10T00:00:00.000Z'});
  const books = [{slug:'legacy',title:'Legacy',appearsIn:['books'],sortRank:0,updatedAt:'2026-10-10'}, {slug:'new-book',title:'New',appearsIn:['books'],sortRank:999}];
  assert.equal(selectLatestSectionEntry(withCatalogueTimes(books,'books',updated),'books')?.slug,'new-book');
  assert.equal(selectLatestSectionEntry(withCatalogueTimes([books[0]],'books',legacy),'books'),undefined);
});

test('catalogue registration validates unique identities and normalized, nonfuture UTC dates', () => {
  const record = {kind:'work',slug:'one',addedAt:'2026-10-09T00:00:00.000Z',basis:'observed'};
  assert.deepEqual(validateCatalogueDiscovery({version:1,items:[record]},Date.parse('2026-10-10')),[]);
  for (const patch of [{addedAt:'bad'}, {addedAt:'2026-10-09T02:00:00+02:00'}, {addedAt:'2026-10-11T00:00:00.000Z'}, {addedAt:null}, {kind:'private'}, {slug:'../secret'}]) {
    assert.ok(validateCatalogueDiscovery({version:1,items:[{...record,...patch}]},Date.parse('2026-10-10')).length);
  }
  assert.ok(validateCatalogueDiscovery({version:1,items:[record,record]}).length);
});

test('can exclude an item only when the caller explicitly needs a unique card', () => {
  assert.equal(selectLatestSectionEntry(items, 'systems', 'cropto')?.slug, 'blue-jay-vodka');
});

test('does not require a manual homepage flag for a newly published section item', () => {
  const newerItem = {
    slug: 'pictiq-landing',
    title: 'Pictiq site',
    appearsIn: ['systems', 'books'],
    primarySection: 'systems',
    publishedAt: '2026-09-20',
    homepageEligible: false,
    sortRank: 185,
  };

  assert.equal(selectLatestSectionEntry([...items, newerItem], 'systems')?.slug, 'pictiq-landing');
});
