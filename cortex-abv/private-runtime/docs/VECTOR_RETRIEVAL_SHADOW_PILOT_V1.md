# Vector retrieval shadow pilot v1

This selected slice brings the useful vector-runtime research from the ABVXsite audit snapshot back into the canonical private runtime. It remains local, synthetic, read-only, tenant-aware, evidence-carrying, and `plan_only`.

## Included

- validated TurboVec pilot and pinned package policy;
- deterministic route allowlist and tenant-scope gates;
- synthetic benchmark runner with claim-evidence checks;
- local `buildIndex` / `query` shim using TF-IDF fallback while ANN integration is disabled;
- readiness receipts written only under ignored `data/vector-runtime/`.

## Excluded

The dependency-install probe and the later activation, wiring, transition, and effect-receipt cascade remain excluded. They either install third-party code or record governance stages without improving the current synthetic pilot. The exact selection and source commit are recorded in `config/vector-runtime-selection.v1.json`.

## Run

```bash
npm run vector:verify
```

Expected state:

- the plan and package policy validate;
- synthetic retrieval and runtime readiness pass;
- ANN intent falls back deterministically to `tfidf-lite`;
- no network, model, write, endpoint, or public-action authority is enabled;
- generated receipts remain local and ignored by Git.

TurboVec `1.0.0` is recorded as the current reviewed package pin. This command does not install or import it. A real dependency probe requires a separate explicit decision.
