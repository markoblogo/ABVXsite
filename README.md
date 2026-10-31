# ABVXsite — abvx.xyz

[![Website](https://img.shields.io/badge/Website-abvx.xyz-111827?logo=vercel&logoColor=white)](https://abvx.xyz/)
[![CI](https://github.com/markoblogo/ABVXsite/actions/workflows/ci.yml/badge.svg)](https://github.com/markoblogo/ABVXsite/actions/workflows/ci.yml)

Professional portfolio and working catalogue of **Anton Biletskyi-Volokh**: marketing, creative direction, product management and AI-enabled digital transformation. Projects, experience and collaboration lead the public navigation; books and writing remain the author library. The catalogue covers roughly the last 12–18 months; earlier career experience is described on About and in selected Working Stories.

## Explore

| Page | Content |
| --- | --- |
| [Projects](https://abvx.xyz/systems) | Recent products, platforms, tools and AI workflows |
| [Experience](https://abvx.xyz/about) | Professional background and earlier work |
| [Work with me](https://abvx.xyz/work-with-me) | Consulting, marketing/creative leadership, product management and digital transformation |
| [Focus](https://abvx.xyz/focus) | Agro-commodity projects, brokerage, market intelligence and AMI |
| [Books](https://abvx.xyz/books) | Books, translations, series, free editions and companions |
| [Writing](https://abvx.xyz/writing) | Native articles, Working Stories, Kitchen Notes, Medium, Substack and YouTube |

The homepage leads with selected projects and collaboration. Writing offers full-text native search, external title/description search, source filters and a [complete archive](https://abvx.xyz/writing/archive). Articles offer related reading, numbered-series navigation where available, collection links and an optional Substack subscription link. Project, book and series pages support labelled videos; book audio loads on request.

## Run locally

Use **Node.js 24** to match CI, and the committed lockfile:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. For a production build, use `npm run build`, then `npm run start`.

Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 and Vercel. Exact versions are in `package.json` and `package-lock.json`.

## Content and development

Bundled public sources live in `content/`: projects, books, series, native articles, Working Stories, editorial guides and page metadata. Managed runtime records use the private versioned content store as their authority; the bundled files remain the legacy baseline. Routine approved posts, catalogue cards, book series and catalogue groups use the same authenticated publisher without a Git change or rebuild. Bundled assets live in `public/media/`; runtime uploads use the authenticated store and authoritative media routes. For **bundled edits**, regenerate `public/llms.txt` and `public/content-index.json` with `npm run llms:generate` after public content changes; commit outputs with their sources. Runtime publications update live discovery without regenerating committed files.

Use the appropriate guide instead of copying a publication process into each task:

| Task | Guide |
| --- | --- |
| Edit content, media, placement or localized guides | [Content editing](docs/content-editing.md) · [Fields and format](docs/content-workflow.md) |
| Fast publication of posts, cards, series and catalogue groups | [Runtime publisher](docs/runtime-writing.md) · [Catalogue packet contract](docs/runtime-catalogue.md) |
| Legacy publication or engineering changes; record measurements | [Publication handoff](docs/abvx-os-publishing.md) |
| Validate, review and verify a release | [Editorial SEO checklist](docs/editorial-seo-checklist.md) |
| Maintain the three EN/FR/UK profile pages | [Static localization](docs/static-localization.md) |
| Back up runtime content, verify recovery or diagnose availability | [Recovery and monitoring](docs/runtime-recovery.md) |
| Diagnose feeds, discovery, analytics or runtime behavior | [Site operations](docs/site-operations.md) |
| Export story/recipe collections | [Working Stories](docs/working-stories.md) · [Kitchen Notes](docs/kitchen-notes.md) |
| Work on integrations | [CortexABV adapter](cortex-abv/README.md) · [Copy sync](docs/project-description-sync.md) · [Ecosystem sync](docs/ecosystem-sync.md) |

Agents read `AGENTS.md`, this README, then only the relevant guide. Preserve public slugs, canonical URLs, redirects and existing media paths. Use reviewed PRs and the documented release checks; a successful Preview is not proof of production publication or search indexing.

This repository owns public presentation. `ABVX-OS` and `CortexABV-private` own separate private operational/knowledge state; no private runtime is deployed by the site. Keep secrets and private measurement records out of public content.

Public discovery: [sitemap](https://abvx.xyz/sitemap.xml), [LLM index](https://abvx.xyz/llms.txt), [content index](https://abvx.xyz/content-index.json), [ecosystem registry](https://abvx.xyz/ecosystem.json).

<!-- ABVX:ECOSYSTEM:BEGIN -->
## ABVX ecosystem

- [lab.abvx](https://lab.abvx.xyz/) — Presents the developer-tool catalogue inside the wider ABVX ecosystem. Current release: `v0.2.0`.
- [abvx-shortener](https://go.abvx.xyz/) — Uses stable short links for public campaigns and QR destinations. Current release: `v0.4.0`.

_This block is generated from the reviewed ABVX ecosystem registry._
<!-- ABVX:ECOSYSTEM:END -->
