Personal site for Anton Biletskyi-Volokh.

Live: https://abvx.xyz

## Getting Started

Install deps and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Data sources

Content is pulled from Notion databases via the server-side helpers in `src/lib/notion.ts`
and `src/lib/abvx-data.ts`.

Required env (see `.env.example`):
- `NOTION_TOKEN`
- `NOTION_VERSION`

## Key routes

- `/projects` - products/tools with demos and links
- `/books` - publishing projects grouped by ecosystem
- `/writing` - unified Medium + Substack feed
- `/ecosystems` - grouped workstreams
- `/work-with-me` - consulting/engagements

## SEO / LLMO

- Canonical domain: https://abvx.xyz
- `sitemap.ts` and `robots.ts` are configured
- `public/llms.txt` provides a compact site map for LLMs
- JSON-LD includes Person, WebSite, and ItemList markup

## Notes

- Images from Notion are optimized via `next/image` using `remotePatterns` in `next.config.ts`.
- `src/components/zoomable-image.tsx` provides click-to-zoom previews.
