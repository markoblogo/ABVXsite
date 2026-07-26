# CortexABV private runtime contract snapshot

## Public-export boundary

This subtree is an auditable code-and-contract snapshot of the local CortexABV private runtime at source commit `611d76f`. It contains the canonical contract body below plus snapshot-only export documentation in [`EXPORT.md`](EXPORT.md).

It is **not** a deployed private runtime. It contains no ledger entries, `data/` directory, credentials, `.env` files, real packets, protected payloads, personal profile, guest data, or remote configuration. The ABVXsite export guard fails if prohibited files or token-like values are added.

The Personal Knowledge Core is one private, owner-controlled store shared conceptually by CortexABV and CoqPi. This export documents only pending metadata ingress and later read-only compact-pack shapes; it contains no store, document contents, interview artifacts, retrieval index, or CoqPi endpoint.

## Canonical runtime contract

This is a local-only private runtime and append-only store for CortexABV imports. It is deliberately separate from ABVXsite and has no Git remote, HTTP server, scheduler, credentials, production integration, or real imported data.

## Import boundary

Allowed inbound sources are:

- `base-cortex`;
- owner-controlled project ecosystems: `monitor`, `index` and named Index systems, and `cropto`.

Every packet is strictly `inbound_to_cortex_abv` and has `returnAuthority: "none"`. The runtime has no mechanism to send data, commands, feedback, policy, or workflow influence back to those sources.

`protected` payloads stay in the local ledger. They are never written to ABVXsite, GitHub Actions artifacts, generated public indexes, receipts, or logs.

"Private" here means a separate local repository with no remote and a Git-ignored data store; it is not encryption at rest. Any deployment beyond this machine must add encrypted storage, narrowly scoped runtime identity, access controls, retention/deletion handling, and backup policy before real protected data is imported.

## Tenant and project AI engine contract

CortexABV is a universal private AI engine for owner-controlled projects, not one shared RAG corpus. [`config/tenant-project-ai-engine.v1.json`](config/tenant-project-ai-engine.v1.json) defines isolated `personal`, `azur-menton`, `monitor-mn7r`, `index-spike`, and `cropto` tenants. Each has tenant-only retrieval, denied cross-tenant access and no action authority.

AzurMenton is a wholly owned project and may later receive a read-only guest chat. Before that surface exists, it requires a versioned source pack, guest chat policy, shadow eval pack and human approval. It cannot access personal context or another project's data.

```bash
npm run tenant:check
```

## AzurMenton Source Pack v1

[`config/azur-menton-source-pack.v1.json`](config/azur-menton-source-pack.v1.json) is a read-only, versioned manifest of the public guide, FAQ, and place corpus at a specific AzurMenton repository revision. Each allowlisted source is repository-relative and carries its SHA-256 provenance. The pack intentionally stores no copied guide text, guest data, credentials, booking state, or runtime connection.

[`config/azur-menton-guest-chat-policy.v1.json`](config/azur-menton-guest-chat-policy.v1.json) is a policy skeleton for the future guest surface. It is plan-only: answers must remain read-only, cite a source for factual claims, abstain when the source pack cannot verify a claim, and hand off booking, availability, price/payment, safety, or other unsupported requests. It cannot retrieve personal or sibling-tenant context.

```bash
npm run azur-menton:check
npm run azur-menton:check -- --source-root /Volumes/Work/Work/menton
```

Without `--source-root`, this validates static contracts only. With the explicit local root, it additionally hashes the allowlisted files and fails on provenance drift. Neither mode builds retrieval, calls an LLM, receives guest data, exposes a chat endpoint, or contacts AzurMenton.

## AzurMenton shadow evaluation pack

[`config/azur-menton-shadow-evaluation.v1.json`](config/azur-menton-shadow-evaluation.v1.json) holds six synthetic intent templates for the future guest chat: two source-grounded guide/place questions, two abstentions for unverified or personal-context questions, and two handoffs for availability and price/payment. It contains no real guest messages or model outputs.

```bash
npm run azur-menton:shadow-eval:check
```

The deterministic verifier only checks that every scenario is structurally safe and matches the Source Pack and guest-chat policy. It does not invoke a model, assess answer wording, perform retrieval, or permit activation; a later shadow run must capture candidate outputs separately and remain subject to human approval.

## Admission policy

Every supported import is checked against [`config/import-admission-policy.v1.json`](config/import-admission-policy.v1.json) before it reaches the ledger. The policy fixes four things:

