# TurboQuant vector-retrieval pilot v1

This pilot defines a **bound, proposal-only, local retrieval experiment** for CortexABV private runtime contracts. It is intentionally read-only and does not run retrieval, call an LLM, send network requests, or modify any external/public surface.

## Why this pilot

The earlier idea was to keep a low-latency, memory-efficient local vector layer for private candidate retrieval before adding any runtime endpoint. `turbovec` matches this goal: local ANN, strong quantization, and first-class allowlist filtering.

## Current pilot contract

Configured in:

- `cortex-abv/private-runtime/config/vector-retrieval-turbovec-pilot.v1.json`

Key controls:

- `authority: plan_only`
- `runtimeIntegration: false`
- `externalSideEffects: false`
- `safetyControls`: no network calls, no LLM calls, no writes, no public actions
- scope only on existing public artifacts:
  - `cortex-abv/public-presence-index.v1.json`
  - `cortex-abv/public-project-registry.v1.json`

## Validation

Use:

```bash
cd cortex-abv/private-runtime
npm run vector-retrieval-pilot:check
```

Validation proves structural integrity of the pilot contract. It does not index vectors or retrieve semantic matches.

## Stage 2: synthetic shadow retrieval runner

Added artifacts (still synthetic, local-only):

- `cortex-abv/private-runtime/examples/synthetic-vector-retrieval-benchmark.v1.json`
- `cortex-abv/private-runtime/src/vector-retrieval-synthetic-runner.mjs`
- `cortex-abv/private-runtime/test/vector-retrieval-synthetic-runner.test.mjs`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-retrieval-shadow:run
```

The runner computes deterministic retrieval-like recall metrics and writes:
- per-probe top-k candidates,
- per-probe recall@k,
- aggregate recall@k,
- `decisionTrace.claimEvidence` (evidence anchors for every returned candidate).

Default stage-2 receipt artifact:

- `cortex-abv/private-runtime/receipts/vector-retrieval-turbovec-shadow-receipt.v1.json`

## Next gate

Before any true index build:

1. define a deterministic fixture corpus for synthetic retrieval probes;
2. add a bounded shadow contract that requires claim anchors for every retrieval proposal;
3. keep approval path explicit (`proposal_only`) and evidence-only in PR/review flow;
4. only then allow any retrieval-assisted proposal path in a later stage.

This keeps the governance rule: **no outbound action until auditability and evidence policy are proven.**
