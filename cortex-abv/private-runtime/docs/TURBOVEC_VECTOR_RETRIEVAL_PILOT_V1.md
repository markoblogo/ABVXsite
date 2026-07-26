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

### Stage 4e: runtime integration preflight

Implemented artifacts:

- `cortex-abv/private-runtime/src/vector-runtime-integration-preflight.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-integration-preflight.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-integration-preflight-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-integration-preflight:run
```

The preflight aggregates four receipts:

- package policy receipt;
- dependency probe receipt;
- vector runtime readiness receipt;
- synthetic retrieval shadow receipt.

It validates:

- package policy passed and still forbids runtime integration;
- dependency probe references the current package policy digest;
- index-build and query acceptance are both accepted;
- synthetic retrieval and readiness receipts pass recall/evidence gates;
- governance remains read-only, proposal-only, no endpoint, no LLM calls, no writes outside receipts and no public action authority.

Output eligibility:

- `eligible_for_design_review` means the receipts are coherent enough to design future real runtime wiring.
- `not_eligible_for_design_review` means at least one receipt gate blocks.

This still does not approve implementation, runtime activation, endpoint exposure, retrieval activation, writes, model calls or public actions.

### Stage 4f: runtime wiring design review

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-wiring-design.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-wiring-design.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-wiring-design.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-wiring-design-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-wiring-design:check
```

The design contract fixes:

- private-runtime-only boundary;
- no public repo runtime;
- no endpoint, scheduler, LLM calls, external writes or public action authority;
- allowed future POC command names only: `build_index_poc` and `query_index_poc`;
- allowlisted synthetic or reviewed private source packs only;
- source and index digest requirements;
- local gitignored index artifact policy;
- candidate retrieval only, no answer generation;
- claim evidence, hard threshold and tenant scope requirements;
- explicit rejection cases for drift, evidence gaps, platform mismatch, action authority and cross-tenant access.

The receipt returns:

- `eligible_for_implementation_poc_review` when the design and preflight are coherent;
- `not_eligible` when the design or preflight blocks.

This does not approve implementation POC execution. A later implementation POC still needs a separate approval gate.

### Stage 4g: implementation POC review gate

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-implementation-poc-review.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-implementation-poc-review.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-implementation-poc-review.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-implementation-poc-review-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-implementation-poc-review:check
```

The review gate defines the minimum future dry-run POC scope:

- local index artifact root: `data/vector-indexes/turbovec-poc`;
- index artifacts must remain gitignored and uncommitted;
- allowed source packs: synthetic vector benchmark or reviewed private source packs only;
- required checks: source digest before build, source-pack digest, index digest after build, wiring receipt digest and rollback notes;
- rollback: delete or abandon the local index artifact; no baseline advancement;
- allowed dry-run command names only: `build_index_poc_dry_run`, `query_index_poc_dry_run`, `verify_index_poc_dry_run`;
- no network, endpoint, scheduler, LLM calls, source mutation, external writes, public actions or publication.

The receipt returns:

- `eligible_for_implementation_poc_dry_run_review` when the review scope and wiring design receipt are coherent;
- `not_eligible` when the review scope or wiring design receipt blocks.

This does not approve implementation POC execution. It only records that a future dry-run POC design can be reviewed under the fixed boundary.

### Stage 4h: implementation POC dry-run

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-implementation-poc-dry-run.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-implementation-poc-dry-run.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-implementation-poc-dry-run.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-implementation-poc-dry-run-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-implementation-poc-dry-run:run
```

The dry-run does the first real local artifact pass:

- reads `examples/synthetic-vector-retrieval-benchmark.v1.json`;
- computes source digest before build;
- builds a local index artifact at `data/vector-indexes/turbovec-poc/index-artifact.v1.json`;
- keeps that artifact gitignored and uncommitted;
- computes index digest after build;
- runs synthetic query probes through the fallback vector runtime shim;
- requires evidence refs on every candidate;
- records rollback notes: delete or abandon the local artifact, with no baseline advancement.

The receipt returns:

- `eligible_for_controlled_runtime_module_review` when artifact, digest, query and rollback gates pass;
- `not_eligible` when any gate blocks.

This does not approve runtime activation. The next stage is only a controlled runtime module design review.

### Stage 4i: controlled runtime module design review

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-controlled-module-design.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-controlled-module-design.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-controlled-module-design.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-controlled-module-design-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-controlled-module-design:check
```