- exact allowed source IDs and data kinds;
- classification-specific retention: 30 days for `public`, 14 days for `protected`, both manually deleted;
- personal-surface eligibility: public data is `proposal_only` for ABVXsite, owner repositories, and LinkedIn; protected data is `private_context_only`;
- no change to the inbound-only / no-return boundary.

The resulting admission receipt is appended with every new entry. The low-level append module is not a supported operator command.

Entries created before this policy remain unchanged by design; the append-only ledger does not backfill or mutate them. Supported commands report whether an admission receipt was recorded with the entry or only evaluated for an already-existing legacy packet.

## Import a synthetic packet

```bash
npm run shadow:base-cortex -- \
  --ledger data/import-ledger.jsonl \
  --source-packet examples/synthetic-base-cortex-workforce-packet.json
```

Or append a synthetic packet directly:

```bash
npm run import:admit -- \
  --ledger data/import-ledger.jsonl \
  --packet examples/synthetic-import-packet-base-cortex.json \
  --policy config/import-admission-policy.v1.json
```

The command emits only an idempotent metadata summary plus retention and eligibility. The ledger is JSONL, hash-chained, and ignored by Git. Replaying an identical packet returns its existing entry without writing a duplicate.

## Synthetic base Cortex shadow import

The future `OneD3xCortexMarketWorkforcePacket` shape is represented by a synthetic fixture only. It carries task/correlation identity, diversity mode, source status, hypotheses, evidence/counterevidence, officer review, human approval, outcome, blockers, timestamp, and source digest.

```bash
npm run shadow:base-cortex -- \
  --ledger data/import-ledger.jsonl \
  --source-packet examples/synthetic-base-cortex-workforce-packet.json
```

It maps the source packet to a protected `CortexABVImportPacket` with `mode: "shadow"`, `permittedUse: ["private_context"]`, and `publicActionAuthority: "none"`. It does not retrieve from Cortex or create a public proposal.

## Synthetic Index/spike shadow import

`IndexSpikeProjectUpdatePacket` is the separate future shape for one owner project source. It uses project identity, update ID, source status, changed-surface references, evidence, review state, blockers, timestamp, and digest. The fixture contains no index values, market reports, production identifiers, or real repository data.

```bash
npm run shadow:index-spike -- \
  --ledger data/import-ledger.jsonl \
  --source-packet examples/synthetic-index-spike-project-update.json
```

Only `projectId: "index/spike"` is accepted by this adapter. It maps to a protected inbound shadow packet and cannot create a public proposal, modify Index, or provide a path back to Cortex.

## Synthetic Monitor/MN7R shadow import

`MonitorProjectUpdatePacket` is the separate future shape for Monitor updates about MN7R. It requires `projectId: "monitor"` and `productId: "mn7r"`, plus synthetic changed-surface references, evidence, review state, blockers, timestamp, and digest.

```bash
npm run shadow:monitor-mn7r -- \
  --ledger data/import-ledger.jsonl \
  --source-packet examples/synthetic-monitor-mn7r-project-update.json
```

The supported command passes through the same admission gate before append. It remains protected, private-context-only and cannot change Monitor, MN7R, Cortex, or any public surface.

## Scope

This bootstrap validates and records a packet. Its Personal Knowledge Core ingress contract accepts only pending metadata records; it does not retrieve, capture source content, call a project system, build a vector index, invoke an LLM, prepare public copy, publish, or enable an external action.

## Vector retrieval pilot: local TurboQuant contract

To prepare a local retrieval layer without changing governance, the runtime now has a planned pilot contract for a local-only vector index candidate:

- `config/vector-retrieval-turbovec-pilot.v1.json` defines bounded controls and source scope for a read-only, no-side-effect retrieval experiment.
- `src/check-vector-retrieval-pilot.mjs` validates the contract.

Check it locally:

```bash
cd cortex-abv/private-runtime
npm run vector-retrieval-pilot:check
```

The pilot is **synthetic** by default and must stay proposal-only until separate governance gates add explicit retrieval evidence rules.

## Vector retrieval shadow runner (Stage 3)

After fixtures are in place, you can run a local deterministic synthetic benchmark that:

- builds a TF-IDF/BM25-like deterministic rerank pass (local-only stub) over an allowlisted corpus;
- applies a hard candidate-score threshold on top-k results;
- requires evidence anchors for returned candidates via `decisionTrace.claimEvidence`;
- blocks passage when claim anchors are missing.
- computes recall@k against probe expectations;
- emits a signed-ish receipt with claim evidence per candidate;
- keeps all safety controls explicit (`no_network`, `no_llm`, `no_writes`, `no_public_actions`).

Fixture: `examples/synthetic-vector-retrieval-benchmark.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-retrieval-shadow:run
```

