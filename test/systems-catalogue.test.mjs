import test from 'node:test';
import assert from 'node:assert/strict';
import { systemsGroupSlugs, isStandaloneUtilityGroup } from '../src/lib/systems-catalogue.mjs';
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

test('standalone subgroup and legacy ecosystem share machine-discovery classification', () => {
 assert.equal(isStandaloneUtilityGroup('Standalone Utilities'),true);
 assert.equal(isStandaloneUtilityGroup('Standalone Utilities & Experiments'),true);
 assert.equal(isStandaloneUtilityGroup('Personal AI systems'),false);
 assert.equal(isStandaloneUtilityGroup(undefined),false);
});

test('new workflow tools opt in without moving a project pinned to another subgroup', () => {
 const group={title:'Workflow & Orchestration',slugs:['set','agents-md-generator']};
 const items=[{slug:'framewright',group:group.title,sortRank:125},{slug:'git-tweet',group:group.title},{slug:'set',group:group.title}];
 assert.deepEqual(systemsGroupSlugs(group,items,new Set(['set','agents-md-generator','git-tweet'])),['set','agents-md-generator','framewright']);
 assert.deepEqual(group.slugs,['set','agents-md-generator']);
});

test('metadata registration works for every existing group without moving pinned members',()=>{
 const group={title:'Development Surfaces & Interfaces',slugs:['existing']};
 assert.deepEqual(systemsGroupSlugs(group,[{slug:'new',group:group.title},{slug:'pinned-elsewhere',group:group.title}],new Set(['existing','pinned-elsewhere'])),['existing','new']);
});
