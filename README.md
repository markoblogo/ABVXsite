# ABVXsite

[![Website](https://img.shields.io/badge/Website-abvx.xyz-111827?logo=vercel&logoColor=white)](https://abvx.xyz/)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-UNLICENSED-lightgrey)

Production source for [abvx.xyz](https://abvx.xyz/): the public ABVX ecosystem site for market infrastructure, AI-native systems, publishing, language experiments, books, and writing.

The site is built with Next.js App Router, TypeScript, React, local Markdown content files, local media assets, structured metadata, and public LLM-readable indexes.

## Public Structure

The current production information architecture is:

- `/` - overview, latest entry points, and high-level ABVX positioning.
- `/focus` - agro-commodity market infrastructure: trading platforms, brokerage workflows, monitoring, indexes, and partner fronts.
- `/systems` - operational systems architecture: market systems, publishing/language systems, AI-native development systems, and standalone utilities.
- `/books` - ABVX Press: official publishing lines, standalone books, free resources, and companion publishing systems.
- `/writing` - Medium and Substack writing archive.
- `/about` - professional framing, working method, contact, and profile links.
- `/work/[slug]` - detail pages for projects, tools, protocols, systems, landing pages, and work items.
- `/books/[slug]` - detail pages for books, official publishing lines, free resources, and series.

Legacy public paths redirect into the current structure through `next.config.ts`.

Detail pages include visible breadcrumb links and entity-oriented "Key facts" blocks so users, search engines, and LLM agents can understand where each item belongs.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4 pipeline
- File-based content in `/content`
- Local public media in `/public/media`
- Page-specific Open Graph / Twitter images
- JSON-LD for global identity, collection pages, work items, books, series, item lists, and breadcrumbs
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

Do not write local machine paths into content files. Public media references should use paths such as:

```text
/media/work/mn7r/hero.png
/media/books/dark-gestalt/cover.png
/media/series/modernisme-ukrainien/hero.png
```

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

Run validation, review, and LLM index generation before build or deployment when content has changed.

## Verification

Standard checks before pushing:

```bash
npm run content:validate
npm run content:review
npm run llms:generate
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
npm run llms:generate
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
- `/work/[slug]` uses project media as social preview when available.
- `/books/[slug]` uses book covers or series hero images when available.
- Work detail pages expose structured facts: type, status, section, canonical site, GitHub, and related ecosystem.
- Book detail pages expose structured facts: language, author, translator, official series, related editions, formats, and purchase links.
- JSON-LD includes `Person`, `WebSite`, `CollectionPage`, `AboutPage`, `ItemList`, work item entities, `Book`, `CreativeWorkSeries`, and `BreadcrumbList`.

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

Old public paths are preserved as redirects where useful.

Examples:

- `/projects` -> `/systems`
- `/abvx-press` -> `/books`
- `/tech-lab` -> `/systems`
- `/lang-lab` -> `/systems`
- `/cropto` -> `/focus`

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
- Do not edit old registries unless a compatibility fallback requires it.
- Do not redesign pages during content-only tasks.
- Preserve slugs, media paths, redirects, and public URLs unless the task explicitly says otherwise.
- Regenerate `public/llms.txt` and `public/content-index.json` after public content changes.
- Run the full verification chain before reporting production readiness.
