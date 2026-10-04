import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync(new URL('../src/components/MarkdownContent.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
const compiledModule = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, compiledModule, compiledModule.exports);
const MarkdownContent = compiledModule.exports.default;
const render = (children) => renderToStaticMarkup(createElement(MarkdownContent, null, children));

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
