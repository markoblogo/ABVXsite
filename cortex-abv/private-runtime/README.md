# CortexABV private runtime contract snapshot

## Public-export boundary

This subtree is an auditable code-and-contract snapshot of the local CortexABV private runtime at source commit `5b3496e`. It is included here so the tenant, source-pack, admission, and shadow-evaluation contracts can be reviewed alongside the public adapter.

It is **not** a deployed private runtime. It contains no ledger entries, `data/` directory, credentials, `.env` files, real packets, protected payloads, personal profile, guest data, or remote configuration. The actual local runtime and any protected store remain separate. [`EXPORT.md`](EXPORT.md) defines the public-export boundary, and the ABVXsite export guard fails if prohibited files or token-like values are added.

The canonical runtime is local-only and has no HTTP server, scheduler, credentials, production integration, or real imported data. This published snapshot does not change that authority boundary.

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
npm test
npm run shadow:base-cortex -- \
  --ledger data/import-ledger.jsonl \
  --source-packet examples/synthetic-base-cortex-workforce-packet.json
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

This bootstrap validates and records a packet. It does not retrieve from Cortex, call a project system, build RAG, invoke an LLM, prepare public copy, publish, or connect to CoqPi. Those need separate contracts and explicit approval.