The design review gate defines the future controlled local module contract:

- consumes the Stage 4h dry-run receipt and records its digest;
- reads only the Stage 4h artifact interface under `data/vector-indexes/turbovec-poc`;
- module type: local library only;
- allowed future functions: `loadIndexArtifact`, `queryCandidates`, `verifyClaimEvidence`;
- candidate output must carry `candidateId`, `score`, `matchedTerms`, `evidenceRefs` and `tenant`;
- claim-evidence verification must return `passed`, `missingEvidenceRefs` and `decisionTrace`;
- tenant scope, hard threshold and evidence refs are mandatory.

The receipt returns:

- `eligible_for_controlled_runtime_module_poc_review` when the module contract and Stage 4h receipt are coherent;
- `not_eligible` when the design or Stage 4h receipt blocks.

This does not approve implementation or wiring. It only makes the next POC review discussable under a fixed local module interface.

### Stage 4j: controlled runtime module POC review

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-controlled-module-poc-review.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-controlled-module-poc-review.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-controlled-module-poc-review.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-controlled-module-poc-review-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-controlled-module-poc-review:check
```

The POC review gate defines the minimum future local harness scope:

- consumes the Stage 4i controlled module design receipt and records its digest;
- future harness path: `src/vector-runtime-controlled-module-harness.mjs`;
- future test path: `test/vector-runtime-controlled-module-harness.test.mjs`;
- harness remains local library only;
- allowed future dry-run command names only: `load_index_artifact_poc_dry_run`, `query_candidates_poc_dry_run`, `verify_claim_evidence_poc_dry_run`;
- required behavior: read Stage 4h artifact only, verify artifact/source/Stage 4i digests, enforce tenant scope and hard threshold, return candidates only, carry evidence refs.

The receipt returns:

- `eligible_for_controlled_runtime_module_harness_dry_run_review` when the POC scope and Stage 4i receipt are coherent;
- `not_eligible` when the review scope or Stage 4i receipt blocks.

This does not approve harness implementation or runtime wiring. It only makes the next local harness dry-run review discussable.

### Stage 4k: controlled runtime module harness dry-run

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-controlled-module-harness-dry-run.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-controlled-module-harness.mjs`
- `cortex-abv/private-runtime/src/vector-runtime-controlled-module-harness-dry-run.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-controlled-module-harness.test.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-controlled-module-harness-dry-run.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-controlled-module-harness-dry-run-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-controlled-module-harness-dry-run:run
```

The harness dry-run is the first local implementation POC:

- implements `loadIndexArtifact`, `queryCandidates`, `verifyClaimEvidence`;
- reads the Stage 4h artifact read-only;
- verifies Stage 4j receipt digest;
- verifies Stage 4h artifact and source digests;
- enforces tenant scope and hard threshold;
- returns candidates only, no answer generation;
- verifies evidence refs for returned candidates;
- records command trace, query results and digest linkage in the receipt.

The receipt returns:

- `eligible_for_controlled_runtime_wiring_design_review` when load/query/evidence/digest gates pass;
- `not_eligible` when any gate blocks.

This does not approve runtime wiring. It only makes a later wiring design review discussable under the same local-only boundary.

### Stage 4l: controlled runtime wiring design review

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-controlled-wiring-design.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-controlled-wiring-design.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-controlled-wiring-design.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-controlled-wiring-design-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-controlled-wiring-design:check
```

The design review fixes a future wiring boundary without activating it:

- private-runtime-only;
- in-process local library binding only;
- Stage 4k harness dry-run receipt digest required;
- Stage 4h artifact/source digest continuity required;
- allowed bindings limited to `loadIndexArtifact`, `queryCandidates`, `verifyClaimEvidence`;
- tenant scope, hard threshold and evidence refs required;
- candidates only, no answer generation.

The receipt returns:

- `eligible_for_controlled_runtime_wiring_poc_review` when design, digest and governance gates pass;
- `not_eligible` when any gate blocks.

This does not approve wiring implementation or runtime activation. It only makes a later controlled wiring POC review discussable.

### Stage 4m: controlled runtime wiring POC review

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-controlled-wiring-poc-review.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-controlled-wiring-poc-review.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-controlled-wiring-poc-review.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-controlled-wiring-poc-review-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-controlled-wiring-poc-review:check
```

