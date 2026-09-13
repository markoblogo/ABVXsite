#!/usr/bin/env node

const baseUrl = process.argv[2] || process.env.THEME_SMOKE_URL || 'http://localhost:3000';

const checks = [
  {
    name: 'Primary navigation exists',
    test: (html) => /aria-label="Primary navigation"/.test(html),
  },
  {
    name: 'Header brand mark exists',
    test: (html) => /\/brand\/abv-mark-dark\.png/.test(html),
  },
  {
    name: 'Homepage positioning is present',
    test: (html) => /AI-native systems for complex markets\./.test(html),
  },
  {
    name: 'Primary work actions exist',
    test: (html) => /Explore the work/.test(html) && /Work with me/.test(html),
  },
  {
    name: 'Footer navigation exists',
    test: (html) => /aria-label="Footer navigation"/.test(html),
  },
  {
    name: 'Machine-readable indexes are linked',
    test: (html) => /href="\/llms\.txt"/.test(html) && /href="\/content-index\.json"/.test(html),
  },
];

async function run() {
  const url = new URL('/', baseUrl).toString();
  const res = await fetch(url, { redirect: 'follow' });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();

  let failed = 0;
  console.log(`Site shell smoke-check target: ${url}`);

  for (const check of checks) {
    const ok = check.test(html);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${check.name}`);
    if (!ok) failed += 1;
  }

  if (failed > 0) {
    console.error(`\n${failed} checks failed.`);
    process.exit(1);
  }

  console.log('\nAll smoke checks passed.');
  console.log('Next: run npm run qa:visual for desktop and mobile route coverage.');
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
