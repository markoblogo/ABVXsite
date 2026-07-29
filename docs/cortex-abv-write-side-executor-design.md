# CortexABV write-side executor design

This document defines the next bounded executor stage for CortexABV public surfaces. It is a design contract only. It does not activate a new executor.

## Purpose

The current public loop already has:

- read-only source observation;
- bounded copy generation;
- evidence receipt;
- owner-review PR merge for `ABVXsite` project copy.

The missing piece was a single explicit executor design that says which surfaces belong to the future narrow write layer and which do not.

## Current design decision

The executor stays `owner_review_pr_only`.

That means:

- no direct `main` push inside the executor boundary;
- no auto-merge;
- no social, email, or message side effects;
- no source-repository mutation;
- merge is the only publication action.

## Surface scope

The design includes two surfaces:

1. `abvxsite-project-copy`
   - repository: `markoblogo/ABVXsite`
   - state: `active_pr_only`
   - path scope: `content/work/*.md`
   - field scope: `summary`, `bodyAppendix`, `updatedAt`, sync provenance

2. `lab-home-ledger`
   - repository: `markoblogo/lab.abvx`
   - state: `design_only_pr_required`
   - path scope: `docs/index.html`, `docs/assets/home-ledger-snapshot.v1.json`
   - field scope: freshness ledger and its provenance snapshot only

This split is intentional. `ABVXsite` already matches the PR-first review boundary. `Lab` does not yet. So Lab is included as a target design, but not yet as an activated executor surface.

## Required artifacts

`ABVXsite` path requires:

- `CortexABVObservedEventBatch`
- `CortexABVAutonomousPublicSyncReceipt`
- `CortexABVWriteExecutorReviewArtifact`
- committed pending artifact path under `cortex-abv/reviews/pending/*.write-review.v1.json`
- optional owner-reviewed artifact under `cortex-abv/reviews/decisions/*.json`
- optional executor plan under `cortex-abv/reviews/plans/*.executor-plan.json`

`Lab` path requires:

- `CortexABVObservedEventBatch`
- `CortexABVLabHomeLedgerSnapshot`
- `CortexABVWriteExecutorReviewArtifact`

## Why this matters

Without this design, `write-side policy` defines what content is safe, but not what executor boundary is safe.

With this design:

- content scope is fixed;
- surface scope is fixed;
- publish path is fixed;
- Lab cannot silently inherit broader authority than `ABVXsite`.

## Canonical files

- design config: [`cortex-abv/write-side-executor-design.v1.json`](../cortex-abv/write-side-executor-design.v1.json)
- wiring boundary: [`cortex-abv/executor-wiring-boundary.v1.json`](../cortex-abv/executor-wiring-boundary.v1.json)
- actual wiring contract: [`cortex-abv/actual-executor-wiring.v1.json`](../cortex-abv/actual-executor-wiring.v1.json)
- validator: [`scripts/check-cortex-abv-write-side-executor-design.mjs`](../scripts/check-cortex-abv-write-side-executor-design.mjs)
- wiring boundary validator + planner: [`scripts/cortex-abv-executor-wiring-boundary-lib.mjs`](../scripts/cortex-abv-executor-wiring-boundary-lib.mjs)
- actual wiring validator + receipt builder: [`scripts/cortex-abv-actual-executor-wiring-lib.mjs`](../scripts/cortex-abv-actual-executor-wiring-lib.mjs)
- content policy: [cortex-abv-write-side-policy.md](./cortex-abv-write-side-policy.md)

## Narrow wiring boundary

The next layer above executor design is the narrow ABVXsite-only wiring boundary.

It is still non-executing and exists only to answer:

- which review artifact state may be consumed;
- which PR-first action that approval may map to;
- which behaviors remain forbidden even after approval.

Current answer:

- only `ownerReview.status = approved` may be consumed;
- only `abvxsite-project-copy` is active in this wiring layer;
- approval maps only to `owner_merge_pull_request`;
- no autopublish, auto-merge, social, messaging, email, or external direct execution is allowed.

## Owner-review workflow boundary

The next practical layer is now explicit:

1. sync workflow creates the PR and commits the pending review artifact into the PR branch;
2. `Owner review project-copy proposal` consumes that exact artifact by workflow input;
3. `rejected` writes only a decision artifact;
4. `approved` writes a decision artifact plus a non-executing executor wiring plan;
5. merge still happens separately and manually.

This keeps the artifact lineage inside the proposal branch and avoids any hidden state in GitHub Actions artifacts alone.

## Actual wiring boundary

The next layer is now also fixed as a design-only contract:

1. it consumes only an approved executor plan;
2. it returns only a manual-apply eligibility receipt;
3. it requires a full proof chain before that receipt may become eligible;
4. it still does not merge, write, publish, or execute.

See [cortex-abv-actual-executor-wiring.md](./cortex-abv-actual-executor-wiring.md).

## Local check

```bash
npm run cortex-abv:write-side-executor-design:check
```
