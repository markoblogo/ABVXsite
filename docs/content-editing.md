# Content editing

Use this guide for a small public-content change. [Content workflow](content-workflow.md) owns the complete format and field rules; the [release checklist](editorial-seo-checklist.md) owns publication checks.

For accepted native posts, Working Stories and supported catalogue content, start with the [runtime publisher](runtime-writing.md) and [catalogue contract](runtime-catalogue.md). Preserve OS intake and source-specific approval. Scheduled pools keep their separately authorized route. Use the [Git handoff](abvx-os-publishing.md) for legacy publications and engineering, rather than adding a build/PR to every routine runtime edit.

## Choose the owning source

First inspect runtime ownership and the current revision. A managed runtime record or tombstone overrides its bundled file; editing the old Markdown will not update the live record. Use revision-bound runtime updates for managed material. The table below locates bundled baselines and configuration, not a second source of truth for managed content.

| Task | Source |
| --- | --- |
| Add/update a Focus or Systems project | `content/work/<slug>.md` |
| Add/update a book, translation, free edition, or companion | `content/books/<slug>.md` |
| Add/update an official series | `content/series/<slug>.md` |
| Add/update a native Writing article | `content/writing/<slug>.md` |
| Add a Working Story / change its series introduction | `content/working-stories/<file>.md` / `content/working-stories.json`; see [workflow and export](working-stories.md) |
| Add/update a section guide or translation | `content/editorial/<slug>.md` and `content/editorial/index.json` |
| Change core-page SEO title or substantive update date | `content/pages.json` |
| Change shared sponsorship/UGC offers | `content/collaborations.json` |
| Change YouTube channel/cutoff/pinned test video | `content/youtube.json` |

`src/content/types.ts` and the loaders define behavior, not the ordinary editing surface. The file loaders normalize the bundled catalogue. Runtime catalogue readers reuse those normalizers and selectors with the live snapshot. Do not add catalogue items to legacy TypeScript data modules. For approved data-only cards, series and groups use [runtime catalogue publishing](runtime-catalogue.md).

## Add a project, book, or series

1. Copy the corresponding `_template.md`, or use `npm run content:new-work`, `content:new-book`, or `content:new-series`. Use `content:new-writing` for a native article. Review generator defaults before making it public.
2. Keep JSON frontmatter between `---` delimiters and place detail-page Markdown after it. Use the template's supported fields and link types (`site`, `github`, `amazon`, `pdf`, etc.), not arbitrary legacy aliases.
3. Set a unique, stable `id`/`slug`, title, summary, actual dates, status, and visibility. Remove empty placeholder links. Add only verified public URLs and claims.
4. Select `primarySection`, useful `appearsIn` cross-listing, and an existing catalogue group. Focus market projects may appear in both Focus and Systems; ordinary Systems utilities need not appear in Focus.
5. Place images/PDFs under `public/media/<kind>/<slug>/` and reference `/media/...` paths. Prefer existing WebP derivatives, include descriptive alt text, and preserve image-role semantics. Keep review notes/flags internal.

Standalone utilities opt into the Systems subgroup with `primarySection: "systems"`, `appearsIn: ["systems"]` and `group: "Standalone Utilities"`. New records are included in the catalogue and its structured item list from metadata; no page slug-array edit is needed. Existing pinned items retain their order. The same metadata registration is supported for `group: "Workflow & Orchestration"`. Existing explicit placements anywhere in Systems take priority over metadata, so adding a new workflow tool does not move an already pinned project between subgroups. Project videos use the existing `youtube` link and shared detail-page player.

