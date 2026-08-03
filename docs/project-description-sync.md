# Project description sync

This is CortexABV's first bounded public-surface loop. Its safe default is proposal-only.

MN7R, Cropto, and SPIKE SPOT COMMODITY INDEX UKRAINE can still generate bounded updates, but the write path is now executed through a review-only PR executor. No update reaches `main` directly from the workflow.

## Gate and apply sequence

1. `observe-project-events` reads the SHA of each explicitly enabled source, compares it with `sync.lastAppliedCommit`, and writes a `CortexABVObservedEventBatch` artifact.
2. A changed SHA enables copy generation for that one target. The model sees only its allowlisted, public-safe paths.
3. The workflow verifies per-claim source path and line range, project themes/stop terms, length limits, append-only body mode, `npm run test:sync`, and `npm run content:validate`.
4. Only when a content diff remains does the workflow build a PR branch with the allowed fields and open a review PR for owner approval.
5. The PR payload includes a bounded `receipt.md` plus a write-side review artifact with:
   - `ownerReview.status = pending_review`,
   - explicit required `approve` / `reject` actions,
   - embedded `CortexABVWriteSidePolicy v1`,
   - `merge` is the only publication step.
6. The pending review artifact is committed into the PR branch under `cortex-abv/reviews/pending/*.write-review.v1.json`, so the owner-review path works on the exact candidate chain that produced the PR.
7. A separate manual workflow, `Owner review project-copy proposal`, may consume that artifact with explicit workflow inputs:
   - `proposal_ref`
   - `review_artifact_path`
   - `owner_review_status = approved | rejected`
   - `owner_decision`
8. Only `approved` produces an executor wiring plan; `rejected` records the decision artifact only. Neither path auto-merges or publishes directly.

The job fails closed for missing source files, credentials, invalid profile, invalid claim, provider error, test failure, validation failure, or branch-push rejection. A source SHA change with no supported public copy change makes no PR.

## AUTHOR_OS integration in proposal generation

`scripts/sync-project-descriptions.mjs` now prepends an AUTHOR_OS profile before every prompt-based proposal step:

1. Loads canonical files from `cortex-abv/author_os/` in manifest order;
2. Loads optional ID factual context (via ID evidence adapter) and one optional domain override;
3. Adds normalized project context;
4. Adds current task instructions.

Prompt order is fixed for runtime assembly:

1. ID factual context,
2. AUTHOR_OS core,
3. DOMAIN_OVERRIDE (when present),
- PROJECT_CONTEXT,
- CURRENT_TASK.

This gives AUTHOR_OS as the default identity layer, with progressively higher-priority specialization above it.

Supported AUTHOR_OS domains: `psychology`, `ai`, `philosophy`, `software`, `travel`, `general`.

`general` never loads a domain override file.

Project-level configuration (optional, proposal-only):

- `autonomousPublicSync.authorOsDomain`
- `autonomousPublicSync.authorOsProjectContext`
- `autonomousPublicSync.authorOsTaskInstructions`

Audit metadata is written into `authorOsTrace` in each proposal artifact (debug/inspection only):

- `loaded`
- `authorOsVersion`
- `authorOsName`
- `coreFilesLoaded`
- `domainOverrideLoaded`
- `domainOverride`
- `projectContextLoaded`
- `taskInstructionsLoaded`
- `finalPrecedenceOrder`

Scope note:

- This change only wires AUTHOR_OS into the proposal-generation path in this repository (`scripts/sync-project-descriptions.mjs`).
- `new-book.mjs`, `new-work.mjs`, and `new-series.mjs` are operator-facing input assistants (CLI) and do not generate LLM text today.

## Bounded authority

The direct profile permits only:

- `summary` (maximum 320 characters);
- one appended public body paragraph (maximum 450 characters);
- `updatedAt` and sync provenance.

It preserves the existing public body baseline. It cannot touch identity, title, status, section placement, tags, links, media, FAQ, positioning, social networks, messages, email, or source projects. It rejects protected/internal/endpoint/environment/demo/mock/prototype-gap language and project-specific stop terms.

