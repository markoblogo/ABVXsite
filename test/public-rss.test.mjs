import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {rssFeeds, renderRss} from '../src/lib/rss.mjs';
import {renderFeedMarkdown, feedImage, renderFeedRecipe} from '../src/lib/feed-markdown.mjs';
import {writingTopicsFor} from '../src/content/writing-topics.mjs';

test('portable content preserves full text, tables, code, anchors and captions', () => {
  const body = 'Opening **bold** and _emphasis_.\n\n## Home\n\nPreparation.\n\n| A | B |\n|---|---|\n|1|2|\n\n```\n<script>literal</script>\n```\n\n[Related](/writing/related) and [anchor](#home).\n\nThe complete ending.';
  const html = renderFeedMarkdown(body, 'https://abvx.xyz/writing/example', [{src:'/media/photo.webp',alt:'Dish',caption:'Author & archive',afterParagraph:'Preparation.'}]);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>emphasis<\/em>/);
  assert.match(html, /<h2>Home<\/h2>/);
  assert.match(html, /<p>Preparation\.<\/p><figure><img src="https:\/\/abvx.xyz\/media\/photo.webp"/);
  assert.match(html, /<figcaption>Author &amp; archive<\/figcaption>/);
  assert.match(html, /href="https:\/\/abvx.xyz\/writing\/related"/);
  assert.match(html, /href="https:\/\/abvx.xyz\/writing\/example#home"/);
  assert.match(html, /<table>/);
  assert.match(html, /&lt;script&gt;literal/);
  assert.match(html, /The complete ending\./);
  assert.equal((html.match(/<img /g)||[]).length, 1);
  assert.doesNotMatch(html, /next\/image|<script>/);
  assert.equal(feedImage({src:'javascript:alert',alt:'x'},'https://abvx.xyz',null),'');
  assert.doesNotMatch(renderFeedMarkdown('[bad](javascript:alert) <script>x</script>', 'https://abvx.xyz'), /href="javascript:|<script>/);
});

test('RSS escapes XML and CDATA, keeps stable IDs and omits unknown dates', () => {
  const feed=rssFeeds[0], item={title:'A & B <test>',url:'https://abvx.xyz/writing/a',summary:'Text & description',html:'<p>]]> ending</p>',publishedAt:'2026-11-01T10:00:00Z',updatedAt:'2026-11-07T10:00:00Z',categories:['AI & work']};
  const xml=renderRss(feed,[item,{...item,url:item.url+'2',publishedAt:undefined}]);
  assert.match(xml, /A &amp; B &lt;test&gt;/);
  assert.match(xml, /<guid isPermaLink="true">https:\/\/abvx.xyz\/writing\/a<\/guid>/);
  assert.match(xml, /Sun, 01 Nov 2026 10:00:00 GMT/);
  assert.equal((xml.match(/<pubDate>/g)||[]).length,1);
  assert.match(xml, /\]\]\]\]><!\[CDATA\[>/);
  assert.doesNotMatch(xml, /Invalid Date|undefined/);
  assert.equal(rssFeeds.length,8);
});

test('feeds read live sources, overlap topics, exclude withdrawn/private/future content and keep catalogue canonicals', async () => {
  const require=createRequire(import.meta.url);
  let native=[{slug:'one',title:'One',body:'Full first body.',summary:'First',visibility:'public',publishedAt:'2026-01-01',navigationTopics:['psychology','business-work'],coverImage:{src:'/media/one.webp',alt:'One'},recipe:{recipeYield:'2 portions',timingText:'15 minutes',ingredients:[{quantityText:'200 g',name:'ham & radishes'}],instructions:['Mix <gently>.'],variations:['Add herbs.']}}];
  let admitted=['https://abvx.xyz/writing/one','https://abvx.xyz/writing/working-stories/story','https://abvx.xyz/books/custom','https://abvx.xyz/work/project'];
  const story={slug:'story',title:'Story',body:'Full story body.',summary:'Story summary',date:'2026-01-02',type:'working-story',visibility:'public'};
  const mocks={
    './live-writing-discovery':{getLiveWritingIndex:async()=>({items:admitted.map(canonicalUrl=>({canonicalUrl}))})},
    './writing-feed':{getPublishedNativeWritingItems:async()=>native},
    '@/content/working-stories':{getWorkingStories:async()=>[story],workingStoryPath:s=>'/writing/working-stories/'+s.slug},
    './live-catalogue':{getLiveCatalogue:async()=>({getBooks:()=>[{title:'Book',slug:'wrong',canonicalPath:'/books/custom',description:'Entire book description.',summary:'Book',tags:[]}],getArtifactsBySection:section=>{assert.equal(section,'systems');return [{title:'Project',slug:'project',description:'Entire project description.',summary:'Project',tags:[]}];}})},
    '@/content/writing-topics.mjs':{writingTopicsFor},
    './rss.mjs':{rssFeeds,renderRss},
    './feed-markdown.mjs':{renderFeedMarkdown,feedImage,renderFeedRecipe},
    './seo':{SITE_URL:'https://abvx.xyz'},
  };
  const compiled=ts.transpileModule(readFileSync(new URL('../src/lib/public-rss.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const compiledModule={exports:{}};
  new Function('require','module','exports',compiled)(name=>mocks[name]||require(name),compiledModule,compiledModule.exports);
  const {publicRss}=compiledModule.exports;
  assert.match(await publicRss('writing/psychology.xml'), /Full first body/);
  for (const path of ['writing.xml','writing/psychology.xml']) {
    const xml = await publicRss(path);
    assert.match(xml, /Recipe at a glance/);
    assert.match(xml, /2 portions\. 15 minutes/);
    assert.match(xml, /200 g ham &amp; radishes/);
    assert.match(xml, /Mix &lt;gently&gt;\./);
    assert.match(xml, /Add herbs\./);
    assert.equal((xml.match(/Recipe at a glance/g)||[]).length,1);
  }
  assert.match(await publicRss('writing/business-work.xml'), /Full first body/);
  assert.match(await publicRss('writing/business-work.xml'), /Full story body/);
  assert.doesNotMatch(await publicRss('writing/kitchen-notes.xml'), /Full first body/);
  assert.match(await publicRss('books.xml'), /https:\/\/abvx.xyz\/books\/custom/);
  assert.match(await publicRss('projects.xml'), /Entire project description/);
  assert.equal(await publicRss('../private.xml'),null);
  native=[...native,{...native[0],slug:'private',visibility:'private'},{...native[0],slug:'future',publishedAt:'2099-01-01'}];
  admitted.push('https://abvx.xyz/writing/private','https://abvx.xyz/writing/future');
  let xml=await publicRss('writing.xml');
  assert.doesNotMatch(xml, /<link>https:\/\/abvx.xyz\/writing\/(private|future)<\/link>/);
  admitted=admitted.filter(url=>!url.endsWith('/one'));
  xml=await publicRss('writing.xml');
  assert.doesNotMatch(xml,/Full first body/);
  native=[];
  assert.doesNotMatch(await publicRss('writing.xml'),/Full first body/);
});
