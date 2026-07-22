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

## Stage 3: synthetic ANN-like retrieval gate (local-only)

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
- deterministic TF-IDF/BM25-like rerank scoring (`tfidf-lite`),
- hard score threshold check against `evaluation.minCandidateScore`,
- evidence gates: `decisionTrace.claimEvidence` and `decisionTrace.missingEvidence`.

### Stage 4: index interface + ANN fallback shape

The Stage 3 runner now has a typed index selector contract so ANN can be represented explicitly while keeping existing gates intact.

Current runtime snapshot behavior:

- `vector-retrieval-turbovec-pilot.v1.json` now includes:
  - `indexInterface.mode: "ann_with_tfidf_fallback"` by default
  - `indexInterface.runtimeReady: false` (pilot still blocks runtime integration)
  - `indexInterface.fallback.engine: "tfidf-lite"`
  - `indexInterface.fallback.reason`.

Decision trace now records runtime readiness and fallback details per run:

- `decisionTrace.requestedReranker`
- `decisionTrace.reranker`
- `decisionTrace.runtimeReady`
- `decisionTrace.fallbackApplied`
- `decisionTrace.fallbackEngine`
- `decisionTrace.fallbackReason`

This preserves the same governance gates and keeps ANN wiring backward-safe: if runtime is off, retrieval remains deterministic tf-idf, transparent in receipts, and proposal-only.

### Stage 4b: vector runtime readiness shim

Implemented artifacts:

- `cortex-abv/private-runtime/src/vector-runtime-shim.mjs`
- `cortex-abv/private-runtime/src/vector-runtime-readiness-runner.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-shim.test.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-readiness-runner.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-readiness-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-readiness:run
```

The shim provides the future runtime interface:

- `buildVectorRuntimeIndex({ plan, corpus })`
- `queryVectorRuntimeIndex({ index, query, topK, minCandidateScore })`

Current behavior remains fallback-only:

- no `turbovec` package import;
- no ANN index build;
- no network, LLM, endpoint, public action, or external write;
- deterministic `tfidf-lite` fallback under `ann_with_tfidf_fallback`;
- readiness receipt includes `decisionTrace.index`, claim evidence, missing evidence and recall metrics.

The next acceptable step is a bounded local dependency probe with explicit `index-build` and `query` acceptance criteria. It must still be private-only and receipt-only.

### Stage 4c: bounded real dependency probe

Implemented artifacts:

- `cortex-abv/private-runtime/src/vector-runtime-dependency-probe-runner.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-dependency-probe-runner.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-dependency-probe-receipt.v1.json`

The probe uses the upstream-supported Python API:

- package: `turbovec`
- index type: `IdMapIndex`
- operation gate: `add_with_ids` + `prepare` + `search`

Default run does not install anything and blocks if `turbovec` is unavailable:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-dependency-probe:run
```

Real local probe, with explicit install authority:

```bash
cd cortex-abv/private-runtime
node src/vector-runtime-dependency-probe-runner.mjs \
  --plan config/vector-retrieval-turbovec-pilot.v1.json \
  --benchmark examples/synthetic-vector-retrieval-benchmark.v1.json \
  --policy config/vector-runtime-package-policy.v1.json \
  --receipt receipts/vector-runtime-dependency-probe-receipt.v1.json \
  --allow-install
```

Acceptance criteria:

- `acceptance.indexBuild.status == "accepted"`
- `acceptance.query.status == "accepted"`
- `metrics.recallAtK >= evaluation.minRecallAtK`
- `decisionTrace.missingEvidence` is empty
- `governance.readOnly == true`
- `governance.proposalOnly == true`
- `governance.publicActionAuthority == false`

The real probe may use network only for temporary dependency installation when `--allow-install` is present. The data plane remains local and no runtime integration is authorized.

### Stage 4d: package policy gate

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-package-policy.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-package-policy.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-package-policy.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-package-policy-receipt.v1.json`

The policy fixes the only currently approved supply shape:

- ecosystem: PyPI
- package: `turbovec`
- exact pin: `0.8.0`
- install spec: `turbovec==0.8.0`
- venv: temporary/local only
- no committed venv and no global site-packages
- install requires an explicit flag
- network is allowed only for dependency installation
- data plane stays local/read-only/proposal-only

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-package-policy:check
```

The package policy receipt records `policyDigest`, package spec, observed platform, venv policy, governance and acceptance state. Dependency-probe receipts now include the policy digest and install spec.

Default stage-3 receipt artifact:

- `cortex-abv/private-runtime/receipts/vector-retrieval-turbovec-shadow-receipt.v1.json`

## Next gate

Before any true index build:

1. define a deterministic fixture corpus for synthetic retrieval probes;
2. add a bounded shadow contract that requires claim anchors for every retrieval proposal;
3. keep approval path explicit (`proposal_only`) and evidence-only in PR/review flow;
4. only then allow any retrieval-assisted proposal path in a later stage.

This keeps the governance rule: **no outbound action until auditability and evidence policy are proven.**