The explicit write-side contract now lives in [cortex-abv-write-side-policy.md](cortex-abv-write-side-policy.md). That contract is mandatory for the review artifact path and defines:

- which fields may ever be approved;
- which proposal shape is valid;
- which action forms are blocked even if a future adapter suggests them.

The next boundary above that policy is the narrow executor design in [cortex-abv-write-side-executor-design.md](cortex-abv-write-side-executor-design.md). It fixes which target surfaces belong to the future PR-first executor and keeps `Lab` design-scoped until it matches the same owner-review path.

Above that executor design, the new ABVXsite-only wiring boundary fixes the approved-review handoff:

- input: only an approved `CortexABVWriteExecutorReviewArtifact`;
- mapping: `owner_merge_pull_request` only;
- publication: still PR merge only;
- forbidden: autopublish, direct main push, social/message/email, or any external direct execution.

For `index/spike`, this means the real candidate chain is now:

1. observed SHA / metadata change
2. bounded copy proposal
3. pending review artifact committed into the PR branch
4. explicit owner decision artifact (`approved` or `rejected`)
5. executor wiring plan only if `approved`
6. manual PR merge only

The next design-only layer above that chain is now documented in [cortex-abv-actual-executor-wiring.md](cortex-abv-actual-executor-wiring.md): it consumes only an approved plan and returns only a manual-apply eligibility receipt. It does not merge or write anything itself.

Current trace shape defaults:

- `policySource: base`
- `reason: "base public-sync profile policy is applied"`
- `basePolicy.allowedPatchFields`
- `sourceOverride: null`

For source-specific governance on a new adapter, add in project frontmatter:

```json
"autonomousPublicSync": {
  "enabled": true,
  "mode": "direct_main",
  "target": "abvxsite",
  "allowedPatchFields": [
    "summary",
    "bodyAppendix",
    "updatedAt",
    "sync.lastAppliedCommit",
    "sync.lastAppliedAt"
  ],
  "decisionTrace": {
    "policySource": "source_specific_override",
    "reason": "...",
    "sourceKind": "owned_project_ecosystem",
    "sourceId": "monitor",
    "sourceOverride": {
      "allowedPatchFields": [
        "summary",
        "bodyAppendix",
        "updatedAt",
        "sync.lastAppliedCommit",
        "sync.lastAppliedAt"
      ]
    }
  }
}
```

Receipts will include this reason and override chain as evidence of why a specific source profile was used.

`cortex-abv/autonomous-public-sync.v1.json` is the authoritative enrolment record. Its Lab target is intentionally disabled until `LAB_REPO_TOKEN` has a separately scoped **Contents: Write** permission for `markoblogo/lab.abvx`. Once present, a separate workflow job checks out only that repository, runs its read-only `sync_home_ledger.py` against the Lab allowlist, and may commit only `docs/index.html`'s marked ledger and its SHA/date provenance snapshot.

## GitHub setup

The workflow runs every Monday at 08:17 UTC and may be started from **Actions → Sync project descriptions → Run workflow**.

Required `markoblogo/ABVXsite` secrets:

- `OPENAI_API_KEY` — copy-generation provider key;
- `SOURCE_REPOS_TOKEN` — fine-grained GitHub token with read-only **Contents** access to private source repositories;
- `LAB_REPO_TOKEN` — fine-grained token scoped only to `markoblogo/lab.abvx`, with **Contents: Write**. Its presence activates the isolated Lab freshness job; `SOURCE_REPOS_TOKEN` must also be able to read each repository listed in Lab's source allowlist.

Automatic rollback is deliberately absent in this PR-first mode. If a proposal is incorrect, close/reject the PR and no merge occurs.

## Local checks

```bash
npm run test:sync
npm run content:validate
SOURCE_REPOS_TOKEN=... npm run cortex-abv:observe-events -- --output /tmp/cortex-abv-observed-events.json
OPENAI_API_KEY=... SOURCE_REPOS_TOKEN=... npm run sync:project-descriptions -- --slug mn7r --autonomous-only --dry-run
```
