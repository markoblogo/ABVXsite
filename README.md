# ABVXsite

[![Website](https://img.shields.io/badge/Website-abvx.xyz-111827?logo=vercel&logoColor=white)](https://abvx.xyz/)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-UNLICENSED-lightgrey)

Production source for [abvx.xyz](https://abvx.xyz/), built with Next.js App Router and TypeScript.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Minimum required:

- `NOTION_TOKEN` - server-side token for Notion API access.

Optional:

- `GOOGLE_SITE_VERIFICATION` - injected into metadata verification tags.
- `BING_SITE_VERIFICATION` - optional override for Bing verification.

Build note: static generation for `sitemap.xml` pulls Notion data; without `NOTION_TOKEN`, production build fails.

## Notion data model

Content is loaded server-side from Notion data sources in `/src/lib/abvx-data.ts` using helpers in `/src/lib/notion.ts`.

Primary datasets:

- Ecosystems
- Projects
- Books

The app maps Notion properties into typed view models (`Ecosystem`, `Project`, `Book`) and uses those models across pages.

## Main routes

- `/` - homepage and positioning
- `/work-with-me` - services and engagement format
- `/ecosystems` and `/ecosystems/[slug]` - ecosystem index and detail pages
- `/projects` - projects and tools
- `/books` and `/books/[slug]` - publishing catalog
- `/writing` - writing feed
- `/llmo` - LLM visibility/pack context
- `/links`, `/about`, `/toki-pona`, `/cropto`

## Deployment (Vercel)

Typical production flow:

```bash
npm run build
```

Then deploy through Vercel (Git integration or `vercel --prod` from a configured environment).

Ensure production env vars are set in Vercel, especially `NOTION_TOKEN`.

## SEO / LLMO

- Canonical domain: `https://abvx.xyz`
- `src/app/sitemap.ts` and `src/app/robots.ts` generate sitemap/robots
- `public/llms.txt` provides a compact LLM-readable map
- JSON-LD is injected in `src/app/layout.tsx` (Person + WebSite)

## ASCII theme

The site includes an experimental ASCII theme mode (toggle in the header).

It uses [AsciiTheme](https://github.com/markoblogo/AsciiTheme).
