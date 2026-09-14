# AGENTS.md

## Repository contract

- `content/` is the editable public source of truth; regenerate `public/llms.txt` and `public/content-index.json` after public content changes.
- Preserve public slugs, redirects, media paths, canonical URLs, and the separation from the private `ABVX-OS` and `CortexABV-private` runtimes.
- CortexABV copy changes remain proposal-only and PR-first unless the operation is the allowlisted ecosystem sync. Ecosystem sync may write generated registry files, marked README blocks, reviewed public project metadata, and release announcements directly to `main`; it must never change arbitrary code or text outside those surfaces.
- Before a PR, run `npm run content:validate`, `npm run lint`, `npm run test:sync`, and `npm run build`.
- Read `docs/project-description-sync.md` before changing project-copy automation and the nested `cortex-abv/private-runtime/AGENTS.md` before changing that snapshot.

# Frontend motion review contract (local)

Use this local contract for UI animation-related changes:

- Prefer transform/opacity (`x`, `y`, `scale`, `rotation`, `opacity`, `autoAlpha`) over layout properties (`top`, `left`, `width`, `height`).
- Respect `prefers-reduced-motion` in user-facing animations.
- Ensure cleanup on unmount/re-render (`revert`, `kill`, clear timers/callbacks).
- Scope selectors to component root; avoid global selectors for dynamic DOM bindings.
- For each animation change, add a short motion-review note with selector scope + verification path.
