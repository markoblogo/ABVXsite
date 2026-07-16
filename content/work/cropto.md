---
{
  "id": "cropto",
  "slug": "cropto",
  "type": "trading-platform",
  "status": "building",
  "visibility": "public",
  "publishedAt": "2026-05-06",
  "homepageEligible": true,
  "title": "Cropto",
  "shortTitle": "Cropto",
  "summary": "Cropto is an early-stage prototype commodity trading and market-monitoring platform for indexed spot, options, forwards and tokenized commodity-linked instruments, with active brokerage workflow modules and a visible Sea Brokerage Monitor — focused on markets in Ukraine, Argentina and Brazil.",
  "tags": [
    "cropto",
    "agro-commodities",
    "trading-platform",
    "indexed-trading",
    "options",
    "tokenized-assets",
    "market-infrastructure"
  ],
  "appearsIn": [
    "focus",
    "systems"
  ],
  "links": [
    {
      "type": "site",
      "label": "Site",
      "url": "https://cr0pto.com/"
    },
    {
      "type": "github",
      "label": "GitHub",
      "url": "https://github.com/markoblogo/cropto-v0"
    },
    {
      "type": "youtube",
      "label": "YouTube",
      "url": "https://youtu.be/zumLJKZQFxc"
    }
  ],
  "sync": {
    "enabled": true,
    "repository": "markoblogo/cropto",
    "ref": "main",
    "paths": [
      "README.md"
    ],
    "lastAppliedCommit": "2f4f075cf1046691338f3df4e3fa5191ec9e1fd9",
    "lastAppliedAt": "2026-07-16"
  },
  "featured": true,
  "sortRank": 10,
  "needsCopyReview": false,
  "needsMediaReview": false,
  "needsLinkReview": false,
  "primarySection": "focus",
  "group": "Trading & Brokerage Platforms",
  "media": {
    "src": "/media/work/cropto/hero.webp",
    "alt": "Cropto trading platform interface",
    "role": "project-screenshot"
  },
  "heroImage": {
    "src": "/media/work/cropto/hero.webp",
    "alt": "Cropto trading platform interface",
    "role": "project-screenshot"
  },
  "updatedAt": "2026-07-16"
}
---

Cropto is an early-stage prototype infrastructure platform for trading, market monitoring, brokerage workflows and risk management around commodity-linked instruments.

The repository contains the current Cropto MVP: the main web application, a Node/Express backend, market-data ingestion and normalization paths, background jobs, and active workflow modules — notably a Sea Brokerage Monitor broker workspace.

Key product areas and capabilities

- Market monitoring surfaces: dashboards and monitor pages for commodity, logistics, weather, and related market signals backed by ingestion and API queries.
- Trading and risk workflow surfaces: spot, options, forward-market, wallet, portfolio and related workflow routes across the main app.
- Sea Brokerage Monitor: a compact broker workspace (dual-pane OFFERS/BIDS, fast create flows, rolling Best Current Matches, detail sheet and filtering) identified in this repo as one of the clearest active product modules.
- Admin and operational tools: feedback, reconciliation, audit, waitlist, partner and contract-management routes.
- Data and ingestion backend: background jobs, polling, normalization, monitoring services, and API routes that power the product surfaces.

Implementation and status notes

- The project is in active prototype / staging mode. Parts of the product are interactive and partner-reviewable while integrations and some operational flows are still being hardened.
- Sea Brokerage Monitor UX is implemented client-side with seeded demo data for QA and partner walkthroughs; it is prepared for future backend/relay integration but currently lacks full backend persistence for brokerage entries.
- Contract-related sources, Hardhat/ethers tooling and on-chain configuration hooks are present in the repo, supporting future on-chain/tokenized workflows alongside off-chain index feeds.

Tech and repo shape

- Frontend: React 18 + TypeScript, Vite, TanStack Query, Tailwind, MapLibre GL and other tooling.
- Backend: Node.js 22 + Express, TypeScript, Drizzle ORM, PostgreSQL-compatible db, Zod validation.
- The repo includes deployment tooling (Railway config), build scripts, tests, and docs to run a staging/demo instance (staging target referenced in repo). 

Important practical caveats

- Product maturity is uneven across modules; some UX flows are polished while underlying integrations remain prototype-grade.
- Some features rely on mock/demo or local-state behavior; operational and end-to-end persistence work remains in progress.

This copy reflects the repository's current public-facing MVP shape and the prominence of the Sea Brokerage Monitor and monitoring/trading workflow surfaces.
