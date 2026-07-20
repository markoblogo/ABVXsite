# Import Admission Policy v1

The import admission policy is a local, deterministic gate before a new packet reaches the private ledger.

It checks the exact `(source.kind, source.id, dataKind)` tuple, classification, and the existing inbound-only packet contract. It then records an admission receipt with a policy digest, retention deadline, and personal-surface eligibility.

The policy grants neither source access nor publication authority. `proposal_only` means an item may later be considered as evidence for a bounded proposal; it does not create, approve, or apply that proposal.

The current rules are intentionally narrow:

- `base-cortex` + `cortex_market_workforce_packet`;
- `index/spike` + `index_spike_project_update`;
- `monitor` + `monitor_project_update`.

`cropto` remains reserved for a future synthetic adapter pass and is intentionally not allowed yet.

All deletion remains manual. No scheduler or retention worker is introduced by this policy.

Tenant isolation and the planned AzurMenton guest AI surface are defined separately in [Tenant & Project AI Engine Contract v1](TENANT_PROJECT_AI_ENGINE_V1.md).
