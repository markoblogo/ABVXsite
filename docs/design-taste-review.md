# Design Taste Review

Use the local `frontend-taste-layer` skill for marketing, editorial, Books, and brand-forward ABVX surfaces. Product workflows such as forms, settings, onboarding, or checkout route to Lazyweb evidence and UX review first.

## Review packet

1. State one design read: surface, audience, and visual language.
2. Calibrate composition variance, motion, and density relative to the existing page.
3. Before redesigning, list what stays fixed: approved copy, supplied artwork, tokens, hierarchy, working interactions, accessibility behavior, and owner constraints.
4. Check whether repeated section layouts flatten distinct content roles. Repetition needed for comparable catalog records is valid.
5. Keep motion only when it communicates hierarchy, feedback, state, or narrative.
6. Verify desktop, mobile, reduced motion, and all visible text in a real browser.

This review does not authorize dependency changes, asset replacement, copy invention, redesign, deployment, or release.

## `/books` pilot — 2026-07-19

**Design read:** an editorial publishing catalog for readers browsing official lines, standalone books, and companion systems, using a high-contrast print-catalog language.

**Relative axes:** high composition variance at section level, restrained motion, high catalog density.

**Preserve:** source-faithful covers, titles and language editions, publishing-line hierarchy, working links, ABVX Press typography, and existing content groups.

**Evidence:** production `/books` captured at 1440×1000 and 390×844. The mobile document width remained 390px with no horizontal overflow. Reduced-motion emulation matched successfully. Repeated grids remain justified by record comparison and are differentiated by publishing-line headers, cover art, and section scale.

**Decision:** no taste-driven code change. Breaking the long catalog into decorative layout variants would weaken scanning and violate the preservation boundary. Existing report-only CSP notices belong to the security/performance review path, not this visual contract.
