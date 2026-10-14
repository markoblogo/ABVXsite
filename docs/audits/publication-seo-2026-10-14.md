# Publication paths and SEO audit — 2026-10-14

Scope: NORMAL, isolated engineering release. Public baseline: ABVXsite merge `1dea90bd7d062850f6afeb56b3681006acb9b1e6`. This audit is not a new publication trial, an indexing confirmation or ranking evidence. No paid service, new package, hosting split or private-runtime dependency is introduced.

## Observed baseline

The live sitemap contained 234 unique URLs. All returned successful, self-canonical, indexable HTML with one H1, nonempty unique titles and descriptions, parseable JSON-LD and reciprocal declared language alternates. Robots allows crawling and advertises the sitemap. JSON-LD parseability does not establish rich-result eligibility. Machine-index differences for general hubs and the About fragment are intentional page-role differences, not missing article records.

Confirmed defects:

- An Oracle/1C story linked to `/focus/brokerage-market-memory-workflows-en`, which returns 404; the existing article is `/editorial/focus/brokerage-market-memory-workflows-en`.
- Six sitemap pages had no incoming link in the inspected sitemap HTML: four retained video pages and two archived native notes. A 37-item recent-feed window cannot be the only discovery path.
- `/ami`, `/fr/ami` and `/llmo` inherited the newest date from unrelated site content. Toki Pona inherited dates from every book. These dates do not represent changes to those pages.
- Writing source filters advertised the combined feed in their structured item list, including items absent from the selected view. The item list now follows the displayed source and QA checks those links.
- The project packet consumer regenerated type, links and SEO instead of preserving the supplied full source. Work detail metadata ignored optional `seoTitle`; book/project descriptions could not use explicit `seoDescription`.
- New project placement required page-array edits outside the two previously automated Systems groups, turning routine content into engineering work.

Public crawl snapshots and per-page evidence were retained locally for this run; no private operational records or source prose were exported into this report. Search Console/Bing impressions, actual index coverage and Core Web Vitals were not read, so traffic effects and ranking causes remain unknown.

## Timing evidence and interpretation

Retained private observations separate routine native singles, mixed project engineering releases and failed closeout attempts. No measured website-book-card baseline exists. These different workloads do not establish a project-vs-post speed ratio or a causal speedup. Detailed timing evidence stays in the private operational audit and is not published in this repository.

Preparation/handoff remains material. The most direct reusable change is to preserve one full source and approved media through one planning/apply/release path, rather than reconstructing facts or mixing renderer work into each publication.

## Implemented boundaries

- `content:publish` also accepts full-source `work` and `books` packets, using the existing media hash/signature checks and atomic pool rollback. It preserves source bytes, type, links and SEO. No approval is minted. Writing and catalogue remain separate release families; legacy text-only project consumers remain compatibility paths.
- `catalogue-v1` selects six actual local gates for due public project/book data on standard `/work/<slug>` and `/books/<slug>` routes. Unknown history, cross-section placement, custom routes, mixed families, source deletions, existing media replacement and code/config/dependency changes keep full QA. Build, dependency audit, media/entity checks, hub links, canonical/index membership and mobile QA remain required. CI reuses Vercel compilation for proven data-only changes, as for native posts.
- Every existing Systems subgroup accepts matching project metadata while preserving all explicit pinned placements.
- A complete, server-rendered Writing archive keeps every published local writing/video/story URL linked after it leaves the recent feed. The feed's **More posts** button reveals 30 more items per click and retains the active source. The complete archive provides a crawlable fallback independent of JavaScript.
- Shared preflight rejects malformed explicit SEO, invalid calendar dates, reversed modification dates and colliding public routes before a build. Unknown legacy dates remain unknown.
- Full and scoped release QA now enforce indexability, canonical/description/H1/language and JSON-LD syntax. Full QA checks reciprocal alternate targets, every archive member and off-sitemap internal links. Changed-page QA checks internal links as well.
- Sitemap dates now follow the relevant source/page dates. Historical static-page dates come from their actual source history, not this build. AMI also carries reciprocal sitemap alternates.

## Next measurement and safeguards

Freeze this engineering release before the next content run. Measure a plain project or book card separately from native posts, including preparation, approval waiting, local gates, CI/Preview and production verification; retain failures and owner effort UNKNOWN. Do not retroactively relabel prior observations or claim savings from the synthetic profile tests.

Native OS `publication begin/check/complete-cycle` still owns only Writing/Working Stories. The site catalogue profile does not expand that private lifecycle. Project outcomes continue as separately identified generic observations; an elapsed-only project learning contract needs matching receiving-side validation before Cortex can qualify comparisons. Do not invent owner effort to clear its insufficient-metrics diagnosis.

For each next release, inspect the scoped receipt and the exact deployed SHA once. Keep editorial source/claim review, contextual links and image alt text per material. Review per-page Search Console/Bing indexing and 28-day impressions/clicks separately; publication or sitemap inclusion does not guarantee indexing or rankings.

References: [Google sitemap and lastmod guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions), [structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