The POC review fixes the minimum scope for a later local dry-run:

- Stage 4l controlled wiring design receipt digest required;
- future runner path: `src/vector-runtime-controlled-wiring-poc-dry-run.mjs`;
- future test path: `test/vector-runtime-controlled-wiring-poc-dry-run.test.mjs`;
- private-runtime-only, in-process local library binding only;
- allowed module path: `src/vector-runtime-controlled-module-harness.mjs`;
- allowed bindings limited to `loadIndexArtifact`, `queryCandidates`, `verifyClaimEvidence`;
- allowed artifact path: `data/vector-indexes/turbovec-poc/index-artifact.v1.json`;
- dry-run commands limited to `verify_stage4l_digest_poc_dry_run`, `bind_local_harness_poc_dry_run`, `query_local_harness_poc_dry_run`, `verify_no_activation_poc_dry_run`;
- rollback notes required; baseline advancement forbidden.

The receipt returns:

- `eligible_for_controlled_runtime_wiring_poc_dry_run_review` when review, digest and governance gates pass;
- `not_eligible` when any gate blocks.

This does not approve POC implementation, wiring implementation or runtime activation. It only makes a later controlled wiring POC dry-run design/runner discussable.

### Stage 4n: controlled runtime wiring POC dry-run

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-controlled-wiring-poc-dry-run.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-controlled-wiring-poc-dry-run.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-controlled-wiring-poc-dry-run.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-controlled-wiring-poc-dry-run-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-controlled-wiring-poc-dry-run:run
```

The dry-run now executes the minimum local binding path:

- requires the Stage 4m controlled wiring POC review receipt digest;
- verifies Stage 4m -> Stage 4l -> Stage 4k -> Stage 4h digest continuity;
- loads the Stage 4h local index artifact read-only;
- binds only `src/vector-runtime-controlled-module-harness.mjs`;
- executes only the allowed dry-run command trace;
- runs tenant-scoped candidate queries through `queryCandidates`;
- verifies evidence refs through `verifyClaimEvidence`;
- writes only `receipts/vector-runtime-controlled-wiring-poc-dry-run-receipt.v1.json`;
- records rollback notes and does not advance any baseline.

The receipt returns:

- `eligible_for_controlled_runtime_wiring_review` when design, digest, binding, query, evidence and governance gates pass;
- `not_eligible` when any gate blocks.

This still does not approve runtime wiring activation. It only makes a later controlled runtime wiring review gate discussable.

### Stage 4o: controlled runtime wiring review

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-controlled-wiring-review.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-controlled-wiring-review.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-controlled-wiring-review.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-controlled-wiring-review-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-controlled-wiring-review:check
```

The wiring review defines what counts as a reviewed local wiring boundary:

- Stage 4n controlled wiring POC dry-run receipt digest required;
- private-runtime-only;
- in-process local library binding only;
- allowed module path: `src/vector-runtime-controlled-module-harness.mjs`;
- allowed bindings limited to `loadIndexArtifact`, `queryCandidates`, `verifyClaimEvidence`;
- candidates only, no answer generation;
- tenant scope, hard threshold and evidence refs required;
- receipt-only audit required.

The receipt returns:

- `eligible_for_runtime_activation_review` when review and Stage 4n gates pass;
- `not_eligible` when any gate blocks.

This still does not approve runtime activation. It only makes a separate runtime activation review gate discussable.

