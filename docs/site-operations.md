# ABVXsite operations

This guide owns runtime/feed behavior, diagnostics, measurement, and code navigation. Content format belongs in [content-workflow.md](content-workflow.md); release steps belong in [editorial-seo-checklist.md](editorial-seo-checklist.md).

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/app/` | App Router pages, sitemap, robots, global identity, and analytics script |
| `src/components/` | Catalogue/detail UI, writing cards, YouTube embeds, and link event classes |
| `src/content/` | Types, loaders, relationship helpers, legacy fallbacks, and service-page definitions |
| `src/lib/` | SEO/JSON-LD, feed parsing, allowed hosts, and compatibility helpers |
| `content/` | Editable public records and configuration |
| `public/media/`, `public/og/` | Public assets and social previews |
| `scripts/`, `test/` | Generators, validation, smoke checks, and behavior tests |
| `.github/workflows/` | CI, proposal review, read-only observation, and bounded ecosystem sync |
| `cortex-abv/` | Public adapter contracts and an auditable static runtime snapshot |

Global identity metadata is in `src/app/layout.tsx`; shared schema and metadata builders are in `src/lib/seo.ts`. Sitemap and robots are `src/app/sitemap.ts` and `src/app/robots.ts`. `next.config.ts` owns redirects and the security policy. Do not change slugs or redirect targets to solve a copy-only task.

## Writing sources

`src/app/writing/page.tsx` uses the committed native/discovery registry with immutable first-addition chronology:

| Source | Feed/configuration | Display |
| --- | --- | --- |
| Medium | `https://abvcreative.medium.com/feed` | Article cards linking to the source |
| Substack | `https://abvx.substack.com/feed` | Article cards linking to the source |
| YouTube | `content/youtube.json` | Featured player, compact recent preview, and text-only archive links |

Writing and the three existing homepage publication slots use the same mixed-source list, sorted by immutable `addedAt` (UTC) from `content/writing-discovery.json`. Each slot can contain any source; labels and links describe their actual destinations. A native video companion opens ABVX, while imported YouTube cards open their automatic ABVX watch page. MN7R is not part of this publication list.

Feed HTTP access retains the existing host allowlists and parsers. The approximately 15-minute `writing-feed-sync.yml` workflow records first additions and refreshes public metadata with `npm run writing:sync`; a manual workflow dispatch is available. It reuses the existing `ECOSYSTEM_SYNC_TOKEN`, commits only the discovery registry and its two generated machine indexes, and triggers the normal deployment. GitHub schedule delays and deployment time mean this is not an exact delivery deadline. No change means no commit/deployment. Source failures preserve stored items, including videos that leave YouTube's 15-entry feed.

Native Writing and Working Stories are registered by `npm run writing:register` during prebuild. Commit the changed registry with the approved source. Rebuilds, edits, `updatedAt`, and feed retries never reset `addedAt`. Original publication/upload dates remain separate and continue to supply article/video metadata. Writing cards display the addition date; the article itself retains its original publication date. Same-time additions use original publication time, then URL as a deterministic tie-breaker.

If a feed is unavailable from the GitHub runner, sync retries through the public `/api/writing/feed/<source>` endpoint on ABVX. That endpoint accepts only Medium, Substack and YouTube, exposes public metadata rather than article bodies, and reuses the same fixed URLs, parsers and host allowlists. If both paths fail, keep the saved source. The endpoint is marked `noindex`; it is not a new editorial page or a general URL proxy.

Historical migration uses `addedAtBasis: legacy-source` where the first appearance is unknown; this is a fallback, not recovered evidence. The three October 10 pilot pages use production-ready time `16:06:30Z` (GitHub deployment 6983374035), and the flour case uses `12:17:48Z` (6980593513), marked `production`. New registrations use `observed`: the time they enter the site's committed publication registry, followed by deployment. Do not rewrite historical times on every sync or treat them as source publication dates.

### YouTube policy

