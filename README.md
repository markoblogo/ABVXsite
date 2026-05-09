# ABVXsite

[![Website](https://img.shields.io/badge/Website-abvx.xyz-111827?logo=vercel&logoColor=white)](https://abvx.xyz/)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-UNLICENSED-lightgrey)

Production source for [abvx.xyz](https://abvx.xyz/), built with Next.js App Router, TypeScript, and a Git-based public content registry.

## Site Concept

ABVX is the working index of Anton Biletskiy-Volokh: strategy, AI-native development, market infrastructure, web services, protocols, language experiments, books, translations, and essays.

The redesigned public IA is:

- `/` - overview, poster hero, latest updates, and entry points.
- `/focus` - current focus on agro-commodity trading infrastructure.
- `/systems` - systems catalogue for web services, AI workflows, protocols, tools, language experiments, and technical companions.
- `/books` - ABVX Press: books, translations, series, free editions, and publishing projects.
- `/writing` - combined Medium and Substack writing archive.
- `/about` - professional framing, contact, and profile links.
- `/work/[slug]` - non-book artifact detail pages.
- `/books/[slug]` - book and publishing detail pages.

Legacy URLs are preserved with redirects in `next.config.ts`.

## Local Development

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run lint
npm run build
npm run smoke:theme
```

The core redesigned pages build without `NOTION_TOKEN`.

## Content Editing Workflow

Core public content lives in `src/content`:

- `src/content/types.ts` - content model and allowed values.
- `src/content/artifacts.ts` - focus and systems artifacts.
- `src/content/books.ts` - books, series, translations, free editions, and publishing items.
- `src/content/index.ts` - helper functions consumed by pages.
- `public/media` - local public images and PDFs used by content cards and detail pages.

Each item has one canonical home through `primarySection`, but can appear elsewhere through `appearsIn`.

Common examples:

- A market infrastructure project is usually `primarySection: 'focus'` and `appearsIn: ['focus', 'systems']`.
- A technical tool is usually `primarySection: 'systems'` and `appearsIn: ['systems']`.
- A book is usually `primarySection: 'books'` and `appearsIn: ['books']`.
- A book companion or language project may appear in both `books` and `systems`.

If a URL is not verified, omit it from `links` and set `needsReview: true`.

See [docs/content-editing.md](docs/content-editing.md) for detailed examples.

To re-run the one-off public media migration from the legacy public pages:

```bash
npm run migrate:public-media
```

The migration stores stable local files under `public/media` and writes a review map to `content-migration/media-map.json`. Do not paste temporary Notion asset URLs or old Next.js image optimizer URLs into `src/content`.

## RSS Integration

The writing layer uses RSS helpers in `src/lib/feeds.ts`.

Current feeds:

- Medium: `https://abvcreative.medium.com/feed`
- Substack: `https://abvx.substack.com/feed`

Homepage and `/writing` both handle RSS failures gracefully. If a feed request fails, the page renders fallback cards or an unavailable-feed panel instead of crashing.

RSS content is external and should not be treated as the source of truth for core site IA.

## Deployment Notes

The site is intended for Vercel deployment through Git integration.

Before preview or production deployment:

```bash
npm run lint
npm run build
```

Environment variables:

- `GOOGLE_SITE_VERIFICATION` - optional Google verification token.
- `BING_SITE_VERIFICATION` - optional Bing verification override.
- `NOTION_TOKEN` - optional legacy export/compatibility token only. It is not required for core redesigned pages.

Do not commit secrets. If legacy Notion export is needed locally, set `NOTION_TOKEN` in the shell and run:

```bash
npm run export:legacy-content
```

## SEO / LLM Readability

- Canonical domain: `https://abvx.xyz`
- Sitemap: `src/app/sitemap.ts`
- Robots: `src/app/robots.ts`
- LLM-readable site map: `public/llms.txt`
- JSON-LD: `src/app/layout.tsx`

The sitemap is generated from the new Git content layer and does not require Notion.

## Legacy Compatibility

Old routes are kept as compatibility paths or redirect sources, but they are not the current public IA.

Redirects are configured in `next.config.ts`; examples include old project, grouped-index, topic, profile-links, and work/contact URLs redirecting into `/focus`, `/systems`, `/books`, `/writing`, or `/about`.

## ASCII Theme

The source still contains the experimental ASCII theme support and theme smoke-check script. The redesigned layout does not rely on the old ASCII theme as its primary visual system.
