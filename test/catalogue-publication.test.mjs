import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { planCatalogue } from '../scripts/publish-catalogue.mjs';
import { applyPublications } from '../scripts/publication-media.mjs';
const hash=source=>createHash('sha256').update(source).digest('hex');
function packet(folder='work',patch={}) {
 const data={id:'example',slug:'example',title:'Example',type:folder==='work'?'tool':'book',status:'building',visibility:'public',publishedAt:'2020-01-01',primarySection:folder==='work'?'systems':'books',appearsIn:[folder==='work'?'systems':'books'],summary:'Useful summary',tags:[],links:[{type:'github',label:'Source',url:'https://github.com/example/project'}],seoTitle:'Explicit search title',...patch};
 const body='Author approved product description.';const source='---\n'+JSON.stringify(data)+'\n---\n\n'+body+'\n';
 return {schema_version:'v1',mode:'REPORT_ONLY_HANDOFF',project:'abvxsite',surface:folder,kind:data.type,slug:data.slug,title:data.title,consumer_operation:{id:folder==='work'?'abvx.publish-project':'abvx.publish-book'},payload:{source_markdown:source,source_sha256:hash(source),body_lines:[body],date_published:data.publishedAt,media_assets:[]}};
}
test('catalogue publication preserves approved types, SEO, links and prose byte for byte',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-catalogue-'));
 try {
  for(const folder of ['work','books']) {
   const value=packet(folder);const plan=planCatalogue(value,root);assert.equal(plan.source,value.payload.source_markdown);
   applyPublications([plan]);assert.ok(existsSync(path.join(root,'content',folder,'example.md')));assert.throws(()=>planCatalogue(value,root),/overwrite/);
  }
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('unsigned sources, source conflicts, unsupported placement and unapproved media fail before writes',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-catalogue-block-'));
 try {
  for(const value of [packet('work',{visibility:'private'}),packet('work',{publishedAt:'2999-01-01'}),packet('work',{primarySection:'focus'}),packet('work',{type:'new-type'}),packet('work',{media:{src:'/media/cover.png',alt:'Cover',width:1,height:1}})]) assert.throws(()=>planCatalogue(value,root));
  const changed=packet();changed.payload.source_sha256='0'.repeat(64);assert.throws(()=>planCatalogue(changed,root),/hash/);
  const legacy=packet();delete legacy.payload.source_markdown;assert.throws(()=>planCatalogue(legacy,root),/approved/);
  const conflict=packet();conflict.title='Different';assert.throws(()=>planCatalogue(conflict,root),/conflicts/);
  assert.equal(existsSync(path.join(root,'content')),false);
 }finally{rmSync(root,{recursive:true,force:true});}
});
