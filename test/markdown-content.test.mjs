import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
function loadComponent(name) {
  const compiled = ts.transpileModule(readFileSync(new URL(`../src/components/${name}.tsx`, import.meta.url), 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const compiledModule = { exports: {} };
  const componentRequire = name => name.startsWith('./') ? loadComponent(name.slice(2)) : name.startsWith('../') ? createRequire(new URL('../src/components/YouTubeEmbed.tsx',import.meta.url))(name) : require(name);
  new Function('require', 'module', 'exports', compiled)(componentRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const MarkdownContent = loadComponent('MarkdownContent').default;
const { youtubeVideoId, findYouTubeVideo } = loadComponent('YouTubeEmbed');
const render = (children, props = {}) => renderToStaticMarkup(createElement(MarkdownContent, props, children));

test('renders the publication title with italic inside bold', () => {
  assert.ok(render('**Géo Chkouroupiy, *Jeanne la bataillonneuse : suivi de Miss Adrienne***')
    .includes('<strong>Géo Chkouroupiy, <em>Jeanne la bataillonneuse : suivi de Miss Adrienne</em></strong>'));
});
test('renders emphasis inside link labels', () => {
  assert.ok(render('[**Modernisme ukrainien**](/books/modernisme-ukrainien)')
    .includes('href="/books/modernisme-ukrainien"><strong>Modernisme ukrainien</strong></a>'));
});
test('preserves word underscores while rendering standalone emphasis', () => {
  const html = render('agent_config_name 𐐀_name _visible_');
  assert.ok(html.includes('agent_config_name 𐐀_name <em>visible</em>'));
});
test('keeps authored HTML escaped', () => {
  assert.ok(render('<script>alert(1)</script>').includes('&lt;script&gt;'));
});

test('renders ordered reading sequences as an ordered list', () => {
  const html = render('1. **First book**\n2. *Second book*\n3. Third book');
  assert.ok(html.includes('<ol><li><strong>First book</strong></li><li><em>Second book</em></li><li>Third book</li></ol>'));
});

test('preserves agent hierarchy whitespace and escapes markup inside fenced blocks', () => {
  const text = '```\nMe\n└── Orchestrator\n    ├── Agent\n<script>literal</script>\n```\n\n## Next section';
  const html = render(text);
  assert.ok(html.includes('<pre><code>Me\n└── Orchestrator\n    ├── Agent\n&lt;script&gt;literal&lt;/script&gt;</code></pre>'));
  assert.ok(html.includes('<h3>Next section</h3>'));
});

test('embeds multiple labelled standalone videos only on an opted-in surface', () => {
  const body = '### AsciiTheme\n\n[AsciiTheme — launch video](https://youtu.be/y2OW5f8QEXo)\n\n### AMI\n\n[AMI — launch video](https://youtu.be/QnpLjwhj6Fs)';
  assert.ok(!render(body).includes('<iframe'));
  const html = render(body, { embedVideos: true });
  assert.equal((html.match(/<iframe/g) || []).length, 2);
  for (const [name, id] of [['AsciiTheme', 'y2OW5f8QEXo'], ['AMI', 'QnpLjwhj6Fs']]) {
    assert.ok(html.includes(`https://www.youtube-nocookie.com/embed/${id}?rel=0&amp;playsinline=1`));
    assert.ok(html.includes(`title="${name} — launch video"`));
    assert.ok(html.includes(`href="https://youtu.be/${id}"`));
  }
  assert.equal((html.match(/loading="lazy"/g) || []).length, 2);
  assert.ok(!html.includes('autoplay'));
});

test('keeps code, inline references, lists and non-video links out of players', () => {
  const body = 'See [AMI](https://youtu.be/QnpLjwhj6Fs) here.\n\n- [AMI](https://youtu.be/QnpLjwhj6Fs)\n\n```\n[AMI](https://youtu.be/QnpLjwhj6Fs)\n```\n\n[Wrong host](https://youtube.com.evil.test/watch?v=QnpLjwhj6Fs)';
  assert.ok(!render(body, { embedVideos: true }).includes('<iframe'));
});

test('validates supported video URL hosts, credentials and IDs before embedding', () => {
  for (const href of ['https://youtu.be/QnpLjwhj6Fs', 'https://www.youtube.com/watch?v=QnpLjwhj6Fs', 'https://youtube.com/shorts/QnpLjwhj6Fs', 'https://www.youtube-nocookie.com/embed/QnpLjwhj6Fs']) assert.equal(youtubeVideoId(href), 'QnpLjwhj6Fs');
  for (const href of ['http://youtu.be/QnpLjwhj6Fs', 'https://youtube.com.evil.test/embed/QnpLjwhj6Fs', 'https://user@youtube.com/watch?v=QnpLjwhj6Fs', 'https://youtube.com:444/watch?v=QnpLjwhj6Fs', 'https://youtu.be/bad', 'https://youtu.be/QnpLjwhj6Fs/extra', 'javascript:alert(1)']) assert.equal(youtubeVideoId(href), null);
});

test('renders inline commands literally without interpreting links or emphasis', () => {
  assert.ok(render('Run `/brag --voice` and `[literal](https://youtu.be/QnpLjwhj6Fs) *literal*`', { embedVideos: true }).includes('<code>[literal](https://youtu.be/QnpLjwhj6Fs) *literal*</code>'));
});

test('selects an embeddable project video after preserved channel and unsupported links', () => {
  const video={type:'youtube',url:'https://youtu.be/QnpLjwhj6Fs'};
  const old=[{type:'youtube',url:'https://www.youtube.com/@ABV_Creative'},{type:'youtube',url:'https://youtu.be/bad'},{type:'site',url:'https://youtu.be/y2OW5f8QEXo'}];
  assert.equal(findYouTubeVideo([...old,video]),video);
  assert.equal(findYouTubeVideo(old),undefined);
});


test('book audio has no source until the reader requests playback', () => {
 const Player=loadComponent('BookAudioPlayer').default;
 const html=renderToStaticMarkup(createElement(Player,{src:'https://github.com/example/audio.mp3',title:'Example'}));
 assert.match(html, /Listen to audiobook/);
 assert.match(html, /preload="none"/);
 assert.doesNotMatch(html, /<source|src=|autoPlay|autoplay/);
});

test('native article photographs follow their heading with captions and lazy loading', () => {
  const html=render('## Observations\n\nAuthored prose.', {illustrations:[{src:'/media/writing/sample.jpg',alt:'Original photograph',width:964,height:1280,caption:'Author’s photograph.',afterHeading:'Observations'}]});
  assert.ok(html.includes('alt="Original photograph"'));assert.ok(html.includes('Author’s photograph.'));
  assert.ok(html.indexOf('<h3>Observations</h3>')<html.indexOf('alt="Original photograph"'));
  assert.ok(html.includes('loading="lazy"'));assert.ok(!html.includes('fetchPriority="high"'));
});

test('thematic breaks render semantic separators while code and inline hyphens stay literal',()=>{
 for(const separator of ['---','***','___','- - -']) {
  const html=render('Before.\n\n'+separator+'\n\nAfter.');
  assert.equal((html.match(/<hr\b/g)||[]).length,1);
  assert.ok(html.includes('<p>Before.</p>'));assert.ok(html.includes('<p>After.</p>'));
 }
 const html=render('Keep a---b and `---`.\n\n```\n---\n```');
 assert.equal((html.match(/<hr\b/g)||[]).length,0);
 assert.ok(html.includes('<pre><code>---</code></pre>'));
});
test('the published Psychology selection preserves all twenty authored fragment dividers',()=>{
 const source=readFileSync(new URL('../content/writing/psychology-notebook-01-suffering-drama.md',import.meta.url),'utf8');
 const end=source.indexOf('\n---',3),body=source.slice(end+4).trim();
 assert.equal(body.split('\n').filter(line=>line==='---').length,20);
 const html=render(body);
 assert.equal((html.match(/<hr\b/g)||[]).length,20);
 assert.ok(!html.includes('<p>---</p>'));
 assert.ok(html.includes("Getting out of the misery loop"));
});
