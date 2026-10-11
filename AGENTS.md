# AGENTS.md

Read `README.md` for the current site/content map, then the task-specific guide. Use `docs/content-editing.md` for content, `docs/editorial-seo-checklist.md` for releases, and `docs/site-operations.md` for feeds/analytics. Do not load all CortexABV docs for ordinary editorial tasks.

## Repository contract

- `content/` is the editable public source of truth; regenerate `public/llms.txt` and `public/content-index.json` after public content changes.
- Preserve public slugs, redirects, media paths, canonical URLs, and the separation from the private `ABVX-OS` and `CortexABV-private` runtimes.
- CortexABV copy changes remain proposal-only and PR-first unless the operation is the allowlisted ecosystem sync. Ecosystem sync may write generated registry files, marked README blocks, reviewed public project metadata, and release announcements directly to `main`; it must never change arbitrary code or text outside those surfaces.
- Owner-authorized Writing feed sync may update only `content/writing-discovery.json`, `public/content-index.json` and `public/llms.txt` directly on `main`. It records public feed metadata and immutable first-addition timestamps; this exception does not authorize code, article-body, media or other content changes.
- Before a code PR, run `npm run content:validate`, `npm run lint`, `npm run test:sync`, and `npm run build`. For owner-authorized native content-only publications, use `npm run content:release-check`: its Git classifier may select the documented six-gate `publication-v1` profile. Never manually omit gates or mark skipped lint/private-runtime tests as PASS; unknown or code-changing scope uses `full`.
- Read `docs/project-description-sync.md` before changing project-copy automation and the nested `cortex-abv/private-runtime/AGENTS.md` before changing that snapshot.

# Frontend motion review contract (local)

Use this local contract for UI animation-related changes:

- Prefer transform/opacity (`x`, `y`, `scale`, `rotation`, `opacity`, `autoAlpha`) over layout properties (`top`, `left`, `width`, `height`).
- Respect `prefers-reduced-motion` in user-facing animations.
- Ensure cleanup on unmount/re-render (`revert`, `kill`, clear timers/callbacks).
- Scope selectors to component root; avoid global selectors for dynamic DOM bindings.
- For each animation change, add a short motion-review note with selector scope + verification path.

For owner-authorized new native Writing/Working Story publications, follow `docs/abvx-os-publishing.md` including private OS closeout after production. Reuse the existing release receipt; do not rerun successful checks just to create telemetry. Keep deployed-SHA verification separate and do not send authored content to Cortex.

## Routine native publication boundary

Use `content:publish -- --base <main-SHA> --packet <path> --dry-run|--write` for standard approved Writing/Working Story singles or pools; repeat `--packet` for a pool. Start from a clean dedicated branch at that base. Run prebuild once and `content:publication-boundary` before the one release check. Do not modify code, templates, dependencies, documentation or collection definitions in a routine publication PR. Unsupported features require a separate engineering task/PR. Preserve production/OS closeout evidence; never disable reviews to hide failures.
