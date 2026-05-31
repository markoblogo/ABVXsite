import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import vm from 'node:vm';

const root = process.cwd();

function loadTsExport(filePath, exportName) {
  const source = readFileSync(filePath, 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const sandbox = { exports: {}, require: () => ({}) };
  vm.runInNewContext(js, sandbox, { filename: filePath });
  return sandbox.exports[exportName] || [];
}

function fileSlugs(folder) {
  const dir = path.join(root, 'content', folder);
  if (!existsSync(dir)) return new Set();
  return new Set(
    readdirSync(dir)
      .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
      .map((file) => file.replace(/\.md$/, '')),
  );
}

function legacyState() {
  const legacyBooks = loadTsExport(path.join(root, 'src', 'content', 'books.ts'), 'books');
  const legacyWork = loadTsExport(path.join(root, 'src', 'content', 'artifacts.ts'), 'artifacts');
  const contentBookSlugs = new Set([...fileSlugs('books'), ...fileSlugs('series')]);
  const contentWorkSlugs = fileSlugs('work');

  return {
    legacyBooks,
    legacyWork,
    contentBookSlugs,
    contentWorkSlugs,
    missingBooks: legacyBooks.filter((item) => !contentBookSlugs.has(item.slug)),
    missingWork: legacyWork.filter((item) => !contentWorkSlugs.has(item.slug)),
  };
}

export function legacyContentParity() {
  const state = legacyState();
  return {
    legacyBookCount: state.legacyBooks.length,
    legacyWorkCount: state.legacyWork.length,
    contentBookOrSeriesCount: state.contentBookSlugs.size,
    contentWorkCount: state.contentWorkSlugs.size,
    missingBooks: state.missingBooks,
    missingWork: state.missingWork,
    isComplete: state.missingBooks.length === 0 && state.missingWork.length === 0,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const parity = legacyContentParity();
  console.log(`Legacy books/series covered by /content: ${parity.legacyBookCount - parity.missingBooks.length}/${parity.legacyBookCount}`);
  console.log(`Legacy work covered by /content: ${parity.legacyWorkCount - parity.missingWork.length}/${parity.legacyWorkCount}`);

  if (parity.missingBooks.length) {
    console.log('\nMissing legacy books/series:');
    for (const item of parity.missingBooks) console.log(`- ${item.slug}: ${item.title}`);
  }

  if (parity.missingWork.length) {
    console.log('\nMissing legacy work:');
    for (const item of parity.missingWork) console.log(`- ${item.slug}: ${item.title}`);
  }

  if (!parity.isComplete) process.exit(1);
}