Result artifact:

`receipts/vector-retrieval-turbovec-shadow-receipt.v1.json`

This is Stage 3 synthetic validation only. It does not build ANN indexes and does not call vector dependencies yet.

Planned index-layer readiness is now represented in plan shape: it includes an `indexInterface` section with ANN intent and deterministic tf-idf fallback. The runner keeps current governance gates untouched and records all fallback decisions in `decisionTrace` (`requestedReranker`, `fallbackApplied`, `fallbackEngine`, `fallbackReason`).

## Vector runtime readiness shim

The next retrieval layer is represented by a local `buildIndex/query` shim:

- `src/vector-runtime-shim.mjs` exposes `buildVectorRuntimeIndex` and `queryVectorRuntimeIndex`.
- `src/vector-runtime-readiness-runner.mjs` runs the shim against the synthetic benchmark.
- `receipts/vector-runtime-readiness-receipt.v1.json` records the latest readiness receipt.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-readiness:run
```

This is still a stubbed runtime boundary. It does not import `turbovec`, build a real ANN index, expose a retrieval endpoint, call models, write outside the receipt, or grant public action authority. Its purpose is to fix the future runtime interface and prove fallback/evidence tracing before any dependency is wired.

## Vector runtime package policy

The dependency probe now has an explicit package supply policy:

- `config/vector-runtime-package-policy.v1.json` pins PyPI `turbovec==0.8.0`.
- `src/vector-runtime-package-policy.mjs` validates the package, temporary/local venv policy, platform constraints and reproducibility receipt fields.
- `receipts/vector-runtime-package-policy-receipt.v1.json` records the current policy digest and observed platform.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-package-policy:check
```

The policy allows network only during an explicit temporary dependency install. It forbids committed venvs, global site-packages, runtime integration, endpoints, LLM calls, writes outside receipts and public action authority.

## Vector runtime dependency probe

The first real `turbovec` dependency check is a separate gate:

- `src/vector-runtime-dependency-probe-runner.mjs` runs a bounded Python `turbovec.IdMapIndex` probe.
- `receipts/vector-runtime-dependency-probe-receipt.v1.json` records index-build and query acceptance.
- Tests use a mock executor; the real dependency path is opt-in.

Default command, no install:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-dependency-probe:run
```

Real local probe, allowed to create a temporary venv and install PyPI `turbovec`:

```bash
cd cortex-abv/private-runtime
node src/vector-runtime-dependency-probe-runner.mjs \
  --plan config/vector-retrieval-turbovec-pilot.v1.json \
  --benchmark examples/synthetic-vector-retrieval-benchmark.v1.json \
  --policy config/vector-runtime-package-policy.v1.json \
  --receipt receipts/vector-runtime-dependency-probe-receipt.v1.json \
  --allow-install
```

Passing this gate means only that the pinned real local dependency can build an `IdMapIndex` and answer synthetic queries with evidence-backed candidates under the package policy. It does not approve runtime integration, endpoints, public retrieval, model calls, external writes, or autonomous publication.

## Vector runtime integration preflight

The runtime integration preflight aggregates the current vector receipts:

- `receipts/vector-runtime-package-policy-receipt.v1.json`
- `receipts/vector-runtime-dependency-probe-receipt.v1.json`
- `receipts/vector-runtime-readiness-receipt.v1.json`
- `receipts/vector-retrieval-turbovec-shadow-receipt.v1.json`

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-integration-preflight:run
```

The output is `receipts/vector-runtime-integration-preflight-receipt.v1.json`. It returns either `eligible_for_design_review` or `not_eligible_for_design_review`.

Eligibility means only that the existing evidence is coherent enough to discuss a future real runtime wiring design. It does not approve implementation, package installation in runtime, endpoints, retrieval activation, model calls, external writes, public actions, or publication.

## Vector runtime wiring design

The wiring design gate records the first design-review contract for a future implementation POC:

- `config/vector-runtime-wiring-design.v1.json` defines runtime boundary, index lifecycle, query contract, promotion gate and rejection cases.
- `src/vector-runtime-wiring-design.mjs` validates the design against the integration preflight receipt.
- `receipts/vector-runtime-wiring-design-receipt.v1.json` records design eligibility.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-wiring-design:check
```

The receipt returns `eligible_for_implementation_poc_review` or `not_eligible`. Eligibility means only that a future implementation POC can be reviewed. It does not approve POC implementation, runtime activation, endpoints, schedulers, model calls, external writes, public actions or publication.

## Vector runtime implementation POC review

The implementation POC review gate fixes the minimum dry-run scope before any real POC code is approved:

- `config/vector-runtime-implementation-poc-review.v1.json` defines the local index artifact root, allowed source packs, digest/rollback rules and dry-run command allowlist.
- `src/vector-runtime-implementation-poc-review.mjs` validates that scope against the wiring design receipt.
- `receipts/vector-runtime-implementation-poc-review-receipt.v1.json` records review eligibility.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-implementation-poc-review:check
```

