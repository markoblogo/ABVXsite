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
