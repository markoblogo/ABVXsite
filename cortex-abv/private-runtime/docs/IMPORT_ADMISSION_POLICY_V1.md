# Import Admission Policy v1

The import admission policy is a local, deterministic gate before a new packet reaches the private ledger.

It checks the exact `(source.kind, source.id, dataKind)` tuple, classification, and the existing inbound-only packet contract. It then records an admission receipt with a policy digest, retention deadline, and personal-surface eligibility.

The policy grants neither source access nor publication authority. `proposal_only` means an item may later be considered as evidence for a bounded proposal; it does not create, approve, or apply that proposal.

Admission receipts include a `decisionTrace` block to make policy decisions auditable in logs and ledger records:

- `policySource`: `base` or `source_specific_override`;
- `sourceKind`/`sourceId`;
- `dataKind`;
- `reason`;
- `memoryGuard`: trust level, permitted-use check, provenance-kind check and payload-scope result;
- `basePolicy` + `sourceOverride` snapshots when override is present.

The current rules are intentionally narrow and now include source-aware classification overrides:

- `base-cortex` + `cortex_market_workforce_packet`;
- `index/spike` + `index_spike_project_update`;
- `monitor` + `monitor_project_update`.

Monitor source has a separate public path than base classification defaults:

- `monitor` + public: 7 days, `proposal_only`, targets `abvxsite` only;
- `monitor` + protected: 14 days, `private_context_only`, no public targets.

`cropto` remains reserved for a future synthetic adapter pass and is intentionally not allowed yet.

All deletion remains manual. No scheduler or retention worker is introduced by this policy.

The `memoryGuard` portion is the local ingestion-defense layer inspired by OWASP Agent Memory Guard concepts. In CortexABV-private it stays deliberately narrow and deterministic:

- only allowlisted `provenance.kind` values are accepted per source;
- `permittedUse` must match the source trust profile;
- payloads are rejected if they contain prompt/tool/secret/endpoint-style keys that could smuggle instructions or runtime authority into memory ingestion.

This is a trust-and-scope gate only. It does not add model-based detection, quarantine workers, remote moderation or automatic remediation.

Tenant isolation and the planned AzurMenton guest AI surface are defined separately in [Tenant & Project AI Engine Contract v1](TENANT_PROJECT_AI_ENGINE_V1.md).