- Channel: `UCwivRjryrkmZ3bMHUmNtykg`, [ABV Creative](https://www.youtube.com/@ABV_Creative).
- Cutoff: `publishedAfter` in `content/youtube.json`, initially `2026-10-09T19:52:23Z`.
- Include videos published **strictly after** the cutoff, plus `initialVideoId` (`RsxiDWDj2Rg`) as one pinned test exception. `initialVideo` stores its title, actual publication time, and summary locally. An updated timestamp does not import an older upload.
- The public channel feed provides its latest 15 entries. Subsequent discovered uploads are persisted in the Writing registry. The initial exception is retained from local metadata when absent from the feed, including during feed failure.
- Parsing validates channel, ID, title, and publication time; duplicate, invalid, and future-dated entries are ignored. Invalid cutoff configuration produces no videos. `content:validate` rejects invalid channel/feed URLs, inconsistent IDs, dates, or incomplete pinned metadata before release.
- `src/components/YouTubeEmbed.tsx` validates the watch URL and constructs a `youtube-nocookie.com` iframe. Players are lazy-loaded, responsive, inline on supported mobile browsers, and do not autoplay. They use 16:9 where space permits and a minimum height of 200 px on narrow screens. The featured publication keeps its inline player. Recent videos use the same image/body layout as articles; their preview opens a native modal with a full-size player, which is removed on close to stop playback. Archive rows contain only text and a YouTube link, without previews or players.
- No API key, webhook, paid service, or new dependency is required. Do not widen iframe permissions or allowed hosts for a routine feed change.

If a video is missing, check publication time, the configured cutoff/exception, presence in the latest-15 feed, embed availability, and cache age. Test the real player and 375/390 px layouts when changing embed UI. A displayed thumbnail is not proof of successful playback.

Discovered YouTube videos now receive `/writing/videos/<video-id>` watch pages from the committed registry: main embedded player, complete owner-written feed description when available, actual upload date, self-canonical metadata and VideoObject. They appear in sitemap, content-index and llms.txt. Short descriptions retained before this change use their stored excerpt until a successful source refresh; no transcript or authored analysis is invented. A public, live native authored companion supersedes its automatic watch page only after its publication date has passed **and** it is listed in the generated `content-index.json` companion snapshot. Runtime routes and feeds use that deployed snapshot, so a date crossing alone cannot change a redirect while the static indexes still advertise the automatic page. The existing 15-minute Writing sync regenerates the snapshot and indexes and commits a change for deployment when a scheduled companion becomes eligible; workflow/deployment delays can postpone activation. Until that deployment, the automatic page remains available. After activation, it permanently redirects to the companion and is excluded from the automatic sitemap/index set. Archive/building/private companions do not replace it. Omitted visibility uses the public default; every eligible translated companion remains in the snapshot, feeds and indexes.

The public fallback endpoint sends `no-store`; upstream Writing feed fetches for Substack, Medium and YouTube also bypass the framework data cache. MN7R feed fetches retain their 900-second revalidation cache because Focus and related work/book pages fetch them during rendering. Article/image lookups keep their existing cache. This prevents the fallback API from serving an older cached RSS response to a successful sync. The scheduler may still be late, YouTube may update its feed late, and a new discovery requires a deployment; 15 minutes is a polling cadence, not a delivery guarantee. Diagnostics are available from the existing workflow logs. No API key, transcript scraper, new service or model is introduced.

## Catalogue addition chronology

The homepage Focus, Systems and Books cards use immutable first-addition times from `content/catalogue-discovery.json`, rather than `updatedAt`, GitHub activity or releases of existing products. `npm run catalogue:register` runs before builds; commit its output with each new public work/book/series record. CI rejects uncommitted registration changes. Existing timestamps survive edits, removals, re-additions and repeated builds. Equal-time additions use the existing catalogue rank/title tie-breaker.

The initial migration uses known source publication dates (`legacy-source`); undated legacy entries remain `null` (`legacy-unknown`) and do not compete for latest cards. The four Good Dogs/Jekyll book records use the verified production deployment time of PR26 (`production`, 2026-10-06T14:16:40.000Z). `--bootstrap` is migration-only; ordinary registration always records current UTC once (`observed`). Original content publication/update dates remain unchanged.

## Analytics

The existing Plausible script is loaded by `src/app/layout.tsx`. Existing links carry the official CSS-based event classes; adding tracking does not require converting a server component to a client component.

| Event / dashboard goal | Class | Meaning |
| --- | --- | --- |
| `Book Link Click` | `plausible-event-name=Book+Link+Click` | Retailer, download, or book-site link click from book actions |
| `Contact Click` | `plausible-event-name=Contact+Click` | Explicit email/direct-contact action; not every social-profile link |
| `Collaboration Click` | `plausible-event-name=Collaboration+Click` | Passionfroot or Collabstr offer link click |

These three custom-event goals were configured in the authenticated Plausible dashboard on 2026-10-09. Goal configuration lives outside Git; confirm it in the dashboard when recovering or changing analytics. Existing outbound-link and AMI tracking remain separate.

The shared offers and URLs live in `content/collaborations.json` and are consumed on About and in the footer. Preserve `target="_blank"` and `rel="noopener noreferrer"` for external collaboration links.

Click events measure intent, not completed sales, delivered messages, or booked collaborations. They cannot reconstruct separated historical conversions from older outbound-link totals. Do not send automated QA events to production: intercept analytics requests during local click tests, verify event names/targets, and confirm mobile wrapping.

### Comparison procedure

Use two complete, equal 28-day windows in Europe/Paris time, excluding the current incomplete day. Compare visitors, visits, pageviews, entry pages, referrers, and each goal's unique visitors/events/conversion rate. Use the same filter and goal definitions in both windows.

The first full period after the new goals is **2026-10-10–2026-11-06**; the next is **2026-11-07–2026-12-04**. Missing historical category data is unavailable, not zero. Small samples and owner/test visits limit interpretation; Direct/None does not identify a specific source, and timing alone does not attribute growth to an edit. No recurring review automation is configured by this guide.

Pair Plausible with Search Console impressions, queries, positions, clicks, indexing, and sitemap processing. A valid public sitemap is not proof that Google processed or indexed it successfully.

## Verification and access diagnostics

Use the [release checklist](editorial-seo-checklist.md) for the complete gate. Additional targeted checks include `smoke:shell`, `qa:visual`, `qa:csp`, `qa:perf`, `feeds:check`, and `media:review`; inspect each script's options and requirements before running it. Avoid unrelated broad checks for documentation-only changes.

When dependency installation or audit fails, fix and commit the consistent `package.json`/`package-lock.json` pair before opening a PR. Never bypass the audit gate or replace `npm ci` with a mutable install in CI.

For Vercel access failures, distinguish provider/network failure, expired authentication, and protected Preview access. Use existing authorized CLI/connector access or an authenticated browser; do not weaken security or certificate validation. GitHub deployment status can corroborate the deployed SHA, but verify the canonical public route before claiming content is live.

Core site rendering requires no CMS credentials. Optional site verification overrides are documented in the README; project-copy automation secrets belong only to its approved workflow. Preserve the [CortexABV boundary](../cortex-abv/README.md) and the separate [ecosystem sync allowlist](ecosystem-sync.md).

References: [Plausible custom events](https://plausible.io/docs/custom-event-goals), [outbound tracking](https://plausible.io/docs/outbound-link-click-tracking), [YouTube player parameters](https://developers.google.com/youtube/player_parameters), [Google AI features](https://developers.google.com/search/docs/appearance/ai-features).

Native video companions retain every eligible translation in the release index. Permanent watch redirects use `videoRedirects`, chosen from immutable first-addition chronology; registering a later translation or editing its date does not replace the primary. SEO QA uses deployed companion eligibility. See [the native release rules](abvx-os-publishing.md#stable-native-video-release).