### Stage 4p: runtime activation review

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-activation-review.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-activation-review.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-activation-review.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-activation-review-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-activation-review:check
```

The activation review defines what may count as future local activation:

- Stage 4o controlled wiring review receipt digest required;
- activation means local private-runtime availability for an internal callable interface only;
- allowed mode: `local_process_bound_callable_only`;
- allowed module path: `src/vector-runtime-controlled-module-harness.mjs`;
- allowed bindings limited to `loadIndexArtifact`, `queryCandidates`, `verifyClaimEvidence`;
- future activation dry-run required before any activation;
- owner review and rollback notes required.

The receipt returns:

- `eligible_for_runtime_activation_dry_run_review` when review and Stage 4o gates pass;
- `not_eligible` when any gate blocks.

This still does not approve runtime activation. It only makes a later activation dry-run review discussable.

### Stage 4q: runtime activation dry-run review

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-activation-dry-run-review.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-activation-dry-run-review.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-activation-dry-run-review.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-activation-dry-run-review-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-activation-dry-run-review:check
```

The activation dry-run review defines the minimum future dry-run scope:

- Stage 4p runtime activation review receipt digest required;
- future runner path: `src/vector-runtime-activation-dry-run.mjs`;
- future test path: `test/vector-runtime-activation-dry-run.test.mjs`;
- allowed module path: `src/vector-runtime-controlled-module-harness.mjs`;
- local callable interface checks required: module import, binding presence, read-only artifact load, tenant-scoped candidate-only query, evidence refs and no exposed activation;
- commands limited to `verify_stage4p_digest_activation_dry_run`, `load_local_runtime_binding_activation_dry_run`, `query_local_runtime_binding_activation_dry_run`, `verify_activation_not_exposed_activation_dry_run`;
- writes limited to `receipt_only`;
- rollback notes and owner review required.

The receipt returns:

- `eligible_for_runtime_activation_dry_run` when review and Stage 4p gates pass;
- `not_eligible` when any gate blocks.

This still does not activate runtime wiring. It only makes a later local activation dry-run executable under the same local-only boundary.

### Stage 4r: runtime activation dry-run

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-activation-dry-run.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-activation-dry-run.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-activation-dry-run.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-activation-dry-run-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-activation-dry-run:run
```

The dry-run now executes the approved local callable checks:

- requires the Stage 4q activation dry-run review receipt digest;
- imports `src/vector-runtime-controlled-module-harness.mjs`;
- verifies required bindings are present;
- verifies Stage 4q -> Stage 4p -> Stage 4o -> Stage 4n -> Stage 4h digest continuity;
- loads the local Stage 4h artifact read-only;
- runs tenant-scoped candidate-only queries;
- verifies evidence refs;
- verifies activation is not exposed;
- writes only `receipts/vector-runtime-activation-dry-run-receipt.v1.json`.

The receipt returns:

- `eligible_for_runtime_readiness_review` when module, digest, query, evidence and governance gates pass;
- `not_eligible` when any gate blocks.

This still does not activate runtime wiring. It only makes a later runtime readiness review gate discussable.

Default stage-3 receipt artifact:

- `cortex-abv/private-runtime/receipts/vector-retrieval-turbovec-shadow-receipt.v1.json`

### Stage 4s: runtime readiness review

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-readiness-review.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-readiness-review.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-readiness-review.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-readiness-review-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-readiness-review:check
```

The readiness review now requires the Stage 4r activation dry-run receipt digest and verifies that local readiness signals are complete:

- module importable;
- required bindings present;
- activation not exposed;
- Stage 4h artifact loads read-only;
- artifact digests match Stage 4h source/index digests;
- Stage 4q -> 4p -> 4o -> 4n -> 4h digest continuity remains present;
- all tenant-scoped candidate-only queries passed;
- evidence refs verified for every query;
- commands stayed allowlisted and suffixed `_activation_dry_run`;
- writes remained receipt-only;
- governance stayed read-only / proposal-only / no endpoint / no network / no public action.

The receipt returns:

- `eligible_for_runtime_activation_decision_review` when Stage 4r signals are sufficient for a separate activation decision review;
- `not_eligible` when any readiness signal or governance boundary blocks.

This still does not activate runtime wiring. It only makes a later activation decision review gate discussable.