The receipt returns `eligible_for_implementation_poc_dry_run_review` or `not_eligible`. Eligibility means only that a future dry-run POC scope can be reviewed. The allowed future index artifact root is `data/vector-indexes/turbovec-poc`, covered by `.gitignore`; source packs are limited to the synthetic benchmark or reviewed private source packs; dry-run commands are limited to `build_index_poc_dry_run`, `query_index_poc_dry_run` and `verify_index_poc_dry_run`.

This still does not approve POC implementation, package installation, runtime activation, endpoints, schedulers, model calls, source-pack mutation, external writes, public actions or publication.

## Vector runtime implementation POC dry-run

The dry-run executes the approved minimum POC scope locally:

- `config/vector-runtime-implementation-poc-dry-run.v1.json` defines the synthetic source pack, local artifact path, commands, digest checks and rollback notes.
- `src/vector-runtime-implementation-poc-dry-run.mjs` builds a local gitignored index artifact, runs synthetic queries, checks recall/evidence and writes a receipt.
- `receipts/vector-runtime-implementation-poc-dry-run-receipt.v1.json` records source digest, index digest, command trace, probe results and rollback notes.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-implementation-poc-dry-run:run
```

The local index artifact is written to `data/vector-indexes/turbovec-poc/index-artifact.v1.json`; that directory is intentionally gitignored. The committed receipt returns `eligible_for_controlled_runtime_module_review` or `not_eligible`.

This still does not approve runtime activation, endpoints, schedulers, model calls, network calls, source-pack mutation, external writes, public actions or publication.

## Vector runtime controlled module design

The controlled module design gate defines the future local module contract that may consume the Stage 4h artifact interface:

- `config/vector-runtime-controlled-module-design.v1.json` defines the module boundary, artifact interface, candidate-query return shape and review gate.
- `src/vector-runtime-controlled-module-design.mjs` validates that contract against the Stage 4h dry-run receipt.
- `receipts/vector-runtime-controlled-module-design-receipt.v1.json` records design eligibility and the required Stage 4h receipt digest.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-controlled-module-design:check
```

The receipt returns `eligible_for_controlled_runtime_module_poc_review` or `not_eligible`. Eligibility means only that a future controlled local module POC can be reviewed. The module interface is limited to `loadIndexArtifact`, `queryCandidates` and `verifyClaimEvidence`; it must consume the gitignored Stage 4h artifact read-only, return candidates only, preserve tenant scope, apply hard thresholds and carry evidence refs.

This still does not approve module implementation, runtime wiring, endpoints, schedulers, model calls, network calls, source or artifact mutation, external writes, public actions or publication.

## Vector runtime controlled module POC review

The controlled module POC review gate fixes the minimum local harness scope before any harness implementation:

- `config/vector-runtime-controlled-module-poc-review.v1.json` defines the future harness path, required module interface, digest checks and dry-run command allowlist.
- `src/vector-runtime-controlled-module-poc-review.mjs` validates that scope against the Stage 4i controlled module design receipt.
- `receipts/vector-runtime-controlled-module-poc-review-receipt.v1.json` records review eligibility and the required Stage 4i receipt digest.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-controlled-module-poc-review:check
```

The receipt returns `eligible_for_controlled_runtime_module_harness_dry_run_review` or `not_eligible`. Eligibility means only that a future local harness dry-run can be reviewed. The future harness is limited to `src/vector-runtime-controlled-module-harness.mjs`, with tests in `test/vector-runtime-controlled-module-harness.test.mjs`, and commands limited to `load_index_artifact_poc_dry_run`, `query_candidates_poc_dry_run` and `verify_claim_evidence_poc_dry_run`.

This still does not approve harness implementation, runtime wiring, endpoints, schedulers, model calls, network calls, source or artifact mutation, external writes, public actions or publication.

## Vector runtime controlled module harness dry-run

The local harness dry-run is the first minimal implementation POC for the controlled module surface:

- `config/vector-runtime-controlled-module-harness-dry-run.v1.json` defines the Stage 4j prerequisite, Stage 4h artifact path, dry-run queries and command trace.
- `src/vector-runtime-controlled-module-harness.mjs` implements the local library functions: `loadIndexArtifact`, `queryCandidates`, `verifyClaimEvidence`.
- `src/vector-runtime-controlled-module-harness-dry-run.mjs` runs the harness against the local artifact and writes a receipt.
- `receipts/vector-runtime-controlled-module-harness-dry-run-receipt.v1.json` records Stage 4j receipt digest, Stage 4h artifact/source digests, tenant-scoped query results and evidence verification.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-controlled-module-harness-dry-run:run
```

