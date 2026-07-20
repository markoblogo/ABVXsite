# AGENTS.md

# Frontend motion review contract (local)

Use this local contract for UI animation-related changes:

- Prefer transform/opacity (`x`, `y`, `scale`, `rotation`, `opacity`, `autoAlpha`) over layout properties (`top`, `left`, `width`, `height`).
- Respect `prefers-reduced-motion` in user-facing animations.
- Ensure cleanup on unmount/re-render (`revert`, `kill`, clear timers/callbacks).
- Scope selectors to component root; avoid global selectors for dynamic DOM bindings.
- For each animation change, add a short motion-review note with selector scope + verification path.