### Stage 4t: runtime activation decision review

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-activation-decision-review.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-activation-decision-review.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-activation-decision-review.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-activation-decision-review-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-activation-decision-review:check
```

The activation decision review now formally limits any future local activation decision to:

- owner-invoked same-process callable availability only;
- private-runtime-only location;
- fixed harness module path;
- fixed allowlisted bindings only;
- read-only Stage 4h local artifact only;
- tenant-scoped candidate-only query operations;
- evidence verification only.

It also explicitly keeps forbidden even after such a future decision:

- endpoint exposure;
- persistent service or daemon lifecycle;
- background scheduler;
- network calls;
- LLM calls;
- public-action authority;
- answer generation;
- source mutation;
- artifact mutation;
- writes outside receipt;
- cross-tenant queries;
- autonomous execution.

The receipt returns:

- `eligible_for_local_runtime_activation_decision` when Stage 4s readiness proof and the bounded activation scope both hold;
- `not_eligible` when readiness proof or governance boundaries block.

This still does not activate runtime wiring. It only makes a later explicit local activation decision artifact discussable.

### Stage 4u: local runtime activation decision artifact

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-activation-decision.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-activation-decision.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-activation-decision.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-activation-decision-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-activation-decision:run
```

The decision artifact now records:

- explicit owner approval;
- fixed local activation intent;
- fixed harness module path and allowlisted bindings;
- fixed Stage 4h read-only artifact path;
- rollback plan and owner reversal path;
- digest lineage back through Stage 4t, 4s, 4r, 4q, 4p, 4o, 4n and 4h.

The receipt returns:

- `eligible_for_local_runtime_activation_dry_run` when Stage 4t proof, explicit owner approval and rollback plan all hold;
- `not_eligible` when any decision, digest or governance boundary blocks.

This still does not activate runtime wiring. It only makes a later bounded local activation dry-run discussable.

### Stage 4v: local runtime activation dry-run

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-local-activation-dry-run.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-local-activation-dry-run.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-local-activation-dry-run.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-local-activation-dry-run-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-local-activation-dry-run:run
```

The local activation dry-run now:

- requires the Stage 4u activation decision receipt digest;
- verifies Stage 4u -> 4t -> 4s -> 4r -> 4q -> 4p -> 4o -> 4n -> 4h digest continuity;
- verifies owner approval and rollback-plan presence from Stage 4u;
- imports the fixed harness module;
- loads the Stage 4h artifact read-only;
- runs tenant-scoped candidate-only queries;
- verifies evidence refs;
- verifies activation is still not applied;
- writes only a receipt.

The receipt returns:

- `eligible_for_local_runtime_activation_state_review` when decision lineage, module, artifact, query, evidence and governance checks all pass;
- `not_eligible` when any gate blocks.

This still does not activate runtime wiring. It only makes a later activation-state review gate discussable.

### Stage 4w: local runtime activation-state review

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-local-activation-state-review.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-local-activation-state-review.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-local-activation-state-review.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-local-activation-state-review-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-local-activation-state-review:check
```

The activation-state review now:

- requires the Stage 4v local activation dry-run receipt digest;
- defines the local state as a receipt-defined inactive-ready state only;
- confirms that no separate persistent process, daemon, scheduler, endpoint, network or LLM dependency is required for that state definition;
- confirms the dry-run signals sufficient to discuss the state: owner approval, module import/bindings, unapplied activation, read-only artifact, digest matches, tenant-scoped candidate-only retrieval, evidence refs and rollback notes;
- writes only a review receipt.

The receipt returns:

- `eligible_for_local_activation_state_transition_review` when the Stage 4v proof and state boundary both hold;
- `not_eligible` when any state, digest or governance gate blocks.

This still does not activate runtime wiring. It only makes a later local state-transition review gate discussable.

### Stage 4x: local activation-state transition review

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-local-activation-state-transition-review.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-local-activation-state-transition-review.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-local-activation-state-transition-review.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-local-activation-state-transition-review-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-local-activation-state-transition-review:check
```

The activation-state transition review now:

- requires the Stage 4w local activation-state review receipt digest;
- defines the minimal future transition artifact from inactive-ready to bounded owner-invoked local active runtime;
- keeps the transition bounded to the fixed harness module, fixed bindings and private-runtime-only location;
- confirms rollback-transition policy and receipt-only evidence;
- writes only a review receipt.

The receipt returns:

- `eligible_for_local_activation_state_transition_artifact` when the Stage 4w proof and minimal transition boundary both hold;
- `not_eligible` when any transition, digest or governance gate blocks.

This still does not activate runtime wiring. It only makes a later local activation-state transition artifact discussable.

### Stage 4y: local activation-state transition artifact

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-local-activation-state-transition.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-local-activation-state-transition.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-local-activation-state-transition.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-local-activation-state-transition-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-local-activation-state-transition:run
```

