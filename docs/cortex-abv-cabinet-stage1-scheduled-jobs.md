# Stage 1 — Cabinet Pilot (Scheduled Jobs): read-only connector

This is the implemented Stage 1 for Cabinet pilot module #4 (`Scheduled jobs and task runner`).

## Scope

- Module: `Scheduled jobs and task runner`
- Stage: `1` (`read-only`, `receipt-only`, no scheduler/runtime integration)
- Scope boundary: no endpoint, no runtime call, no endpoint-side secrets, no file writes outside existing static artifacts.

## Contract artifacts

- Contract: `cortex-abv/private-runtime/config/cabinet-scheduled-jobs-stage1.v1.json`
- Synthetic receipt: `cortex-abv/private-runtime/receipts/cabinet-stage1-scheduled-jobs-receipt.v1.json`

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

No source-system read/write calls are made in this stage.

## Next transition rule

Before Stage 2 is opened:

1. Keep the contract read-only and proposal-only.
2. Add a real runner that can only write a proposal artifact.
3. Add the first real adapter for one owned source in the same receipt gate.