The receipt returns `eligible_for_controlled_runtime_wiring_design_review` or `not_eligible`. Eligibility means only that a later runtime wiring design review can be discussed. It does not approve wiring.

The harness reads only `data/vector-indexes/turbovec-poc/index-artifact.v1.json`, verifies the Stage 4j receipt digest and Stage 4h artifact/source digests, returns tenant-scoped candidates only, and verifies evidence refs.

This still does not approve endpoints, schedulers, model calls, network calls, source or artifact mutation, external writes, public actions or publication.

## Vector runtime controlled wiring design

The controlled wiring design gate reviews the shape of a future local binding without activating it:

- `config/vector-runtime-controlled-wiring-design.v1.json` defines a private-runtime-only, in-process local library binding design.
- `src/vector-runtime-controlled-wiring-design.mjs` validates the design against the Stage 4k harness dry-run receipt.
- `test/vector-runtime-controlled-wiring-design.test.mjs` blocks endpoint, activation or runtime-integration authority.
- `receipts/vector-runtime-controlled-wiring-design-receipt.v1.json` records the Stage 4k digest linkage and governance decision.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-controlled-wiring-design:check
```

The receipt returns `eligible_for_controlled_runtime_wiring_poc_review` or `not_eligible`. Eligibility means only that a future wiring POC review can be discussed. It does not approve wiring implementation or activation.

The design allows only the existing local harness functions: `loadIndexArtifact`, `queryCandidates`, and `verifyClaimEvidence`. It requires Stage 4k receipt digest, Stage 4h artifact/source digests, tenant scope, hard threshold and evidence refs. It returns candidates only and does not generate answers.

This still does not approve endpoints, schedulers, model calls, network calls, source or artifact mutation, external writes, public actions or publication.

## Vector runtime controlled wiring POC review

The controlled wiring POC review gate defines the minimum scope for a future local dry-run without implementing it:

- `config/vector-runtime-controlled-wiring-poc-review.v1.json` defines the future runner/test paths, allowed local binding, allowed artifact path, command allowlist and rollback policy.
- `src/vector-runtime-controlled-wiring-poc-review.mjs` validates that scope against the Stage 4l controlled wiring design receipt.
- `test/vector-runtime-controlled-wiring-poc-review.test.mjs` blocks endpoint, activation and non-allowlisted binding attempts.
- `receipts/vector-runtime-controlled-wiring-poc-review-receipt.v1.json` records the Stage 4l receipt digest and minimum future POC scope.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-controlled-wiring-poc-review:check
```

The receipt returns `eligible_for_controlled_runtime_wiring_poc_dry_run_review` or `not_eligible`. Eligibility means only that a future local wiring POC dry-run can be reviewed. It does not approve POC implementation, wiring implementation or runtime activation.

The future POC scope is limited to `src/vector-runtime-controlled-wiring-poc-dry-run.mjs`, tests in `test/vector-runtime-controlled-wiring-poc-dry-run.test.mjs`, the existing controlled harness module, and dry-run commands ending in `_poc_dry_run`.

This still does not approve endpoints, schedulers, model calls, network calls, source or artifact mutation, external writes, public actions or publication.

## Vector runtime controlled wiring POC dry-run

The controlled wiring POC dry-run is the first local-only binding run over the existing harness:

