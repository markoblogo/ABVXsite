# CortexABV private runtime rules

- Never copy `data/*.jsonl`, real packets, credentials, or protected payloads into another repository, issue, artifact, log, or chat response.
- Keep the inbound-only boundary: source systems cannot receive data, commands, feedback, policy, or runtime influence from this runtime.
- Route every operator import through the admission-policy-backed commands; do not use the low-level ledger module to bypass source, retention, or eligibility checks.
- Keep every tenant isolated: no personal or sibling-project retrieval inside a project tenant, and no tenant may gain action authority without a new explicit contract.
- Do not add network listeners, webhooks, schedulers, source clients, model calls, or public-surface actions without a new explicit contract and owner approval.
- Use synthetic fixtures for tests and examples only.

Research pilot for discovery workflows (mock-only):
- `docs/pilots/find-partners/mock-run-protocol.md`
