# ABVXsite — abvx.xyz

[![Website](https://img.shields.io/badge/Website-abvx.xyz-111827?logo=vercel&logoColor=white)](https://abvx.xyz/)
[![CI](https://github.com/markoblogo/ABVXsite/actions/workflows/ci.yml/badge.svg)](https://github.com/markoblogo/ABVXsite/actions/workflows/ci.yml)

Public website and working portfolio of **Anton Biletskyi-Volokh**: product and go-to-market work, agro-commodity market infrastructure, AI-assisted workflows, books, language projects, and applied-AI writing.

This repository owns the public presentation and its editable content. `ABVX-OS` owns operational state; `CortexABV-private` owns the private knowledge/runtime layer. No private runtime is deployed by this site.

## Explore the site

| Page | Purpose |
| --- | --- |
| [Focus](https://abvx.xyz/focus) | Agro-commodity trading, brokerage, intelligence, benchmarks, and partner fronts |
| [Systems](https://abvx.xyz/systems) | Market, publishing/language, AI-development, and commercial/utility systems |
| [Books](https://abvx.xyz/books) | ABVX Press books, translations, series, free resources, and companions |
| [Writing](https://abvx.xyz/writing) | Native articles, Medium/Substack feeds, and embedded new YouTube videos |
| [About](https://abvx.xyz/about) | Background, working method, contact, and technology/creative collaborations |
| [Work with me](https://abvx.xyz/work-with-me) | Engagement formats and six focused service pages |

Projects live at `/work/[slug]`, books/series at `/books/[slug]` unless a record declares a custom canonical path, native writing at `/writing/[slug]`, and editorial guides at `/editorial/[section]/[slug]`. Published slugs and compatibility redirects are preserved.

## Start locally

Use **Node.js 24** to match CI; `package.json` declares the minimum supported engine. Install from the committed lockfile:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. For a local production server, run `npm run build` followed by `npm run start`.

Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, local Markdown/JSON and media, Vercel. Exact dependency versions live in `package.json` and `package-lock.json`.

## Edit the source, regenerate the outputs

| Source | Owns |
| --- | --- |
| `content/work/`, `content/books/`, `content/series/` | Project, book, and series records with JSON frontmatter |
| `content/writing/` | Native articles |
| `content/working-stories/` + `content/working-stories.json` | Dedicated professional stories and series introduction |
| `content/editorial/` + `content/editorial/index.json` | Section guides, translations, relationships, and localized metadata |
| `content/pages.json` | Core-page SEO titles and update dates |
| `content/collaborations.json` | Shared technology/B2B and creative/UGC offers on About and in the footer |
| `content/youtube.json` | Channel, publication cutoff, and initial demonstration video |
| `content/writing-discovery.json` | First-addition times and retained public feed metadata |
| `public/media/` | Public images and documents referenced by content |

Use existing templates or `npm run content:new-work`, `content:new-book`, `content:new-series`, and `content:new-writing`. Check visibility and remove empty placeholder URLs before publication. Catalogue copy belongs in `content/`; do not add new records to legacy TypeScript fallback registries.

After public content changes:

```bash
npm run llms:generate
```

Commit `public/llms.txt` and `public/content-index.json` together with their sources. Do not hand-edit generated indexes. `prebuild` also regenerates these indexes and the ecosystem projection.

See [Content editing](docs/content-editing.md) for task recipes and [Content workflow](docs/content-workflow.md) for the file format, fields, visibility, and review flags.

## Verify and publish

Repeatable ABVX OS publication uses [the consumer handoff](docs/abvx-os-publishing.md). `npm run content:release-check` runs the editorial gates once and saves ignored results; `content:production-check` checks discovery against the live domain after deployment.

Work from current `origin/main` in a clean ABVXsite checkout or suitable worktree. Keep unrelated changes out of the branch; use `codex/` for Codex branches.

The CI gate is:

```bash
npm run content:validate
npm run ecosystem:check
npm run lint
npm run test:sync
npm run cortex-abv:vector-export:check
npm run build
npm audit --omit=dev --audit-level=high
```

Run `npm run qa:seo` **after** a successful build for content, route, or metadata changes. `npm run content:review` is an optional editorial report; its warnings are separate from structural validation failures. Use targeted mobile/visual checks when rendered pages change.

Open one PR containing the complete source/link/index change. Passing CI and a Vercel Preview are review evidence. After the approved merge to `main`, confirm the Vercel **production deployment for the merge SHA**, then verify the canonical public URLs and relevant sitemap/index entries. A merge or preview alone does not prove publication or Google indexing.

The [editorial release checklist](docs/editorial-seo-checklist.md) is the detailed procedure. [Site operations](docs/site-operations.md) covers feeds, analytics, diagnostics, and the repository map.

## Writing and measurement

Writing merges local articles, [Working Stories](docs/working-stories.md), Medium, Substack, and YouTube. Writing and the three homepage publication slots share chronology by first registration on ABVX; source publication dates remain separate. `npm run writing:register` records native additions during prebuild. The hourly feed workflow retains discovered posts and immutable timestamps, and publishes only when metadata changes. Feed failures preserve the saved list. See [Site operations](docs/site-operations.md) for timing, historical migration, and the narrowly authorized workflow.

Working Stories also has its own [chronological index](https://abvx.xyz/writing/working-stories); book-eligible stories export with `npm run export:working-stories` into ignored local `exports/` files. YouTube retains its new-publication cutoff and one initial test exception. Featured players, compact recent previews and text-only archive rows retain their existing layouts.

Plausible tracks `Book Link Click`, `Contact Click`, and `Collaboration Click` separately. These measure link intent, not completed purchases, messages, or bookings. Dashboard goals and historical limitations are documented in [Site operations](docs/site-operations.md).

Canonical domain: `https://abvx.xyz`. Public discovery surfaces: [sitemap.xml](https://abvx.xyz/sitemap.xml), [llms.txt](https://abvx.xyz/llms.txt), [content-index.json](https://abvx.xyz/content-index.json), and [ecosystem.json](https://abvx.xyz/ecosystem.json). Structured metadata, alternates, and indexes support discovery; they do not guarantee rankings, AI citations, or traffic.

See the [traffic growth plan](docs/traffic-growth-plan.md) for implemented work, measurement, and proposed next improvements. Proposed work is not an instruction to start it automatically.

## Integrations and boundaries

The [CortexABV public-site adapter](cortex-abv/README.md) documents public presence, project registries, read-only repository observation, approved copy proposals, and the static private-runtime export snapshot. Normal project-copy updates are PR-first; executor designs do not enable automatic merging or outbound communications.

The separate [ecosystem sync](docs/ecosystem-sync.md) has narrowly authorized generated/managed writes. Preserve this README's ecosystem markers and never use that exception to publish arbitrary code or unmarked prose.

Optional Search Console/Bing verification overrides are `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION`. Site rendering and YouTube ingestion need no CMS token or YouTube API key. Copy-sync credentials are workflow-specific; never commit secrets. See [project description sync](docs/project-description-sync.md) before touching that integration.

## Documentation map

For an agent session, read `AGENTS.md`, this README, then only the relevant guide:

- [Content editing](docs/content-editing.md) / [content format](docs/content-workflow.md)
- [Working Stories workflow and manuscript export](docs/working-stories.md)
- [Editorial SEO release checklist](docs/editorial-seo-checklist.md)
- [Site operations and measurement](docs/site-operations.md)
- [Traffic growth plan](docs/traffic-growth-plan.md)
- [Design review](docs/design-taste-review.md) / [shell smoke check](docs/site-shell-smoke-check.md)
- [CortexABV adapter](cortex-abv/README.md) / [copy sync](docs/project-description-sync.md) / [ecosystem sync](docs/ecosystem-sync.md)

<!-- ABVX:ECOSYSTEM:BEGIN -->
## ABVX ecosystem

- [lab.abvx](https://lab.abvx.xyz/) — Presents the developer-tool catalogue inside the wider ABVX ecosystem. Current release: `v0.2.0`.
- [abvx-shortener](https://go.abvx.xyz/) — Uses stable short links for public campaigns and QR destinations. Current release: `v0.4.0`.

_This block is generated from the reviewed ABVX ecosystem registry._
<!-- ABVX:ECOSYSTEM:END -->
