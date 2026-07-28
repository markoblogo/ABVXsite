# Stage 1 — Cabinet Pilot (Scheduled Jobs): read-only connector

This is the implemented Stage 1 for Cabinet pilot module #4 (`Scheduled jobs and task runner`).

## Scope

- Module: `Scheduled jobs and task runner`
- Stage: `1` (`read-only`, `receipt-only`, no scheduler/runtime integration)
- Scope boundary: no endpoint, no runtime call, no endpoint-side secrets, no file writes outside existing static artifacts.

## Contract artifacts

- Contract: `cortex-abv/private-runtime/config/cabinet-scheduled-jobs-stage1.v1.json`
- Synthetic receipt: `cortex-abv/private-runtime/receipts/cabinet-stage1-scheduled-jobs-receipt.v1.json`

## Stage 2 runner

```bash
npm run cortex-abv:cabinet-stage1-run
```

The runner reads the above contract and current:

- `cortex-abv/public-presence-index.v1.json`
- `cortex-abv/public-project-registry.v1.json`

It overwrites the receipt artifact with a real execution result (`createdAt`, `reviewStatus`, per-job `status`, and `sha256` evidence).

## Receipt gate

The receipt keeps governance parity with existing proposal gates:

- `reviewStatus`: `pending_review` or `no_changes`
- `authority`: `proposal` (no write authority at Stage 1)
- `requiredReviewActions`: explicit `approve` / `reject` decision nodes
- `decisionTrace`: rationale + policy source
- `retry`: attempt limit + next-attempt policy

### Evidence used

Stage 1 uses only static public artifacts:

- `cortex-abv/public-presence-index.v1.json`
- `cortex-abv/public-project-registry.v1.json`

No source-system read/write calls are made in this stage, except a local synthetic path through allowlisted source packets.

## Next transition rule

Before Stage 2 is opened:

1. Keep the contract read-only and proposal-only.
2. Add a first real adapter for one owned source in the same receipt gate.
3. Keep the adapter synthetic and record `source_specific_override` in `decisionTrace` (if present).

## Current Stage 2 status

Pass B current status:

- adapterId: `monitor-mn7r-shadow`
- source packet: `cortex-abv/private-runtime/examples/real-monitor-mn7r-project-update.json`
- evidence trace: stored in `sourceAdapters` entries inside `cabinet-stage1-scheduled-jobs-receipt.v1.json`
- adapterId: `index-spike-shadow`
- source packet: `cortex-abv/private-runtime/examples/real-index-spike-project-update.json`
- evidence trace: also stored in `sourceAdapters` entries as `decisionTrace`
- Pass B real-shadow receipt: `cortex-abv/private-runtime/receipts/cabinet-stage1-scheduled-jobs-passb-receipt.v1.json`
- Pass B source contract: `cortex-abv/private-runtime/config/cabinet-scheduled-jobs-stage2-passb-real-sources.v1.json`

The 2-adapter shadow execution includes:

- append-only ledger `cortex-abv/private-runtime/data/import-ledger.jsonl` with two appended entries;
- `monitor-mn7r-shadow` admitted with `source_specific_override` in `decisionTrace`;
- `index-spike-shadow` admitted with base policy decision.

The latest ledger receipt is `pending_review` because tracked public-snapshot digests changed, and all operations remained in local synthetic/read-only mode.

### New adapter trace rule

For this Stage 2 job envelope, adapter trace rule is explicit:

- for every enabled `sourceAdapters[]` entry, `result.sourceAdapters[].decisionTrace` must be present.
- policy reason and source identity are mandatory in that trace.
- this rule is an internal invariant before any future write-authority expansion.