`publishedAt` records publication; `updatedAt` changes for substantive public updates, not for every build. Homepage catalogue announcements use immutable first-addition chronology; editing an existing item does not make it a new announcement. Runtime first-addition timestamps and bundled `content/catalogue-discovery.json` retain their own provenance. See [chronology](site-operations.md#catalogue-addition-chronology).

Book and series links use existing identifiers/relationships. A companion's canonical detail route follows its record family, not every catalogue where it appears. Preserve custom `canonicalPath` values and published aliases.

## Editorial and multilingual guides

Use the [editorial checklist](editorial-seo-checklist.md). Map every requested section once, give each article a distinct purpose, and add its link at the matching heading. Pair translations with the same `translationGroup`, correct language code, and localized link label. Keep dates and `seoTitle` in the editorial index; verify visible language links, canonical routes, and alternates after building.

### Project cards with localized editorial reading

AMI uses one project record (`content/work/ami.md`, `/work/ami`) and three audience-adapted guides in the `ami-agro-market-infrastructure` editorial translation group. Focus lists the project once in its infrastructure explainer; Systems lists it in Market Fronts & Landings. Both cards pass the same small `href`/`linkLabel`/`language` projection to the optional `ProjectCatalogueCard.editorialArticles` prop, reusing `EditorialSectionLink`. Keep one article route per language under `/editorial/focus/`, including when linked from Systems; the existing editorial renderer and sitemap supply reciprocal language alternates. The project brief stays distinct from the three full articles.

Homepage catalogue news uses immutable first-addition timestamps and each item's `primarySection`; `appearsIn` controls additional listings, not duplicate homepage announcements. Cross-listed AMI therefore announces in Focus, while Systems retains its latest primary product. The Writing page and SEO link check share `writing-window.mjs` (one featured, six recent, thirty archive rows); older retained videos still receive individual route/index checks. AMI product links use canonical URLs without generated ChatGPT campaign attribution. Cropto's project-copy context preserves the owner-confirmed pause of standalone development.

## Collaboration links

Edit each offer in `content/collaborations.json` once. About and the footer consume that shared source, including labels and URLs. Keep external links opening in a new tab with `rel="noopener noreferrer"`; retain the `Collaboration Click` tracking class and verify narrow-screen wrapping.

## YouTube

See [Writing sources and pinned-video behavior](site-operations.md#youtube-policy). The channel feed imports only publications after the cutoff. The single initial exception has locally stored metadata so it survives feed rollover or failure. Content validation checks its configuration. Do not lower the cutoff to import the old channel archive unless requested.

## Complete one reviewable change

For a bundled Git change, update content, section links, relationships, media and both machine indexes together. Run `npm run llms:generate`; commit its outputs without hand edits, then follow the [release checklist](editorial-seo-checklist.md). Runtime edits update live discovery and RSS through the store; do not regenerate committed files or open a content PR for each accepted runtime operation. A stored receipt and optional/requested live verification remain separate evidence.

Bulk edits must keep the same source ownership and stable identifiers. A passed build does not establish link correctness, publication, or search indexing.

Kitchen Notes recipe fields and local cookbook export: [guide](kitchen-notes.md).

## Tables in Markdown

Markdown tables use a header row, a delimiter row (`|---|---|`) and data rows. Optional outer pipes and colon alignment are supported. Cells retain inline emphasis, links and code; use `\|` for a literal pipe. The renderer creates semantic column headers and a keyboard-focusable horizontal scroll region on narrow screens. Tables inside fenced code remain literal examples.

## Videos inside Writing articles

Put a labelled HTTPS YouTube link in its own paragraph, e.g. `[AMI — launch video](https://youtu.be/VIDEO_ID)`. Native Writing renders each supported standalone video link as a responsive, lazy, privacy-enhanced player with the original URL as a fallback link. Inline references, lists and fenced code remain ordinary Markdown. Other Markdown surfaces keep link rendering unless they explicitly enable video blocks. Do not use the single `videoUrl` companion field for a multi-project review: it remains an ordinary article in the Writing feed.

Project detail pages show every distinct supported `youtube` video from the existing `links` array in a labelled gallery below their brief. Source order is retained; repeated URLs for the same video ID produce one player. Compact catalogue previews retain their link limit. Keep previous channel/demo links when adding a newly featured project video. Without a verified original upload date, do not invent VideoObject metadata.

### Book and series trailers

Add an existing public trailer as a labelled `youtube` entry in the book or series `links` array. Both detail-page variants show every distinct supported video in the Watch / Context gallery, using `YouTubeFigure` with `youtube-nocookie.com`, lazy loading, an accessible title, strict referrer policy and the original URL fallback. Give each video a descriptive label, such as `Book trailer` or `Game trailer`. New videos append without removing existing entries. The routine path is [the runtime add-video command](runtime-catalogue.md#add-a-video-to-a-book-project-series-or-catalogue-group), covering books, projects, series and groups. `content:add-video` and `content:add-media` remain the documented Git compatibility tools; do not use them to edit an already-managed runtime source. A series trailer may also be linked explicitly from each member book; preserve purchase links, cover images and canonical paths. The publisher records the substantive update without resetting publication or first-addition dates. Regenerate committed indexes only for a bundled Git edit. Adding a trailer does not create a new catalogue announcement or supply a verified upload date for VideoObject metadata.

Project additions in every existing Systems subgroup now use their `group` metadata; explicit pinned placements continue to win. Work and book detail pages honor `seoTitle` and `seoDescription` without replacing visible titles/summaries. Use the [runtime catalogue publisher](runtime-catalogue.md) for approved new project/book cards, series and groups within existing catalogue pages. `content:publish` remains the legacy Git path. New route implementations, blog collection definitions and shared rendering code require engineering work. Writing keeps a bounded recent view, a **More posts** control (30 per click) and a complete server-rendered archive so older local pages stay linked.


Book audio downloads may use the existing public MN7R Releases assets. Keep stable legacy media URLs as redirects when removing local duplicates and preserve verified file identity. Playable individual-book `audio` URLs and their final redirect targets must match the shared `src/lib/media-policy.mjs` CSP sources: ABVX, GitHub or release-assets.githubusercontent.com. Work/series audio and `audiobook` links remain downloads. The shared audio player assigns its source and starts playback only after the reader requests it; the initial page must not request audio bytes. Scoped and full QA retain binary-link availability checks through HEAD instead of buffering downloads.


For first media and additive download/audio links on bundled project, book or series cards, `content:add-media` and the [shared additive-media release route](abvx-os-publishing.md#shared-additive-media-route) remain the Git compatibility path. Managed runtime records require an approved full-source update at their current revision; use the narrower runtime add-video operation for video-only requests. Existing Focus/Systems/Books listings are verified together. This reuses catalogue-v1 rather than defining a separate release process per section; unknown scope and shared code retain full QA.


### Catalogue action hierarchy

Book cards and detail pages place purchase and download actions first in larger, highlighted buttons. Book sites, videos, games and other supporting links form a smaller second row. Projects prioritize their site/demo or other operational actions; GitHub is primary for a repository-only tool. Compact cards apply their existing link limit after prioritization; detail pages retain all links. The shared renderer preserves external-link protections and book-click tracking.

Native Writing uses `illustrations` descriptors with `src`, `alt`, `width`, `height`, `caption` and exactly one anchor: `afterHeading` or `afterParagraph`. The anchor must match one unique heading or complete paragraph in the authored Markdown. The image follows that block through the existing lazy MediaPanel; full-source packets require a hashed asset mapping. Source validation rejects missing/ambiguous anchors and duplicate paths. Preserve supplied original photographs and prepare approved derivatives through the existing media pipeline.

Markdown image syntax (`![alt](path)` or image references) is not supported by the Writing renderer and fails early validation. Use the existing anchored `illustrations` metadata; code examples remain allowed. RSS reuses the same anchors and includes captions with direct absolute image URLs.

Standalone thematic-break lines (`---`, `***`, `___`, including spaced markers) render as semantic dividers. Markers inside fenced code or inline code remain literal. This supports notebook-fragment separation without modifying authored prose.

For Writing archive navigation topics (including multi-topic articles and Other), see [Writing topics](writing-topics.md). These assignments are independent of Book Readiness.
