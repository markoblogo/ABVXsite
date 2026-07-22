# Cabinet Pilot Integration Map for CortexABV

Status: Stage 1 complete, Stage 2 in-progress (read-only, governance-safe)

Purpose: keep a stable plan for a future private/runtime extension of Cabinet-style capabilities without changing current CortexABV governance.

## Objective
Leverage Cabinet’s proven building blocks (agent/runtime/adapters/model/provider tooling) as a **post-governance** upgrade, not as a shortcut that bypasses `evidence + proposal + receipt`.

## Scope boundary
- No write authority to ABVXsite, Lab, or external social surfaces unless approved later.
- No endpoint/service integration in this repo now.
- No direct private data in public repo.
- Every new integration stage must keep current `read-only -> proposal-only -> bounded write` path.

## 5 priority modules (in order)

### 1) Provider adapter plane
- In Cabinet: provider interface + runtime verification + plugin provider loader.
- In CortexABV future: use for private CoqPi/CortexABV execution paths, with strict policy and audit.
- Exit criteria:
  - adapter list is declared in one contract file;
  - non-production providers are blocked by default;
  - verify step returns typed status and hints.

### 2) MCP/tool adapter boundary
- In Cabinet: MCP packages with curated, minimal tool sets.
- In CortexABV future: only read-only tools first.
- Exit criteria:
  - read tools pass allowlist;
  - destructive tools are feature-flagged + explicitly denied in default policy;
  - every tool call is logged in local runtime ledger.

### 3) Project-cabinet scope model
- In Cabinet: `.cabinet`, child cabinets, inherited/shared context.
- In CortexABV future: isolated tenants per owned project without cross-tenant leakage.
- Exit criteria:
  - tenant context cannot read private personal profile by default;
  - tenant cannot affect parent unless explicitly allowed.

### 4) Scheduled jobs and task runner
- In Cabinet: cron-defined recurring jobs, missions, scheduler hooks.
- In CortexABV future: periodic import/compare/validate/report jobs feeding receipts.
- Exit criteria:
  - jobs are read-only and receipt-only at Stage 1;
  - failures produce structured reasons and retry policy.

#### Stage 1 execution status (completed)

Completed (read-only pilot): one synthetic scheduled-job plan + receipt, no runtime execution, no endpoint, no writes.

- Contract: `cortex-abv/private-runtime/config/cabinet-scheduled-jobs-stage1.v1.json`
- Receipt: `cortex-abv/private-runtime/receipts/cabinet-stage1-scheduled-jobs-receipt.v1.json`
- Receipt gate: read-only, proposal-like output with explicit `reviewStatus` and `approvalOutcome`.
- Evidence basis: local `public-presence-index` and `public-project-registry` snapshots only.

#### Stage 2 execution status (in-progress)

- Add scheduler runner that emits a real receipt artifact per planned run.
  - Implemented command: `npm run cortex-abv:cabinet-stage1-run`
  - Latest real run output: `cortex-abv/private-runtime/receipts/cabinet-stage1-scheduled-jobs-receipt.v1.json`

- Add synthetic + one real source-specific adapter in this same job envelope before any write authority.
  - Completed in repo: `monitor-mn7r-shadow` synthetic adapter is now bound in `cabinet-scheduled-jobs-stage1.v1.json` and executed in the runner. The adapter uses `import-admission-policy.v1` and keeps `source_specific_override` in `decisionTrace` for audit, but does not write any files or API calls.
- Add second real owned-source adapter and codify adapter trace invariant:
  - Completed: `index-spike-shadow` is now bound in the same contract envelope.
  - Contract invariant for this job: every enabled source adapter must contribute a `decisionTrace` into `result.sourceAdapters[].decisionTrace`.

### 5) Git-based provenance + storage model
- In Cabinet: markdown + file history + schema state.
- In CortexABV future: align private stores to explicit append-only ledgers and immutable snapshots.
- Exit criteria:
  - every mutation has versioned evidence artifact;
  - rollback target is explicit and human-approvable.

### 6) Vector retrieval readiness (local pilot)
- Current local pilot contract uses `turbovec` as a bounded vector engine for read-only retrieval experiments.
- Objective: keep a strict local retrieval plan without introducing runtime endpoint, action authority, or data-plane side effects.
- Active artifact:
  - `cortex-abv/private-runtime/config/vector-retrieval-turbovec-pilot.v1.json`
  - `cortex-abv/private-runtime/src/check-vector-retrieval-pilot.mjs`
- Stage 2 local shadow artifact:
  - `cortex-abv/private-runtime/examples/synthetic-vector-retrieval-benchmark.v1.json`
  - `cortex-abv/private-runtime/src/vector-retrieval-synthetic-runner.mjs`
  - `cortex-abv/private-runtime/test/vector-retrieval-synthetic-runner.test.mjs`
- Receipt from synthetic stage-2 shadow run:
  - `cortex-abv/private-runtime/receipts/vector-retrieval-turbovec-shadow-receipt.v1.json`
- Required invariants (current stage):
  - no network/LLM calls;
  - no writes and no public action authority;
  - synthetic corpus and evidence-anchored outputs only;
  - recall/top-k and claim-evidence are written into a receipt-style artifact;
  - pilot must be explicitly reviewed before any production retrieval path.

#### Stage 4 execution target (implemented in private-runtime)

