# CortexABV Import Packet v1

`CortexABVImportPacket` is a typed, private-only inbound envelope. It is data, not an instruction and not a command.

Required fields:

- `packetId`, `observedAt`, `dataKind`;
- `source`: either `base_cortex/base-cortex` or an approved owner project ecosystem (`monitor`, `cropto`, `index`, or `index/<system>`);
- `classification`: `public` or `protected`;
- at least one provenance item with a SHA-256 digest;
- bounded `permittedUse`: `private_context` and/or `personal_surface_proposal_preparation`;
- fixed `direction: inbound_to_cortex_abv` and `returnAuthority: none`;
- JSON object payload.

The private ledger accepts supported operator imports only after structural validation and admission-policy validation. It appends a hash-chained entry with the packet digest, predecessor digest, and admission receipt. Existing packet digests are idempotent reads, not duplicate writes.

No packet can grant publication, source-system mutation, retrieval access, social access, or a callback to base Cortex or an owner project ecosystem. A later public proposal must re-establish its own evidence, target policy, and human approval.

## Direct synthetic import packet example

`examples/synthetic-import-packet-base-cortex.json` contains a synthetic `CortexABVImportPacket` that already follows the v1 contract:

- `schemaVersion: 1`, `kind: CortexABVImportPacket`
- `direction: inbound_to_cortex_abv`
- `returnAuthority: none`
- approved packet source and `dataKind` pair
- `permittedUse` restricted to private/surface-preparation
- structured provenance with SHA-256 digest

Use it with the local admission command before any future adapter writes:

```bash
npm run import:admit -- \
  --ledger data/import-ledger.jsonl \
  --packet examples/synthetic-import-packet-base-cortex.json \
  --policy config/import-admission-policy.v1.json
```

Each admitted packet is immutable in the private ledger (`protected` packets stay private_context_only), retains a hash-chained entry id, and is idempotent on replay.

Admission output includes a `decisionTrace` block (whether in script output or ledger receipt) showing if the source-specific policy branch was used and why it was selected.

## Base Cortex workforce shadow adapter

`shadow:base-cortex` accepts a future-shaped `OneD3xCortexMarketWorkforcePacket` from disk only. Required source fields are task/correlation identity, diversity mode, source status, hypotheses, evidence, counterevidence, officer review, human approval, outcome, blockers, timestamp, and source digest.

The adapter emits a protected inbound Import Packet with one permitted use: `private_context`. It marks the payload as `shadow` and fixes `publicActionAuthority` to `none`; no source payload is treated as an instruction, publication approval, or call-back authority.

## Index/spike project shadow adapter

`shadow:index-spike` accepts `IndexSpikeProjectUpdatePacket` from disk only. The packet carries project identity, update ID, source status, changed-surface references, evidence, review state, blockers, observation timestamp, and source digest.

The adapter accepts only `projectId: "index/spike"`. It creates a protected inbound shadow Import Packet with `returnAuthority: "none"`; it cannot modify Index, invoke Cortex, or create a public proposal.

## Monitor/MN7R project shadow adapter

`shadow:monitor-mn7r` accepts `MonitorProjectUpdatePacket` from disk only. It requires the exact source product pair `projectId: "monitor"` and `productId: "mn7r"`, along with changed-surface references, evidence, review state, blockers, timestamp, and source digest.

It passes through the `monitor` admission policy rule before a new ledger entry is appended. The output is a protected private-context-only shadow import; it cannot modify Monitor, MN7R, base Cortex, or any public surface.

## Admission policy

[`config/import-admission-policy.v1.json`](../config/import-admission-policy.v1.json) allowlists exact source/data-kind pairs and defines classification retention and personal-surface eligibility.

- `public`: 30 days, manual deletion required, proposal-only eligibility for `abvxsite`, `owner_repository`, and `linkedin`;
- `protected`: 14 days, manual deletion required, private-context-only with no personal surface target.

Eligibility is not action authority. A target still needs its own evidence, policy, validation, and human approval before any proposal can be applied.
