import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const require = createRequire(import.meta.url);
const parserPath = require.resolve('@typescript-eslint/typescript-estree');
const parserRequire = createRequire(parserPath);
const matcherPath = parserRequire.resolve('minimatch');

test('the actual TypeScript parser resolves a patched minimatch', () => {
  const [major, minor, patch] = parserRequire('minimatch/package.json').version.split('.').map(Number);
  assert.ok(major > 11 || major === 11 && (minor > 0 || patch >= 1), 'GHSA-g3hv-75wg-m249 requires minimatch >=11.0.1');
});

test('parser glob matching retains brace expansion and hidden-file support; ESLint legacy API remains intact', () => {
  const {minimatch} = parserRequire('minimatch');
  assert.equal(minimatch('tooling/.config.ts', 'tooling/*.{ts,tsx}', {dot:true}), true);
  assert.equal(minimatch('tooling/config.js', 'tooling/*.{ts,tsx}', {dot:true}), false);
  const eslintRequire = createRequire(require.resolve('eslint'));
  const legacy = eslintRequire('minimatch');
  assert.equal(typeof legacy, 'function');
  assert.equal(legacy('src/example.js', '**/*.js'), true);
});

test('TypeScript project service still accepts an allowlisted hidden config file', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'abvx-parser-'));
  const parser = require('@typescript-eslint/typescript-estree');
  try {
    mkdirSync(path.join(root, 'src'));
    mkdirSync(path.join(root, 'tooling'));
    writeFileSync(path.join(root, 'src/index.ts'), 'export const x = 1;');
    writeFileSync(path.join(root, 'tsconfig.json'), JSON.stringify({compilerOptions:{strict:true},include:['src/**/*.ts']}));
    const filePath = path.join(root, 'tooling/.config.ts');
    const source = 'export const count: number = 1;';
    writeFileSync(filePath, source);
    const result = parser.parseAndGenerateServices(source, {filePath, tsconfigRootDir:root,
      projectService:{allowDefaultProject:['tooling/*.{ts,tsx}']}});
    assert.equal(result.ast.type, 'Program');
    assert.ok(result.services.program.getTypeChecker());
  } finally {
    parser.clearCaches();
    rmSync(root, {recursive:true, force:true});
  }
});

test('globparts amplification input terminates within a bounded child process', () => {
  // Exercise the advisory's optimization-level-2 path without risking the test runner.
  const code = `const {minimatch}=require(process.argv[1]);
    const result=minimatch('src/file.ts','**/../a/b/'.repeat(18)+'*.ts',{optimizationLevel:2});
    process.stdout.write(JSON.stringify({result}));`;
  const output = execFileSync(process.execPath, ['--max-old-space-size=128', '-e', code, matcherPath],
    {timeout:5000, encoding:'utf8', stdio:['ignore','pipe','pipe']});
  assert.equal(typeof JSON.parse(output).result, 'boolean');
});
