import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function load(file){
 const filename=path.resolve(file);
 if(filename.endsWith('.mjs'))return require(filename);
 const compiled=ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const loaded={exports:{}};
 new Function('require','module','exports',compiled)(name=>name.startsWith('.')?load(path.resolve(path.dirname(filename),name+(path.extname(name)?'':'.tsx'))):require(name),loaded,loaded.exports);
 return loaded.exports;
}
const render=(name,props)=>renderToStaticMarkup(createElement(load('src/components/'+name+'.tsx').default,props));
const row=(html,name)=>html.match(new RegExp('aria-label="'+name+'"[^>]*>([\\s\\S]*?)</div>'))?.[1]||'';
test('book detail and catalogue separate buying/downloading from supporting links before limiting',()=>{
 const links=[{type:'site',label:'Book site',url:'https://example.com/'},{type:'youtube',label:'Game trailer',url:'https://youtu.be/aaaaaaaaaaa'},{type:'kindle',label:'Kindle',url:'https://amazon.com/kindle'},{type:'paperback',label:'Paperback',url:'https://amazon.com/paperback'},{type:'pdf',label:'PDF',url:'https://example.com/book.pdf'}];
 const before=JSON.stringify(links);
 for(const [name,extra]of [['BookActionLinks',{}],['ActionLinks',{kind:'book',limit:4,compact:true}]]){
  const html=render(name,{links,...extra});const primary=row(html,'Primary actions'),secondary=row(html,'More links');
  for(const url of ['/kindle','/paperback','book.pdf'])assert.ok(primary.includes(url),name+' missing primary '+url);
  assert.ok(!primary.includes('youtu.be')&&!primary.includes('Book site'));
  assert.ok(secondary.includes('https://example.com/'));assert.ok(html.indexOf(primary)<html.indexOf(secondary));
  assert.equal((html.match(/<a /g)||[]).length,extra.limit||links.length);
  assert.equal((html.match(/rel="noopener noreferrer"/g)||[]).length,extra.limit||links.length);
 }
 assert.equal(JSON.stringify(links),before);
});
test('project main actions precede smaller supporting links and a repository-only tool remains usable',()=>{
 const links=[{type:'youtube',label:'Walkthrough',url:'https://youtu.be/aaaaaaaaaaa'},{type:'github',label:'GitHub',url:'https://github.com/org/tool'},{type:'site',label:'Site',url:'https://example.com/'}];
 for(const name of ['WorkActionLinks','ActionLinks']){
  const html=render(name,{links});assert.ok(row(html,'Primary actions').includes('https://example.com/'));assert.ok(row(html,'More links').includes('https://github.com/org/tool'));assert.ok(row(html,'More links').includes('Walkthrough'));
  assert.ok(row(render(name,{links:[links[1]]}),'Primary actions').includes('https://github.com/org/tool'));
 }
 assert.equal(render('BookActionLinks',{links:[]}), '');
});

test('catalogue gallery renders all ten distinct labelled videos lazily and keeps each original fallback',()=>{
 const {YouTubeGallery}=load('src/components/YouTubeEmbed.tsx');
 const videos=Array.from({length:10},(_,i)=>({type:'youtube',label:i===0?'Book trailer':i===1?'Game trailer':'Walkthrough '+(i+1),url:'https://youtu.be/'+String(i+1).padStart(11,'0')}));
 const links=[{type:'youtube',label:'Channel',url:'https://www.youtube.com/@channel'},...videos,{...videos[0],url:'https://www.youtube.com/watch?v=00000000001'}];
 const html=renderToStaticMarkup(createElement(YouTubeGallery,{links,title:'Example book'}));
 assert.equal((html.match(/<iframe/g)||[]).length,10);assert.equal((html.match(/loading="lazy"/g)||[]).length,10);
 for(const video of videos){assert.ok(html.includes('href="'+video.url+'"'));assert.ok(html.includes('title="Example book — '+video.label+'"'));}
 assert.ok(html.includes('Book trailer')&&html.includes('Game trailer'));assert.ok(!html.includes('autoplay'));
});
