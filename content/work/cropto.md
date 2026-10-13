---
{
  "id": "cropto",
  "slug": "cropto",
  "type": "trading-platform",
  "status": "research",
  "visibility": "public",
  "publishedAt": "2026-05-06",
  "homepageEligible": true,
  "title": "Cropto",
  "shortTitle": "Cropto",
  "summary": "Cropto explores indexed trading, commodity-linked instruments and settlement traceability. Standalone application development is paused while work prioritizes the wider AMI ecosystem.",
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
      "url": "https://github.com/markoblogo/cropto"
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
    "lastAppliedCommit": "294f8aaf4e4f0ba7d9131c075213aabbfffc369f",
    "lastAppliedAt": "2026-07-21"
  },
  "autonomousPublicSync": {
    "enabled": true,
    "mode": "direct_main",
    "target": "abvxsite",
    "authorOsProjectContext": "Owner-provided AMI introductions (2026-10-13) confirm that standalone Cropto development is paused while work prioritizes the AMI ecosystem. Preserve this state; active development or a current update cadence requires new owner confirmation.",
    "allowedPatchFields": [
      "summary",
      "bodyAppendix",
      "updatedAt",
      "sync.lastAppliedCommit",
      "sync.lastAppliedAt"
    ]
  },
  "publicCopy": {
    "bodyMode": "append_only",
    "allowedThemes": [
      "indexed commodity market exposure across Ukraine, Argentina and Brazil",
      "spot markets, options and tokenized commodity-linked instruments",
      "cash-settled risk management using local commodity indices"
    ],
    "forbiddenTerms": [
      "Sea Brokerage",
      "monitor",
      "demo",
      "staging",
      "backend",
      "wallet",
      "waitlist"
    ]
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
  "updatedAt": "2026-10-14"
}
---

Cropto is a prototype infrastructure platform for trading and risk management around commodity-linked instruments.

The system combines tokenized settlement logic with off-chain commodity index feeds. Instruments are cash-settled against local spot indices rather than tied to physical delivery itself.

The platform is designed to separate price-risk management from physical grain logistics:
- price exposure can be traded financially,
- hedging does not require physical delivery,
- logistics flows stay operational rather than speculative,
- blockchain infrastructure is used for auditability, transparency and settlement logic where it adds practical value.

The platform currently focuses on indexed spot markets, options and tokenized commodity exposure around Ukraine, Argentina and Brazil.

Users can choose a commodity market, connect a wallet, create or take orders, track margin and settlement, and manage indexed commodity exposure.

Standalone application development is currently paused while work prioritizes the wider AMI ecosystem. The existing prototypes remain experimental.

The repository includes a concrete Railway deployment path and a public verification target at https://cropto.abvx.xyz.