- `config/vector-runtime-controlled-wiring-poc-dry-run.v1.json` defines the Stage 4m prerequisite, artifact path, local binding, queries, command trace and rollback notes.
- `src/vector-runtime-controlled-wiring-poc-dry-run.mjs` verifies Stage 4m/4l/4k/4h digest continuity, binds the local harness in-process, runs tenant-scoped candidate queries and writes a receipt.
- `test/vector-runtime-controlled-wiring-poc-dry-run.test.mjs` blocks a non-eligible Stage 4m receipt and activation/endpoint/answer-generation attempts.
- `receipts/vector-runtime-controlled-wiring-poc-dry-run-receipt.v1.json` records digest linkage, local binding trace, query results, rollback notes and governance.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-controlled-wiring-poc-dry-run:run
```

The receipt returns `eligible_for_controlled_runtime_wiring_review` or `not_eligible`. Eligibility means only that a later controlled runtime wiring review gate can be discussed. It does not activate the runtime, expose an endpoint, start a scheduler, call a model, use the network, mutate source/index artifacts or grant public action authority.

The dry-run uses only `loadIndexArtifact`, `queryCandidates` and `verifyClaimEvidence` from the existing local harness. It returns candidates only; no answer generation is allowed.

## Vector runtime controlled wiring review

The controlled wiring review gate defines what “wired” means before any runtime activation:

- `config/vector-runtime-controlled-wiring-review.v1.json` defines the reviewed internal local binding boundary and separate activation boundary.
- `src/vector-runtime-controlled-wiring-review.mjs` validates the contract against the Stage 4n controlled wiring POC dry-run receipt.
- `test/vector-runtime-controlled-wiring-review.test.mjs` blocks a non-eligible Stage 4n receipt and activation/endpoint/LLM authority.
- `receipts/vector-runtime-controlled-wiring-review-receipt.v1.json` records the Stage 4n digest, prerequisite digest chain, wiring definition and activation boundary.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-controlled-wiring-review:check
```

The receipt returns `eligible_for_runtime_activation_review` or `not_eligible`. Eligibility means only that a later activation review gate can be discussed. It does not activate runtime wiring.

The reviewed wiring boundary remains private-runtime-only, in-process local library binding only, candidates-only, tenant-scoped and evidence-backed. Endpoints, schedulers, network calls, model calls, public action authority, external writes, source/index mutation and answer generation remain forbidden.

## Vector runtime activation review

The runtime activation review gate defines what can count as local private-runtime activation before any activation dry-run:

- `config/vector-runtime-activation-review.v1.json` defines activation as local private-runtime availability for an internal callable interface only.
- `src/vector-runtime-activation-review.mjs` validates the contract against the Stage 4o controlled wiring review receipt.
- `test/vector-runtime-activation-review.test.mjs` blocks a non-eligible Stage 4o receipt and activation/endpoint/network authority.
- `receipts/vector-runtime-activation-review-receipt.v1.json` records the Stage 4o digest, prerequisite digest chain, activation definition and future dry-run scope.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-activation-review:check
```

The receipt returns `eligible_for_runtime_activation_dry_run_review` or `not_eligible`. Eligibility means only that a later activation dry-run review can be discussed. It still does not activate runtime wiring.

Activation is defined narrowly as a local process-bound callable interface inside `cortex-abv/private-runtime`. Endpoints, schedulers, network calls, model calls, public action authority, external writes, source/index mutation, cross-tenant queries, answer generation and baseline advancement remain forbidden.

## Vector runtime activation dry-run review

The activation dry-run review gate defines the minimum scope for a future local activation dry-run:

- `config/vector-runtime-activation-dry-run-review.v1.json` defines dry-run commands, rollback, digest chain and local callable interface checks.
- `src/vector-runtime-activation-dry-run-review.mjs` validates the contract against the Stage 4p runtime activation review receipt.
- `test/vector-runtime-activation-dry-run-review.test.mjs` blocks a non-eligible Stage 4p receipt and activation/network/shell authority.
- `receipts/vector-runtime-activation-dry-run-review-receipt.v1.json` records the Stage 4p digest, prerequisite digest chain, dry-run scope and forbidden authority.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-activation-dry-run-review:check
```

The receipt returns `eligible_for_runtime_activation_dry_run` or `not_eligible`. Eligibility means only that a later local activation dry-run can be run. It still does not activate runtime wiring.

The future dry-run is limited to local callable interface checks: module importability, binding presence, read-only artifact load, tenant-scoped candidate-only query, evidence verification and proof that activation is not exposed. Writes remain receipt-only.

## Vector runtime activation dry-run

The first local activation dry-run now executes the approved callable checks without activating runtime:

