---
{
  "id": "mn7r",
  "slug": "mn7r",
  "type": "brokerage-platform",
  "status": "live",
  "visibility": "public",
  "publishedAt": "2026-05-07",
  "homepageEligible": true,
  "title": "MN7R",
  "shortTitle": "MN7R",
  "summary": "MN7R is a private operating workspace for commodity brokerage teams that consolidates Deals, Clients and EXE into one structured operational system; the codebase documents active private-pilot development, guarded AI assistant surfaces (EXE assistant and a public-safe AI chat), and a bounded 1D3X Cortex integration for protected observations and review.",
  "tags": [
    "brokerage",
    "agro-commodities",
    "deal-workflows",
    "execution",
    "trading-workspace",
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
      "url": "https://mn7r.com/"
    },
    {
      "type": "github",
      "label": "GitHub",
      "url": "https://github.com/markoblogo/mn7r"
    },
    {
      "type": "blog",
      "label": "Blog",
      "url": "https://mn7r.com/blog"
    },
    {
      "type": "bluesky",
      "label": "Bluesky",
      "url": "https://bsky.app/profile/mn7r.bsky.social"
    },
    {
      "type": "substack",
      "label": "Substack",
      "url": "https://mn7r.substack.com/"
    }
  ],
  "sync": {
    "enabled": true,
    "repository": "markoblogo/mn7r",
    "ref": "main",
    "paths": [
      "README.md"
    ],
    "lastAppliedCommit": "fdc854b1f2f211163d2fc3342fefc1b45d172a63",
    "lastAppliedAt": "2026-07-16"
  },
  "featured": true,
  "sortRank": 1,
  "needsCopyReview": false,
  "needsMediaReview": false,
  "needsLinkReview": false,
  "primarySection": "focus",
  "group": "Trading & Brokerage Platforms",
  "media": {
    "src": "/media/work/mn7r/hero.png",
    "alt": "MN7R brokerage platform interface",
    "role": "project-screenshot"
  },
  "heroImage": {
    "src": "/media/work/mn7r/hero.png",
    "alt": "MN7R brokerage platform interface",
    "role": "project-screenshot"
  },
  "updatedAt": "2026-07-16"
}
---

MN7R is a private operating workspace for commodity brokerage teams that replaces fragmented coordination across chats, spreadsheets and scattered notes with one structured operating environment for brokerage execution.

The platform organizes work into three connected operational layers:
- Deals: BID -> OFFER -> MATCH -> TRADE workflow for live market flow
- Clients: indexed company cards, broker ownership, and scoped contact/legal/logistics/banking details
- EXE: post-trade contract support, confirmations, delivery, commission workflow, and EXE officer assignment

What’s new and notable (from this repository):
- Private pilot / proprietary: the project is proprietary commercial software under active pilot development and maintains distinct public and protected surfaces (public site and demo vs protected monitor/workspace).
- Guarded AI surfaces: MN7R exposes a protected EXE assistant (reviewable drafts, internal chat, playbooks, timeline/workbench memory, approval-gated low-risk actions, digests) and a separate public-safe AI chat that answers only from documented public scope. The system does not autonomously send client communications or change payment/contract/banking/execution state.
- 1D3X Cortex integration: a bounded Cortex context layer is used as a governed observation and workforce-packet mechanism for EXE assistant and monitor workflows; it records protected, append-only observations and exports controlled snapshots for analysis without expanding MN7R workflow permissions or bypassing audit and approval gates.
- Agent-ready tooling (repo-local): bundled, conservative agent skills and an experimental guarded operator-terminal pattern exist for safe internal development and operator support; these tools are explicitly read-first / preview-only and do not perform autonomous runtime changes.
- Governance and operational controls: the product includes reference-data dictionaries, templates, imports, audit events, reports, and controlled Telegram relays for operational messaging.

Public vs protected surfaces:
- Public: landing, about, how-to-use, demo (synthetic fixtures only), AI public chat, architecture, security, partners, faq, blog
- Protected: monitor/workspace endpoints and theme lab (e.g. /spike, /spike-monitor redirect)

Repository and run notes (high level):
- Repo contains client (React frontend), server (Express APIs and services), shared schema, migrations, docs, tests, and repo-local agent skills.
- Runtime requires Node.js 22.x, a PostgreSQL-compatible DB, and environment variables (DATABASE_URL, SESSION_SECRET, JWT_SECRET). Protected flows and Cortex context reads require additional env vars documented in .env.example.
- Verification and local checks are provided (npm scripts, smoke checks, CI survey).

Positioning and intent:
MN7R remains focused on clearer ownership, stronger execution discipline, cleaner team visibility and better post-trade control for brokerage workflows without overcomplicating daily broker tasks. The repository documents emphasize conservative, review-first AI/agent usage, controlled integration points, and operational guardrails.