The transition artifact now records:

- explicit owner approval;
- fixed transition intent;
- fixed harness module path and allowlisted bindings;
- rollback plan and owner reversal path;
- digest lineage back through Stage 4x, 4w, 4v, 4u, 4t, 4s, 4r, 4q, 4p, 4o, 4n and 4h.

The receipt returns:

- `eligible_for_local_activation_state_transition_dry_run` when Stage 4x proof, explicit owner approval and rollback plan all hold;
- `not_eligible` when any artifact, digest or governance boundary blocks.

This still does not activate runtime wiring. It only makes a later bounded local transition dry-run discussable.

### Stage 4z: local activation-state transition dry-run

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-local-activation-state-transition-dry-run.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-local-activation-state-transition-dry-run.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-local-activation-state-transition-dry-run.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-local-activation-state-transition-dry-run-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-local-activation-state-transition-dry-run:run
```

The local transition dry-run now:

- requires the Stage 4y transition artifact receipt digest;
- verifies Stage 4y -> 4x -> 4w -> 4v -> 4u -> 4t -> 4s -> 4r -> 4q -> 4p -> 4o -> 4n -> 4h digest continuity;
- verifies owner approval and rollback-plan presence from Stage 4y;
- imports the fixed harness module;
- loads the Stage 4h artifact read-only;
- runs tenant-scoped candidate-only queries;
- verifies evidence refs;
- verifies no transition is applied;
- writes only a receipt.

The receipt returns:

- `eligible_for_local_transition_state_effect_review` when artifact lineage, module, artifact, query, evidence and governance checks all pass;
- `not_eligible` when any gate blocks.

This still does not activate runtime wiring. It only makes a later transition-state effect review gate discussable.

### Stage 4aa: local transition-state effect review

Implemented artifacts:

- `cortex-abv/private-runtime/config/vector-runtime-local-transition-state-effect-review.v1.json`
- `cortex-abv/private-runtime/src/vector-runtime-local-transition-state-effect-review.mjs`
- `cortex-abv/private-runtime/test/vector-runtime-local-transition-state-effect-review.test.mjs`
- `cortex-abv/private-runtime/receipts/vector-runtime-local-transition-state-effect-review-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-local-transition-state-effect-review:check
```

The local transition-state effect review now:

- requires the Stage 4z local activation-state transition dry-run receipt digest;
- verifies Stage 4z -> 4y -> 4x -> 4w -> 4v -> 4u -> 4t -> 4s -> 4r -> 4q -> 4p -> 4o -> 4n -> 4h digest continuity remains present;
- constrains discussable local effects to callable-binding readiness, read-only artifact access, tenant-scoped candidate-query confirmation, verified evidence-chain confirmation and rollback-chain preservation;
- verifies owner approval scope, module importability, read-only artifact checks, tenant-scoped candidate-only queries and evidence refs still hold;
- writes only a receipt and still does not apply any effect, activation or transition.

The receipt returns:

- `eligible_for_local_transition_state_effect_artifact` when Stage 4z proof and effect-boundary review both pass;
- `not_eligible` when any digest, receipt or governance gate blocks.

This still does not activate runtime wiring. It only makes a later transition-state effect artifact discussable.

## Next gate

Before any local transition-state effect artifact:

1. require the Stage 4aa local transition-state effect review receipt digest;
2. keep the effect artifact limited to the allowlisted local effect vocabulary and inherited dry-run evidence;
3. preserve no-endpoint/no-scheduler/no-LLM/no-network/no-public-action governance unless separately reviewed;
4. keep any real external/personal-surface action behind separate proposal and owner-review gates.

This keeps the governance rule: **no outbound action until auditability and evidence policy are proven.**
