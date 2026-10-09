# Content editing

Use this guide for a small public-content change. [Content workflow](content-workflow.md) owns the complete format and field rules; the [release checklist](editorial-seo-checklist.md) owns publication checks.

## Choose the owning source

| Task | Source |
| --- | --- |
| Add/update a Focus or Systems project | `content/work/<slug>.md` |
| Add/update a book, translation, free edition, or companion | `content/books/<slug>.md` |
| Add/update an official series | `content/series/<slug>.md` |
| Add/update a native Writing article | `content/writing/<slug>.md` |
| Add/update a section guide or translation | `content/editorial/<slug>.md` and `content/editorial/index.json` |
| Change core-page SEO title or substantive update date | `content/pages.json` |
| Change shared sponsorship/UGC offers | `content/collaborations.json` |
| Change YouTube channel/cutoff/pinned test video | `content/youtube.json` |

`src/content/types.ts` and the loaders define behavior, not the ordinary editing surface. `src/content/artifacts.ts` and `src/content/books.ts` contain legacy fallbacks; file content overrides them by slug. Do not add new catalogue items there.

## Add a project, book, or series

1. Copy the corresponding `_template.md`, or use `npm run content:new-work`, `content:new-book`, or `content:new-series`. Use `content:new-writing` for a native article. Review generator defaults before making it public.
2. Keep JSON frontmatter between `---` delimiters and place detail-page Markdown after it. Use the template's supported fields and link types (`site`, `github`, `amazon`, `pdf`, etc.), not arbitrary legacy aliases.
3. Set a unique, stable `id`/`slug`, title, summary, actual dates, status, and visibility. Remove empty placeholder links. Add only verified public URLs and claims.
4. Select `primarySection`, useful `appearsIn` cross-listing, and an existing catalogue group. Focus market projects may appear in both Focus and Systems; ordinary Systems utilities need not appear in Focus.
5. Place images/PDFs under `public/media/<kind>/<slug>/` and reference `/media/...` paths. Prefer existing WebP derivatives, include descriptive alt text, and preserve image-role semantics. Keep review notes/flags internal.

`publishedAt` records publication; `updatedAt` changes for substantive public updates, not for every build. Latest-section cards resolve `updatedAt` before `publishedAt`; inspect their eligibility helper before assuming a new item will be selected on the homepage.

Book and series links use existing identifiers/relationships. A companion's canonical detail route follows its record family, not every catalogue where it appears. Preserve custom `canonicalPath` values and published aliases.

## Editorial and multilingual guides

Use the [editorial checklist](editorial-seo-checklist.md). Map every requested section once, give each article a distinct purpose, and add its link at the matching heading. Pair translations with the same `translationGroup`, correct language code, and localized link label. Keep dates and `seoTitle` in the editorial index; verify visible language links, canonical routes, and alternates after building.

## Collaboration links

Edit each offer in `content/collaborations.json` once. About and the footer consume that shared source, including labels and URLs. Keep external links opening in a new tab with `rel="noopener noreferrer"`; retain the `Collaboration Click` tracking class and verify narrow-screen wrapping.

## YouTube

See [Writing sources and pinned-video behavior](site-operations.md#youtube-policy). The channel feed imports only publications after the cutoff. The single initial exception has locally stored metadata so it survives feed rollover or failure. Content validation checks its configuration. Do not lower the cutoff to import the old channel archive unless requested.

## Complete one reviewable change

Update content, section links, relationships, media, and both machine indexes together. Run `npm run llms:generate`; commit its outputs without hand edits. Follow the [release checklist](editorial-seo-checklist.md), open one PR, and verify the production merge SHA and canonical URLs after publication.

Bulk edits must keep the same source ownership and stable identifiers. A passed build does not establish link correctness, publication, or search indexing.
