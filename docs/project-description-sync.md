# Project description sync

This is CortexABV's first bounded autonomous public-surface loop. Its safe default is proposal-only. Only MN7R and Cropto have a separately declared `direct_main` profile; no other site content inherits this authority.

## Gate and apply sequence

1. `observe-project-events` reads the SHA of each explicitly enabled source, compares it with `sync.lastAppliedCommit`, and writes a `CortexABVObservedEventBatch` artifact.
2. A changed SHA enables copy generation for that one target. The model sees only its allowlisted, public-safe paths.
3. The workflow verifies per-claim source path and line range, project themes/stop terms, length limits, append-only body mode, `npm run test:sync`, and `npm run content:validate`.
4. Only when a content diff remains does the workflow commit the allowed fields to `ABVXsite/main`.
5. It saves `CortexABVAutonomousPublicSyncReceipt` with source SHA/paths, claim anchors, previous/applied commits, and a human-initiated `git revert` rollback reference.

The job fails closed for missing source files, credentials, invalid profile, invalid claim, provider error, test failure, validation failure, or branch-push rejection. A source SHA change with no supported public copy change makes no commit.

## Bounded authority

The direct profile permits only:

- `summary` (maximum 320 characters);
- one appended public body paragraph (maximum 450 characters);
- `updatedAt` and sync provenance.

It preserves the existing public body baseline. It cannot touch identity, title, status, section placement, tags, links, media, FAQ, positioning, social networks, messages, email, or source projects. It rejects protected/internal/endpoint/environment/demo/mock/prototype-gap language and project-specific stop terms.

`cortex-abv/autonomous-public-sync.v1.json` is the authoritative enrolment record. Its Lab target is intentionally disabled until `LAB_REPO_TOKEN` has a separately scoped **Contents: Write** permission for `markoblogo/lab.abvx`. Once present, a separate workflow job checks out only that repository, runs its read-only `sync_home_ledger.py` against the Lab allowlist, and may commit only `docs/index.html`'s marked ledger and its SHA/date provenance snapshot.

## GitHub setup

The workflow runs every Monday at 08:17 UTC and may be started from **Actions → Sync project descriptions → Run workflow**.

Required `markoblogo/ABVXsite` secrets:

- `OPENAI_API_KEY` — copy-generation provider key;
- `SOURCE_REPOS_TOKEN` — fine-grained GitHub token with read-only **Contents** access to private source repositories;
- `LAB_REPO_TOKEN` — fine-grained token scoped only to `markoblogo/lab.abvx`, with **Contents: Write**. Its presence activates the isolated Lab freshness job; `SOURCE_REPOS_TOKEN` must also be able to read each repository listed in Lab's source allowlist.

Automatic rollback is deliberately absent. If an applied update is incorrect, inspect its evidence receipt and revert the recorded applied commit.

## Local checks

```bash
npm run test:sync
npm run content:validate
SOURCE_REPOS_TOKEN=... npm run cortex-abv:observe-events -- --output /tmp/cortex-abv-observed-events.json
OPENAI_API_KEY=... SOURCE_REPOS_TOKEN=... npm run sync:project-descriptions -- --slug mn7r --autonomous-only --dry-run
```