- `config/vector-runtime-activation-dry-run.v1.json` defines the Stage 4q prerequisite, module path, artifact path, queries, commands, checks and rollback notes.
- `src/vector-runtime-activation-dry-run.mjs` imports the local harness module, verifies required bindings, checks the Stage 4q and Stage 4p digest chain, loads the artifact read-only, runs tenant-scoped candidate-only queries and writes a receipt.
- `test/vector-runtime-activation-dry-run.test.mjs` blocks a non-eligible Stage 4q receipt and activation/endpoint authority.
- `receipts/vector-runtime-activation-dry-run-receipt.v1.json` records module importability, binding checks, digest linkage, query results and governance.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-activation-dry-run:run
```

The receipt returns `eligible_for_runtime_readiness_review` or `not_eligible`. Eligibility means only that a later readiness review gate can be discussed. It still does not activate runtime wiring.

The dry-run writes only a receipt. It does not expose an endpoint, start a scheduler, call a model, use the network, mutate source/index artifacts, create public actions or publish anything.

## Vector runtime readiness review

The runtime readiness review gate now formalizes which Stage 4r signals are enough to move toward a separate activation decision review, still without activation:

- `config/vector-runtime-readiness-review.v1.json` defines the required Stage 4r signals: module importability, bindings, no activation exposure, read-only artifact, Stage 4h digest match, digest continuity, passed tenant-scoped candidate-only queries, verified evidence refs and receipt-only writes.
- `src/vector-runtime-readiness-review.mjs` validates the readiness contract against the Stage 4r activation dry-run receipt.
- `test/vector-runtime-readiness-review.test.mjs` blocks a non-eligible Stage 4r receipt and any introduced activation exposure or endpoint authority.
- `receipts/vector-runtime-readiness-review-receipt.v1.json` records readiness signals, digest lineage, activation-decision boundary and governance.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-readiness-review:check
```

The receipt returns `eligible_for_runtime_activation_decision_review` or `not_eligible`. Eligibility means only that a later activation decision review can be discussed. It still does not activate runtime wiring, expose an endpoint, start a scheduler, call a model, use network authority or create public actions.

## Vector runtime activation decision review

The runtime activation decision review gate now defines exactly what a later separate local activation decision may approve, and what stays forbidden even after that decision:

- `config/vector-runtime-activation-decision-review.v1.json` defines the bounded local activation scope: owner-invoked same-process callable availability only, fixed harness module path, fixed bindings, read-only Stage 4h artifact, tenant-scoped candidate queries and evidence verification.
- `src/vector-runtime-activation-decision-review.mjs` validates that bounded activation scope against the Stage 4s runtime readiness review receipt.
- `test/vector-runtime-activation-decision-review.test.mjs` blocks a non-eligible Stage 4s receipt and any exposed activation or endpoint authority.
- `receipts/vector-runtime-activation-decision-review-receipt.v1.json` records the allowed local activation scope, the decision boundary, what remains forbidden after decision, and governance.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-activation-decision-review:check
```

The receipt returns `eligible_for_local_runtime_activation_decision` or `not_eligible`. Eligibility means only that a later explicit local activation decision artifact may be prepared under owner approval. It still does not activate runtime wiring, expose an endpoint, start a scheduler, call a model, use network authority, mutate source/index artifacts or create public actions.

## Vector runtime activation decision artifact

The local runtime activation decision artifact now records the explicit owner-approved decision under the Stage 4t boundary, still without applying activation:

- `config/vector-runtime-activation-decision.v1.json` defines the owner approval, activation intent, rollback plan, next gate, forbidden authority and governance.
- `src/vector-runtime-activation-decision.mjs` validates the decision artifact against the Stage 4t runtime activation decision review receipt.
- `test/vector-runtime-activation-decision.test.mjs` blocks a non-eligible Stage 4t receipt and missing owner approval or introduced endpoint authority.
- `receipts/vector-runtime-activation-decision-receipt.v1.json` records the owner-approved local activation decision artifact, digest lineage and the next dry-run gate.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-activation-decision:run
```

The receipt returns `eligible_for_local_runtime_activation_dry_run` or `not_eligible`. Eligibility means only that a later bounded local activation dry-run may be prepared. It still does not apply activation, expose an endpoint, start a scheduler, call a model, use network authority, mutate source/index artifacts or create public actions.

## Vector runtime local activation dry-run

The local runtime activation dry-run now executes the first bounded post-decision dry-run, still without applying activation:

