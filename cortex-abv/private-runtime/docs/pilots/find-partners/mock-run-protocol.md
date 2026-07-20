# CortexABV private-runtime: find-partners (research-only mock protocol)

Optional local protocol for research-only partner/investor/employer discovery pilots.

## Hard constraints

- `run_mode: mock-only`
- No auto-send / no outbound action.
- No provider credentials required in pilot run.

## Use the same packet structure as CoqPi `find-partners` mock protocol

- Include: `run_id`, `query`, `target_count`, `min_confidence`.
- Output local JSON with: candidates + governance + validation.

## Acceptance checks

- Schema valid.
- Every candidate has: name, category, source URL, score 0..1, rationale, risk.
- `status` set to `succeeded` only when target count achieved.
- `approved_for_research` remains true.
- Owner review required before any production outreach.
