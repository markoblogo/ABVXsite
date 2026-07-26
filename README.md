# ABVXsite

[![Website](https://img.shields.io/badge/Website-abvx.xyz-111827?logo=vercel&logoColor=white)](https://abvx.xyz/)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-UNLICENSED-lightgrey)

Production source for [abvx.xyz](https://abvx.xyz/): the public ABVX ecosystem site for agro-commodity market infrastructure, AI-native systems, publishing, language experiments, books, and writing.

The site is built with Next.js App Router, TypeScript, React, local Markdown content files, local media assets, structured metadata, and public LLM-readable indexes.

## System Map

```mermaid
flowchart LR
    Public["Public visitors and LLM consumers"]
    Site["ABVXsite Next.js app"]
    Content["Local content graph<br/>books · work · series"]
    Media["Public media and OG assets"]
    Writing["RSS-fed writing archive"]
    Indexes["llms.txt and content-index.json"]
    Metadata["JSON-LD, SEO and route metadata"]
    Sync["Bounded project-description sync"]

    Public --> Site
    Content --> Site
    Media --> Site
    Writing --> Site
    Content --> Indexes
    Content --> Metadata
    Metadata --> Site
    Sync -.-> Content
```

Keep this map updated when public information architecture, content pipelines, sync boundaries, or machine-readable indexes change.

## Public Structure

The current production information architecture is:

- `/` - overview, latest entry points, and high-level ABVX positioning.
- `/focus` - pillar page and catalogue for agro-commodity market infrastructure: trading platforms, brokerage workflows, monitoring, indexes, benchmark layers, use cases, and partner fronts.
- `/systems` - operational systems architecture: market systems, publishing/language systems, AI-native development systems, and standalone utilities.
- `/books` - ABVX Press: official publishing lines, standalone books, free resources, and companion publishing systems.
- `/writing` - Medium and Substack writing archive.
- `/about` - professional framing, working method, contact, and profile links.
- `/work/[slug]` - detail pages for projects, tools, protocols, systems, landing pages, and work items.
- `/books/[slug]` - detail pages for books, official publishing lines, free resources, and series.

Legacy public paths are preserved either as redirects or as noindex compatibility pages with canonical links into the current structure.

Detail pages include visible breadcrumb links, entity-oriented "Key facts" blocks, related ecosystem items, and targeted FAQ / methodology blocks where they are real page content.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4 pipeline
- File-based content in `/content`
- Local public media in `/public/media`
- WebP / AVIF media derivatives for larger local images
- Page-specific Open Graph / Twitter images
- JSON-LD for global identity, collection pages, work items, books, series, item lists, breadcrumbs, related ecosystem graphs, FAQ pages, and Dataset/DataFeed-style market-index projects
- Public LLM indexes in `/llms.txt` and `/content-index.json`
- RSS ingestion for `/writing`
- Vercel production deployment

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Production build locally:

```bash
npm run build
npm run start
```

## Content Source Of Truth

Editable public content lives in `/content`.

```text
content/
  books/
  work/
  series/

public/media/
  books/
  work/
  series/
```

Use Markdown files with structured frontmatter:

- `content/books/*.md` - books, translations, free resources, and publishing items.
- `content/work/*.md` - focus projects, systems, tools, protocols, companion sites, and utilities.
- `content/series/*.md` - official publishing lines and series records.
- `public/media/**` - local images and PDFs referenced by content files.

For public work items, set `publishedAt` when creating the item and update `updatedAt` whenever its public copy changes. The homepage uses `updatedAt` first, then `publishedAt`, for the latest card in every section where the item appears.

Do not write local machine paths into content files. Public media references should use paths such as:

```text
/media/work/mn7r/hero.png
/media/work/spike-spot-commodity-index-ukraine/hero.webp
/media/books/dark-gestalt/cover.webp
/media/series/modernisme-ukrainien/hero.webp
```

Large PNG/JPEG source files may remain in `public/media` for archival/source fidelity, but public content should prefer generated `.webp` paths when derivatives exist. `.avif` derivatives are also generated for many large images and can be used by future media resolvers.

Internal editorial fields such as `needsCopyReview`, `needsMediaReview`, `needsLinkReview`, and `editorialNotes` are for workflow only and must not render publicly.

## Content Scripts

Create new content files:

```bash
npm run content:new-book
npm run content:new-work
npm run content:new-series
```

Validate content:

```bash
npm run content:validate
```

Generate the editorial review report:

```bash
npm run content:review
```

Generate the public LLM-readable indexes after content changes:

```bash
npm run llms:generate
```

`npm run build` runs `npm run llms:generate` automatically through `prebuild`, so generated `/public/llms.txt` and `/public/content-index.json` stay aligned with `/content`.

Selected project descriptions may be refreshed from their source repositories through the bounded CortexABV workflow. See [project description sync](docs/project-description-sync.md).

## CortexABV public-site adapter

![CortexABV logo](./cortex-abv/assets/cortex-abv-logo.png)

The repository contains the proposal-only public boundary for CortexABV in [`cortex-abv/`](cortex-abv/). It validates approved public sources and bounded site-copy proposals, but it does not contain the private personal profile, inbox, credentials, contact history, or autonomous publishing controls.

The [CortexABV Read-Only Import Contract](docs/cortex-abv-read-only-import-contract.md) defines the broader architecture: base Cortex plus the owner's Monitor, Index, and Cropto ecosystems may supply authorized updates into private CortexABV, but CortexABV has no data, command, feedback, policy, or influence path back to them. A target surface controls whether an evidence-backed proposal stays review-only or receives a separately configured bounded write authority.

The private runtime may also define isolated tenants for wholly owned projects, such as AzurMenton. Those tenant source packs, guest-policy and shadow-evaluation artifacts remain outside this public adapter: they cannot retrieve personal or sibling-project context, cannot appear in the public corpus, and do not create a public chat, booking, publishing, or site-editing authority.

For auditability, [`cortex-abv/private-runtime/`](cortex-abv/private-runtime/) contains a static code-and-contract snapshot of that separately operated runtime. It contains no private ledger/store, `.env`, credentials, real source packets, protected payloads, personal profile, or guest data; [`npm run cortex-abv:private-runtime:check`](#verification) fails closed if such material is added. The snapshot does not make the runtime public or deploy it through ABVXsite.

The private runtime now defines a [Personal Knowledge Core boundary](docs/cortex-abv-personal-knowledge-core.md) for CortexABV and CoqPi. CoqPi can be the owner-facing ingress UI, while CortexABV maintains approved facts; public ABVXsite contains only contract code and synthetic fixtures, never personal knowledge, interview records, raw sources, credentials, or retrieval state.

See also: [Cabinet pilot integration map](docs/cortex-abv-cabinet-integration-map.md). Stage 1 is now active for a non-runtime contract-only pilot (`Scheduled jobs and task runner`) with read-only receipt gates:

- `cortex-abv/private-runtime/config/cabinet-scheduled-jobs-stage1.v1.json`
- `cortex-abv/private-runtime/receipts/cabinet-stage1-scheduled-jobs-receipt.v1.json`
- `npm run cortex-abv:cabinet-stage1-run` for a real local synthetic Stage 2 execution (no write authority).
- `cortex-abv/private-runtime/config/cabinet-scheduled-jobs-stage1.v1.json` now also binds one owned-source synthetic adapter (`monitor-mn7r-shadow`) with `source_specific_override` visibility in the receipt decision trace.
- `cortex-abv/private-runtime/config/cabinet-scheduled-jobs-stage1.v1.json` now binds second owned-source synthetic adapter (`index-spike-shadow`) and requires `result.sourceAdapters[].decisionTrace` for every enabled adapter before any future write-authority expansion.
- `cortex-abv/private-runtime/src/vector-runtime-shim.mjs` defines the future local vector runtime `buildIndex/query` interface for the turbovec pilot, currently fallback-only (`tfidf-lite`) and receipt-only via `npm run vector-runtime-readiness:run`.
- `cortex-abv/private-runtime/src/vector-runtime-dependency-probe-runner.mjs` adds an opt-in real PyPI `turbovec` probe with index-build/query acceptance and a receipt-only governance gate.
- `cortex-abv/private-runtime/config/vector-runtime-package-policy.v1.json` pins the allowed package supply path to PyPI `turbovec==0.8.0`, temporary/local venv only, platform constraints, and reproducibility receipts.
- `cortex-abv/private-runtime/src/vector-runtime-integration-preflight.mjs` aggregates policy, dependency, readiness and synthetic retrieval receipts into `eligible_for_design_review` / `not_eligible_for_design_review` without approving runtime integration.
- `cortex-abv/private-runtime/config/vector-runtime-wiring-design.v1.json` defines the private-runtime-only wiring design contract and returns `eligible_for_implementation_poc_review` without approving implementation.
- `cortex-abv/private-runtime/config/vector-runtime-implementation-poc-review.v1.json` defines the minimum dry-run POC review scope: local gitignored index artifact root, allowed source packs, digest/rollback checks and dry-run command allowlist. It returns `eligible_for_implementation_poc_dry_run_review` without approving the POC itself.
- `cortex-abv/private-runtime/config/vector-runtime-implementation-poc-dry-run.v1.json` runs the first local dry-run artifact pass: synthetic source pack, gitignored local index artifact, source/index digests, probe results and rollback notes. It returns `eligible_for_controlled_runtime_module_review` without approving runtime activation.
- `cortex-abv/private-runtime/config/vector-runtime-controlled-module-design.v1.json` defines the next controlled local module contract over that artifact interface: `loadIndexArtifact`, `queryCandidates`, `verifyClaimEvidence`, Stage 4h receipt digest required, no implementation or wiring approval.
- `cortex-abv/private-runtime/config/vector-runtime-controlled-module-poc-review.v1.json` defines the future local harness POC review scope and requires the Stage 4i design receipt digest. It returns `eligible_for_controlled_runtime_module_harness_dry_run_review` without approving harness implementation.
- `cortex-abv/private-runtime/src/vector-runtime-controlled-module-harness.mjs` implements the first local-only controlled module harness over the Stage 4h artifact. Its dry-run receipt returns `eligible_for_controlled_runtime_wiring_design_review` without approving runtime wiring.
- `cortex-abv/private-runtime/config/vector-runtime-controlled-wiring-design.v1.json` defines the controlled runtime wiring design gate: private-runtime-only, in-process local library binding only, Stage 4k receipt digest required, no endpoint/scheduler/network/LLM/public action. Its receipt returns `eligible_for_controlled_runtime_wiring_poc_review` without activating wiring.
- `cortex-abv/private-runtime/config/vector-runtime-controlled-wiring-poc-review.v1.json` defines the minimum controlled wiring POC review scope and requires the Stage 4l receipt digest. It returns `eligible_for_controlled_runtime_wiring_poc_dry_run_review` without approving implementation or activation.
- `cortex-abv/private-runtime/src/vector-runtime-controlled-wiring-poc-dry-run.mjs` runs the first controlled local wiring POC dry-run: it requires the Stage 4m receipt digest chain, binds only the existing local harness module, queries tenant-scoped candidates, and writes only a receipt. It returns `eligible_for_controlled_runtime_wiring_review` without runtime activation.
- `cortex-abv/private-runtime/config/vector-runtime-controlled-wiring-review.v1.json` defines the controlled runtime wiring review gate and requires the Stage 4n receipt digest. It returns `eligible_for_runtime_activation_review` without activating runtime wiring.
- `cortex-abv/private-runtime/config/vector-runtime-activation-review.v1.json` defines the runtime activation review gate and requires the Stage 4o receipt digest. It returns `eligible_for_runtime_activation_dry_run_review` without activating runtime wiring.
- `cortex-abv/private-runtime/config/vector-runtime-activation-dry-run-review.v1.json` defines the runtime activation dry-run review gate and requires the Stage 4p receipt digest. It returns `eligible_for_runtime_activation_dry_run` without activating runtime wiring.
- `cortex-abv/private-runtime/src/vector-runtime-activation-dry-run.mjs` runs the first local activation dry-run: it verifies module import/bindings, read-only artifact load, tenant-scoped candidate-only queries, evidence refs and no exposed activation. It returns `eligible_for_runtime_readiness_review` without activating runtime wiring.
- `cortex-abv/private-runtime/config/vector-runtime-readiness-review.v1.json` defines the runtime readiness review gate and requires the Stage 4r receipt digest. It returns `eligible_for_runtime_activation_decision_review` only when local module, artifact, digest-chain, query and evidence signals are all sufficient, still without activation.
- `cortex-abv/private-runtime/config/vector-runtime-activation-decision-review.v1.json` defines the runtime activation decision review gate and requires the Stage 4s receipt digest. It bounds what a later separate local activation decision may ever allow: owner-invoked same-process callable availability only, still with no endpoint, scheduler, network, LLM, public action or external writes.
- `cortex-abv/private-runtime/config/vector-runtime-activation-decision.v1.json` records the explicit owner-approved local activation decision artifact and requires the Stage 4t receipt digest. It still does not activate runtime wiring; it only prepares a later bounded local activation dry-run.

Check the adapter contract and currently enabled project-sync targets:

```bash
npm run cortex-abv:status
```

The scheduled project-copy workflow observes allowlisted source SHAs first and saves an evidence artifact. MN7R, Cropto, and SPIKE SPOT INDEX still run through the same bounded public-copy and validation gates, but the write path is now PR-first: workflow candidates open an owner-review pull request and are only published after manual merge. No title, links, tags, media, positioning, social posts, messages, or email updates are permitted by this path.

See [CortexABV public-site adapter](cortex-abv/README.md) for the authority boundary and the next integration seam.

The first public CortexABV corpus is [`cortex-abv/public-presence-index.v1.json`](cortex-abv/public-presence-index.v1.json): a versioned, read-only entity map of the public site, Lab, catalogue, writing feeds and source provenance. Rebuild it with `npm run cortex-abv:public-index`; it has no model call and no action authority.

[`cortex-abv/public-project-registry.v1.json`](cortex-abv/public-project-registry.v1.json) is the next read-only layer: an explicit `repo ↔ project ↔ ABVX landing ↔ Lab ↔ public channels` map derived from that index. It includes only GitHub URLs already declared in public project content; it performs no repository discovery, GitHub access, model call, or external action. Rebuild it after the index with `npm run cortex-abv:project-registry`.

The separate GitHub Repository Observer v1 consumes only that registry allowlist and emits a versioned [evidence snapshot](cortex-abv/public-repository-observation-snapshot.v1.json) with default branch, head SHA, public timestamps, and explicit unavailable statuses. It never reads repository files, synchronizes content, or writes to GitHub; its Actions workflow has `contents: read` only. Run it with `npm run cortex-abv:observe-public-repositories -- --output /tmp/cortex-abv-public-repository-observation.json`.

The manual `Compare public repository snapshots` workflow compares a committed snapshot baseline with one fresh observer snapshot and saves a proposal-only evidence receipt. Its outcomes are only `no_changes` or `pending_review`; it cannot advance the baseline, start copy sync, create a PR, or change any external surface.

## Verification

Standard checks before pushing:

```bash
npm run content:validate
npm run content:review
npm run lint
npm run build
```

Optional theme smoke check:

```bash
npm run smoke:theme
```

The review report is editorial planning output. It can warn about intentionally free resources or items without purchase links. Structural failures should be fixed before deployment.

## Production Deployment

Production is deployed from the Git repository to Vercel.

Recommended release flow:

```bash
git checkout main
git pull origin main
npm run content:validate
npm run content:review
npm run lint
npm run build
git push origin main
```

If Vercel is connected to `main`, production deployment starts automatically after push.

Manual production deployment, if needed:

```bash
vercel --prod
```

## Environment Variables

Optional:

- `GOOGLE_SITE_VERIFICATION` - Google Search Console verification override.
- `BING_SITE_VERIFICATION` - Bing Webmaster verification override.

Core site rendering does not require a CMS token.

## SEO And Machine Readability

Canonical domain:

```text
https://abvx.xyz
```

Important files:

- `src/app/layout.tsx` - global metadata, JSON-LD, social profile data.
- `src/lib/seo.ts` - shared metadata helpers, JSON-LD builders, OG image metadata, breadcrumbs.
- `src/app/sitemap.ts` - generated sitemap from the file-based content layer. Uses `updatedAt` / `publishedAt` when available and avoids build-time `lastmod` for unchanged content.
- `src/app/robots.ts` - robots configuration.
- `public/llms.txt` - LLM-readable public site map.
- `public/content-index.json` - machine-readable public index of content items with canonical URLs, summaries, tags, links, dates, and relationships.
- `public/og/` - generated social preview images for core sections.
- `next.config.ts` - production redirects and compatibility aliases.

Current metadata behavior:

- Core pages expose page-specific Open Graph and Twitter images.
- `/focus` is both a catalogue and a topic pillar for agro commodity market infrastructure, including definitions, use cases, ecosystem layers, benchmark/monitoring/trading distinctions, and internal links to core market projects.
- `/work/[slug]` uses project media as social preview when available.
- `/books/[slug]` uses book covers or series hero images when available.
- Work detail pages expose structured facts: type, status, section, canonical site, GitHub, and related ecosystem.
- Book detail pages expose structured facts: language, author, translator, official series, related editions, formats, and purchase links.
- Related items are exposed both in UI and schema graph where available.
- Market-index projects, including SPIKE and UGA Index, expose Dataset/DataFeed-oriented semantics.
- Visible FAQ / methodology blocks emit `FAQPage` JSON-LD only on pages that actually render those questions and answers.
- JSON-LD includes `Person`, `Organization`, `WebSite`, `CollectionPage`, `AboutPage`, `ItemList`, work item entities, `Book`, `CreativeWorkSeries`, `BreadcrumbList`, `FAQPage`, and market-index dataset/data-feed semantics.
- Detail hero media uses Next Image, eager loading, and `fetchPriority="high"` for LCP-relevant project/book hero images.

Before production, verify that rendered pages do not expose local paths, preview URLs, debug labels, or internal editorial flags.

Regenerate LLM indexes after editing `/content`:

```bash
npm run llms:generate
```

## Writing / RSS

The writing section reads external RSS feeds through `src/lib/feeds.ts`.

Current sources:

- Medium: `https://abvcreative.medium.com/feed`
- Substack: `https://abvx.substack.com/feed`

RSS failures are handled gracefully. Core site content does not depend on RSS availability.

## Route Compatibility

Old public paths are preserved where useful. Some are hard redirects. Others are lightweight noindex compatibility pages with `follow` robots and canonical links to the stronger current route.

Examples:

- `/ecosystems` redirects to `/systems`.
- `/blog` redirects to `/writing`.
- `/cropto`, `/projects`, `/tech-lab`, `/lang-lab`, `/abvx-press`, and `/links` render compatibility pages with canonical targets.
- `/llmo`, `/work-with-me`, and `/toki-pona` are indexable gateway pages with self-canonical metadata.

Some slug aliases are also redirected to their canonical content routes.

## Repository Map

```text
src/app/              App Router pages, metadata, sitemap, robots
src/components/       Shared UI components
src/content/          Content types, loaders, helpers
src/lib/              RSS, structured data, compatibility helpers
content/              Editable public content files
public/media/         Canonical local media assets
scripts/              Content generators, validators, reports, utilities
docs/                 Editorial workflow and project documentation
```

## Notes For Agents

- Keep `/content` as the editable source of truth.
- For owner-requested Google Drive, Sheets, or Calendar source inspection, use the opt-in [`abvx-google-workspace-read`](skills/abvx-google-workspace-read/SKILL.md) contract. Workspace stays read-only by default and never replaces reviewed Git content.
- Do not edit old registries unless a compatibility fallback requires it.
- Do not redesign pages during content-only tasks.
- For marketing, editorial, and Books visual work, follow the bounded [Design Taste Review](docs/design-taste-review.md). Product UI routes to Lazyweb and UX evidence first.
- Preserve slugs, media paths, redirects, and public URLs unless the task explicitly says otherwise.
- Regenerate `public/llms.txt` and `public/content-index.json` after public content changes.
- Run the full verification chain before reporting production readiness.
