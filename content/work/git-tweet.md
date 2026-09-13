---
{
  "id": "git-tweet",
  "slug": "git-tweet",
  "type": "tool",
  "status": "live",
  "visibility": "public",
  "publishedAt": "2026-04-23",
  "homepageEligible": true,
  "title": "git-tweet",
  "summary": "Self-hosted GitHub release announcements for X and Bluesky, with repository-wide release discovery, deduplication, logs, and retries.",
  "tags": [
    "github",
    "release-automation",
    "x",
    "bluesky",
    "self-hosted"
  ],
  "appearsIn": [
    "systems"
  ],
  "links": [
    {
      "type": "site",
      "label": "Site",
      "url": "https://git-tweet.abvx.xyz/"
    },
    {
      "type": "github",
      "label": "GitHub",
      "url": "https://github.com/markoblogo/git-tweet"
    }
  ],
  "featured": false,
  "sortRank": 510,
  "needsCopyReview": false,
  "needsMediaReview": false,
  "needsLinkReview": false,
  "editorialNotes": "Migrated from TypeScript registry; review copy/media/links before final polish.",
  "primarySection": "systems",
  "group": "Workflow & Orchestration",
  "media": {
    "src": "/media/work/git-tweet/hero.webp",
    "alt": "git-tweet workflow interface",
    "role": "project-screenshot"
  },
  "heroImage": {
    "src": "/media/work/git-tweet/hero.webp",
    "alt": "git-tweet workflow interface",
    "role": "project-screenshot"
  },
  "updatedAt": "2026-09-13"
}
---

git-tweet turns new GitHub releases into controlled X and Bluesky announcements. It watches the public repository set, processes releases one at a time, and records delivery state so retries do not create duplicate posts.

The service is self-hosted and keeps release discovery, message preparation, delivery logs, and retry behavior visible to the operator. It complements AGENTS.md Generator and the wider ABVX toolchain by publishing verified release outcomes rather than raw development activity.