- Add explicit index-mode contract with transparent fallback in `config/vector-retrieval-turbovec-pilot.v1.json`.
- Keep Stage 3 gates unchanged (decisionTrace evidence + hard thresholds).
- Emit ANN-readiness decision in each receipt:
  - `decisionTrace.requestedReranker`
  - `decisionTrace.fallbackApplied`
  - `decisionTrace.fallbackEngine`
  - `decisionTrace.fallbackReason`
- Next required gate before real ANN dependency:
  - explicit `index-build` and `query` acceptance criteria in a bounded private-only benchmark;
  - separate governance check confirming allowed surfaces remain read-only.

#### Stage 4b execution status (completed)

- Added a local vector runtime shim with future `buildIndex/query` shape:
  - `cortex-abv/private-runtime/src/vector-runtime-shim.mjs`
  - `cortex-abv/private-runtime/src/vector-runtime-readiness-runner.mjs`
- Added readiness receipt:
  - `cortex-abv/private-runtime/receipts/vector-runtime-readiness-receipt.v1.json`
- Current status:
  - synthetic only;
  - fallback-only (`tfidf-lite`);
  - no `turbovec` package import;
  - no endpoint, scheduler, network, LLM call, write authority, or public action authority.
- Next gate:
  - run a bounded local dependency probe only after adding explicit `index-build`/`query` acceptance criteria and owner review.

#### Stage 4c execution status (completed)

- Added bounded real dependency probe:
  - `cortex-abv/private-runtime/src/vector-runtime-dependency-probe-runner.mjs`
  - `cortex-abv/private-runtime/receipts/vector-runtime-dependency-probe-receipt.v1.json`
- Current receipt proves:
  - PyPI `turbovec` can be installed into a temporary local Python venv when explicitly allowed;
  - `IdMapIndex` can build from synthetic vectors;
  - synthetic queries pass recall and claim-evidence gates;
  - governance remains `readOnly`, `proposalOnly`, no endpoint, no LLM, no external write and no public action authority.
- This does not yet approve package pinning or runtime integration.

#### Stage 4d execution status (completed)

- Added package supply policy gate:
  - `cortex-abv/private-runtime/config/vector-runtime-package-policy.v1.json`
  - `cortex-abv/private-runtime/src/vector-runtime-package-policy.mjs`
  - `cortex-abv/private-runtime/receipts/vector-runtime-package-policy-receipt.v1.json`
- Current policy fixes:
  - PyPI package `turbovec==0.8.0`;
  - temporary/local venv only;
  - no committed venv and no global site-packages;
  - install only with an explicit flag;
  - platform constraints and reproducibility receipt fields;
  - read-only/proposal-only governance with no endpoint, LLM, external write or public action authority.
- Dependency probe receipts now carry the package policy digest and install spec.
- This approves only the supply policy for bounded probes, not runtime integration.

#### Stage 4e execution status (completed)

- Added runtime integration preflight aggregator:
  - `cortex-abv/private-runtime/src/vector-runtime-integration-preflight.mjs`
  - `cortex-abv/private-runtime/receipts/vector-runtime-integration-preflight-receipt.v1.json`
- Aggregates:
  - package policy receipt;
  - dependency probe receipt;
  - runtime readiness receipt;
  - synthetic retrieval shadow receipt.
- Current receipt result:
  - `eligibility: "eligible_for_design_review"`;
  - `status: "passed"`;
  - `blockers: []`.
- Scope remains design-review only. It does not approve implementation, runtime integration, endpoints, model calls, external writes or public actions.

#### Stage 4f execution status (completed)

- Added runtime wiring design review gate:
  - `cortex-abv/private-runtime/config/vector-runtime-wiring-design.v1.json`
  - `cortex-abv/private-runtime/src/vector-runtime-wiring-design.mjs`
  - `cortex-abv/private-runtime/receipts/vector-runtime-wiring-design-receipt.v1.json`
- Current receipt result:
  - `eligibility: "eligible_for_implementation_poc_review"`;
  - `status: "passed"`;
  - `blockers: []`.
- Design scope:
  - private-runtime-only boundary;
  - candidate retrieval only;
  - no endpoint, scheduler, LLM calls, external writes or public actions;
  - no implementation POC approval yet.
- Next possible stage is an implementation POC review, not implementation by default.

#### Stage 4g execution status (completed)

- Added implementation POC review gate:
  - `cortex-abv/private-runtime/config/vector-runtime-implementation-poc-review.v1.json`
  - `cortex-abv/private-runtime/src/vector-runtime-implementation-poc-review.mjs`
  - `cortex-abv/private-runtime/receipts/vector-runtime-implementation-poc-review-receipt.v1.json`
- Current receipt result:
  - `eligibility: "eligible_for_implementation_poc_dry_run_review"`;
  - `status: "passed"`;
  - `blockers: []`.
- Minimum future POC scope:
  - local gitignored index artifact root: `data/vector-indexes/turbovec-poc`;
  - allowed source packs: synthetic benchmark or reviewed private source pack;
  - required source/index/wiring digest linkage and rollback notes;
  - dry-run commands only: `build_index_poc_dry_run`, `query_index_poc_dry_run`, `verify_index_poc_dry_run`.
- Still forbidden: POC implementation approval, runtime activation, endpoint, scheduler, LLM calls, source mutation, external writes, public actions and publication.

## Staged adoption (hard requirement)
1. Read-only planning (contracts + synthetic map only)
2. One read-only adapter job in private runtime
3. Proposal/receipt outputs only
4. Bounded write authority only after dual-review and explicit policy gate

## References
- `docs/cortex-abv-read-only-import-contract.md`
- `docs/cortex-abv-personal-knowledge-core.md`
- `docs/project-description-sync.md`