- `config/vector-runtime-local-activation-dry-run.v1.json` defines the Stage 4u prerequisite, fixed callable module boundary, read-only artifact path, tenant-scoped queries, commands, checks and rollback notes.
- `src/vector-runtime-local-activation-dry-run.mjs` validates the Stage 4u decision digest chain, imports the fixed harness module, loads the artifact read-only, runs tenant-scoped candidate-only queries, verifies evidence refs and writes a receipt.
- `test/vector-runtime-local-activation-dry-run.test.mjs` blocks a non-eligible Stage 4u receipt and any introduced activation-applied or endpoint authority.
- `receipts/vector-runtime-local-activation-dry-run-receipt.v1.json` records owner approval lineage, module checks, artifact checks, query results and governance.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-local-activation-dry-run:run
```

The receipt returns `eligible_for_local_runtime_activation_state_review` or `not_eligible`. Eligibility means only that a later local activation-state review can be discussed. It still does not apply activation, expose an endpoint, start a scheduler, call a model, use network authority, mutate source/index artifacts or create public actions.

## Vector runtime local activation state review

The local activation-state review gate now formalizes whether a distinct inactive-ready local state exists and how it is represented, still without applying activation:

- `config/vector-runtime-local-activation-state-review.v1.json` defines the Stage 4v prerequisite, receipt-defined inactive-ready state model, required dry-run signals, rollback-state policy and next gate.
- `src/vector-runtime-local-activation-state-review.mjs` validates the state review contract against the Stage 4v local activation dry-run receipt.
- `test/vector-runtime-local-activation-state-review.test.mjs` blocks a non-eligible Stage 4v receipt and any introduced activation-applied or endpoint authority.
- `receipts/vector-runtime-local-activation-state-review-receipt.v1.json` records the formal state definition, rollback-state policy, next transition-review gate and governance.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-local-activation-state-review:check
```

The receipt returns `eligible_for_local_activation_state_transition_review` or `not_eligible`. Eligibility means only that a later local state-transition review can be discussed. It still does not apply activation, perform a state transition, expose an endpoint, start a scheduler, call a model, use network authority, mutate source/index artifacts or create public actions.

## Vector runtime local activation-state transition review

The local activation-state transition review gate now defines the minimal transition artifact that could later move the runtime out of the inactive-ready state, still without applying any transition:

- `config/vector-runtime-local-activation-state-transition-review.v1.json` defines the Stage 4w prerequisite, minimal transition artifact boundary, required state signals, rollback-transition policy and next gate.
- `src/vector-runtime-local-activation-state-transition-review.mjs` validates that transition-review contract against the Stage 4w local activation-state review receipt.
- `test/vector-runtime-local-activation-state-transition-review.test.mjs` blocks a non-eligible Stage 4w receipt and any introduced transition-applied or endpoint authority.
- `receipts/vector-runtime-local-activation-state-transition-review-receipt.v1.json` records the transition boundary, rollback-transition policy, next transition-artifact gate and governance.

Run:

```bash
cd cortex-abv/private-runtime
npm run vector-runtime-local-activation-state-transition-review:check
```

The receipt returns `eligible_for_local_activation_state_transition_artifact` or `not_eligible`. Eligibility means only that a later local transition artifact can be discussed. It still does not apply activation, perform a state transition, expose an endpoint, start a scheduler, call a model, use network authority, mutate source/index artifacts or create public actions.

## Stage 1 Cabinet pilot: scheduled jobs contract

For the current Cabinet pilot Stage 1, the runtime snapshot now includes:

- `config/cabinet-scheduled-jobs-stage1.v1.json` — manifest for a read-only synthetic connector job.
- `receipts/cabinet-stage1-scheduled-jobs-receipt.v1.json` — proposal-style receipt with `reviewStatus`, `decisionTrace`, and retry policy.
- `scripts/cortex-abv-run-cabinet-stage1.mjs` — local Stage 2 real runner that recomputes and refreshes the synthetic receipt from local artifacts only.
- `config/import-admission-policy.v1.json` — shared admission policy used by the stage1 source adapter.
- `src/monitor-mn7r-shadow-import.mjs` + `examples/synthetic-monitor-mn7r-project-update.json` — first real monitor-owned synthetic source adapter input and converter.
- `src/index-spike-shadow-import.mjs` + `examples/synthetic-index-spike-project-update.json` — second real index-owned synthetic source adapter input and converter.

Current stage invariants:

- `result.sourceAdapters[].decisionTrace` is required for all enabled adapters before any future write-authority expansion.

Run this stage locally:

```bash
npm run cortex-abv:cabinet-stage1-run
```

The pilot remains intentionally non-executing: no scheduler, no endpoint, and no action authority are introduced at this stage. It is designed to preserve the existing governance path before any source-adapter binding.

## Shared Personal Knowledge Core

[`docs/SHARED_RAG_INGRESS_V1.md`](docs/SHARED_RAG_INGRESS_V1.md) defines owner-controlled CoqPi ingress records for a future shared Cortex/CoqPi RAG. The ingress is pending and CoqPi-only; promotion requires an explicit auditable decision.

## CoqPi compact context pack

[`docs/COQPI_CONTEXT_PACK_V1.md`](docs/COQPI_CONTEXT_PACK_V1.md) defines a possible later reviewed, private, read-only compact context export. The pack includes no source contents or paths, and its fixture is synthetic only.
