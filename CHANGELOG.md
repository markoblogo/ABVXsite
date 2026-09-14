# Changelog

## 0.3.0 — 2026-09-14

- Added the canonical 24-repository ABVX ecosystem graph and public `/ecosystem.json` registry.
- Added deterministic impact planning and managed README blocks for cross-repository links.
- Added hourly repository metadata and release observation with allowlisted direct-to-main synchronization.
- Added current ABVX OS, CoqPi, Pocket OS and Book Landings pages to `abvx.xyz`.
- Corrected the UGA-to-SPIKE ownership model and stale Shortener/Cropto repository links.

## 0.2.2 — 2026-09-13

- Refreshed the public CortexABV vector shadow snapshot from the canonical private runtime.
- Enforced tenant filtering before candidate scoring and added cross-tenant regression coverage.
- Added a reproducible CI check for the exported vector compatibility surface.
- Tightened the export boundary so vector index artifacts remain local and cannot enter the public snapshot.

## 0.2.1 — 2026-09-13

- Removed the dormant cross-repository Lab direct-push job from project-description sync.
- Fixed the governance record and documentation so Lab updates require their own reviewed pull request.
- Renamed the ABVXsite sync job to describe its actual owner-review proposal behavior.

## 0.2.0 — 2026-09-13

### Reliability and maintenance
- Upgraded Next.js, React, and the related type and lint packages to current releases.
- Removed known npm audit findings and added a PR CI gate for content, lint, sync tests, production build, and production dependency audit.
- Updated GitHub Actions runtimes to their Node 24 generations.
- Fixed existing writing-route lint failures and scoped a Next.js-only lint rule away from the isolated CortexABV runtime.
- Confirmed the project-copy schema fix that restores scheduled bounded copy proposals while preserving manual owner review.

### Documentation
- Tightened the repository quick start, verification, release flow, and contributor context.
- Clarified the public entry points and retained the ABVXsite / ABVX-OS / CortexABV authority boundary.

## 2026-02-16 — Current Snapshot

### UX and layout
- Added world-time dock and fixed full-panel toggle behavior.
- Refined homepage hierarchy and micro-layout (removed outdated blocks, tightened sections).
- Added subtle site-wide hover/focus polish with green accent glow.
- Reworked Work with me visuals and hierarchy; removed FAQ there.
- Simplified ecosystem detail pages by removing top cover banner and aligning status badges.

### Copy and positioning updates
- Home rewritten toward product + AI systems positioning.
- About rewritten with concise builder-focused positioning and simplified sections.
- Writing renamed to Blogs; intro and CTA links updated (Substack + Medium).
- Projects intro updated to current-work scope; removed Featured block.
- Books intro updated to published-catalog framing.
- Ecosystems intro rewritten as active work streams with “Current focus” accent.

### SEO / discovery / entity work
- Added robots/sitemap/canonical/schema baseline.
- Added Bing Webmaster verification token support.
- Added ABVX intent pages/hub linking improvements.
- Added targeted metadata and structured content updates across key pages.
