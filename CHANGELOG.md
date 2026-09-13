# Changelog

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
