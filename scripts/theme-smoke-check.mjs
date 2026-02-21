#!/usr/bin/env node

const baseUrl = process.argv[2] || process.env.THEME_SMOKE_URL || 'http://localhost:3000';

const checks = [
  {
    name: 'Theme toggle button exists',
    test: (html) => /aria-label="(Switch to light mode|Switch to dark mode)"/.test(html),
  },
  {
    name: 'ASCII toggle mount exists',
    test: (html) => /id="ascii-toggle-anchor"/.test(html),
  },
  {
    name: 'AsciiTheme source link exists in footer',
    test: (html) => /github\.com\/markoblogo\/AsciiTheme/.test(html),
  },
  {
    name: 'World time dock markup exists',
    test: (html) => /class="time-dock/.test(html),
  },
  {
    name: 'Header logo mark exists',
    test: (html) => /\/brand\/abv-mark\.png/.test(html),
  },
  {
    name: 'ASCII footnote exists',
    test: (html) => /experimental ASCII theme mode/.test(html),
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
  console.log(`Theme smoke-check target: ${url}`);

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
  console.log('Next: run manual visual checklist in docs/theme-smoke-check.md');
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
