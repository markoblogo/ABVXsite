import assert from 'node:assert/strict';
import test from 'node:test';
import { selectLatestSectionEntry } from '../src/content/latest-selection.mjs';

const items = [
  { slug: 'old-system', title: 'Old System', appearsIn: ['systems'], primarySection: 'systems', publishedAt: '2026-06-01', sortRank: 1 },
  { slug: 'blue-jay-vodka', title: 'Blue Jay Vodka', appearsIn: ['systems'], primarySection: 'systems', publishedAt: '2026-07-14', sortRank: 350 },
  { slug: 'cropto', title: 'Cropto', appearsIn: ['focus', 'systems'], primarySection: 'focus', updatedAt: '2026-07-15', sortRank: 10 },
];

test('selects the newest item actually shown in a section', () => {
  assert.equal(selectLatestSectionEntry(items, 'focus')?.slug, 'cropto');
  assert.equal(selectLatestSectionEntry(items, 'systems')?.slug, 'cropto');
});

test('can exclude an item only when the caller explicitly needs a unique card', () => {
  assert.equal(selectLatestSectionEntry(items, 'systems', 'cropto')?.slug, 'blue-jay-vodka');
});
