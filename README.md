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

The homepage leads with selected projects and collaboration. Writing offers full-text native search, external title/description search, source filters and a [complete archive](https://abvx.xyz/writing/archive). Native articles also have five navigation topics: Psychology, Kitchen Notes, AI & Technology, Business & Work, and Other. An article can appear in several topics without becoming several posts; these topics do not change Book Readiness or manuscript membership.

Articles offer related reading, numbered-series navigation where available, collection links and an optional Substack subscription link. Project, book and series pages support labelled video galleries; existing catalogue groups also support videos through the same publisher. Book audio loads on request. Native articles support original inline photographs with captions after an exact heading or paragraph, plus Markdown tables and fragment dividers. Book descriptions can have separate English and French presentation without implying a translated edition.

## Subscribe

Visible RSS links are available on Writing, each selected topic, Kitchen Notes, Working Stories, Books and Projects. The [Writing feed](https://abvx.xyz/rss/writing.xml) and its five topic feeds include full native text, structured recipe details, covers and inline illustrations. [Books RSS](https://abvx.xyz/rss/books.xml) and [Projects RSS](https://abvx.xyz/rss/projects.xml) include complete card descriptions and covers. The feeds read current public runtime sources and preserve canonical URLs as stable identities; external Medium/Substack archives keep their own feeds. See the [feed directory and behavior](docs/site-operations.md#public-rss-subscriptions).

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

Start with the [documentation index](docs/README.md), then use the owning guide instead of copying a publication process into each task:

| Task | Guide |
| --- | --- |
| Prepare prose, media, fields or placement | [Content editing](docs/content-editing.md) · [Content format](docs/content-workflow.md) |
| Publish accepted posts/cards/series/groups or add a video | [Runtime publisher](docs/runtime-writing.md) · [Runtime catalogue](docs/runtime-catalogue.md) |
| Review engineering, documentation or legacy Git publications | [Release checklist](docs/editorial-seo-checklist.md) · [OS handoff](docs/abvx-os-publishing.md) |
| RSS, imported feeds, discovery, analytics and backups | [Site operations](docs/site-operations.md) · [Recovery](docs/runtime-recovery.md) |
| Localized pages, exports, integrations and historical audits | [Documentation index](docs/README.md) |

Agents read `AGENTS.md`, this README, then only the relevant guide. Preserve public slugs, canonical URLs, redirects and existing media paths. Use reviewed PRs and the documented release checks for engineering. Documentation-only changes use the existing build-skip policy and are verified on GitHub; runtime content uses its own receipt contract. A successful Preview, stored content receipt, verified live page and Google indexing are distinct outcomes.

This repository owns public presentation. `ABVX-OS` and `CortexABV-private` own separate private operational/knowledge state; no private runtime is deployed by the site. Keep secrets and private measurement records out of public content.

Public discovery: [sitemap](https://abvx.xyz/sitemap.xml), [LLM index](https://abvx.xyz/llms.txt), [content index](https://abvx.xyz/content-index.json), [ecosystem registry](https://abvx.xyz/ecosystem.json).

<!-- ABVX:ECOSYSTEM:BEGIN -->
## ABVX ecosystem

- [lab.abvx](https://lab.abvx.xyz/) — Presents the developer-tool catalogue inside the wider ABVX ecosystem. Current release: `v0.2.0`.
- [abvx-shortener](https://go.abvx.xyz/) — Uses stable short links for public campaigns and QR destinations. Current release: `v0.4.0`.

_This block is generated from the reviewed ABVX ecosystem registry._
<!-- ABVX:ECOSYSTEM:END -->
