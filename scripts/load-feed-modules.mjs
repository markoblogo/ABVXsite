import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Reuse the site's tested parsers in the Node sync command; no second RSS parser.
export function loadFeedModule(file, modules = new Map()) {
  if (modules.has(file)) return modules.get(file).exports;
  const compiledModule = { exports: {} };
  modules.set(file, compiledModule);
  const require = createRequire(file);
  const localRequire = name => {
    if (!name.startsWith('.')) return require(name);
    const base = path.resolve(path.dirname(file), name);
    const target = ['.ts', '.tsx'].map(extension => `${base}${extension}`).find(existsSync);
    if (!target) return require(base);
    return loadFeedModule(target, modules);
  };
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', code)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
