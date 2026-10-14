import test from 'node:test';
import assert from 'node:assert/strict';
import { systemsGroupSlugs } from '../src/lib/systems-catalogue.mjs';
test('a new standalone utility joins the catalogue and discovery without page edits', () => {
 const group={title:'Standalone Utilities',slugs:['ytmamp','abvx-shortener']};
 const artifacts=[{slug:'coqpi',group:'Standalone Utilities',sortRank:120},{slug:'other',group:'Commercial Sites & Interfaces'},{slug:'ytmamp',group:'Standalone Utilities'}];
 assert.deepEqual(systemsGroupSlugs(group,artifacts),['ytmamp','abvx-shortener','coqpi']);
 assert.deepEqual(group.slugs,['ytmamp','abvx-shortener']);
});
test('pinned order stays stable and metadata additions sort deterministically', () => {
 const group={title:'Standalone Utilities',slugs:['pinned']};
 const items=[{slug:'z',group:group.title,sortRank:2},{slug:'a',group:group.title,sortRank:2},{slug:'first',group:group.title,sortRank:1}];
 assert.deepEqual(systemsGroupSlugs(group,items),['pinned','first','a','z']);
 assert.deepEqual(systemsGroupSlugs({...group,title:'Other group'},items),['pinned']);
});
