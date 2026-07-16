# Project description sync

This workflow keeps selected ABVX work descriptions aligned with their source repositories. It never publishes directly: it creates or updates one reviewable pull request.

## CortexABV observed-event gate

The workflow has two jobs:

1. `observe-project-events` is read-only. It fetches the current SHA for every explicitly enabled source repository, compares it to `sync.lastAppliedCommit`, and saves a `CortexABVObservedEventBatch` artifact.
2. `propose-copy-updates` runs only when that batch contains at least one changed SHA. It invokes copy sync only for those changed slugs and may create or update the existing review PR.

The observer does not call a model, change content, open a PR, publish social content, or send messages. A missing source, token, or GitHub API error fails closed before the proposal job starts.

When a PR is created, its body is a CortexABV evidence receipt rendered from the same observed batch. It contains:

- source repository SHA and allowlisted paths;
- one source file and line-range anchor for each changed `summary` or body-appendix claim, without copying source text into the public PR;
- `pending_review`, `proposal`, and `externalSideEffects: false` state;
- a bounded basis for the proposal; and
- explicit approve/reject review checkboxes.

Merging the PR remains the only public site action. The receipt does not approve social posting, email, direct messages, or identity changes.

## What it changes

Only these fields may change:

- `summary`
- Markdown body below the frontmatter
- `updatedAt`
- `sync.lastAppliedCommit` and `sync.lastAppliedAt` provenance fields

It never changes project identity, title, status, section placement, tags, links, media, FAQs or positioning without an editor.

## Public-copy boundary

The generated patch is intentionally constrained to a summary of at most 320 characters and, at most, one appended body paragraph of 450 characters. The existing body is an approved public baseline: automation cannot rewrite, delete, reorder, or restate it. Corrections or larger editorial rewrites remain manual changes.

Each enabled target must provide a `publicCopy` profile with explicit `allowedThemes`, project-specific `forbiddenTerms`, and `bodyMode: "append_only"`. The model is instructed to use only those themes; the workflow rejects the global safety denials and the profile's forbidden terms.

For each changed public field, the model must provide one exact copy claim plus an allowlisted source path and numbered line range. The workflow validates the path and range against the fetched source before it writes content. The public PR receipt exposes only the path and line range, not a quote from a private source repository.

If model output violates this public-copy profile, the workflow records a clean abstention and creates no patch or PR update. Repository access, configuration, or provider failures still fail closed as workflow errors.

## Enable a project

Add an explicit `sync` block to `content/work/<slug>.md`:

```json
"sync": {
  "enabled": true,
  "repository": "owner/repository",
  "ref": "main",
  "paths": ["README.md", "docs/product.md"]
},
"publicCopy": {
  "bodyMode": "append_only",
  "allowedThemes": ["one approved public theme"],
  "forbiddenTerms": ["a project-specific prohibited phrase"]
}
```

The listed files are the only source material the model receives. Keep the list short and public-safe. A GitHub link alone does not enable sync.

## GitHub setup

The workflow runs every Monday at 08:17 UTC and can be started from **Actions → Sync project descriptions → Run workflow**.

Set these repository secrets in `markoblogo/ABVXsite`:

- `OPENAI_API_KEY` — API key used only by the sync workflow.
- `SOURCE_REPOS_TOKEN` — fine-grained GitHub token with read-only **Contents** access to private source repositories. It is optional when every enabled source repository is public.

The workflow creates a PR only if the generated `summary` or appended body paragraph differs from the existing copy. The observed-event artifact may exist even when source changes do not justify a content diff, in which case no PR is created. Missing source files, invalid configuration or API errors fail the run without touching content.

## Local dry run

```bash
OPENAI_API_KEY=... SOURCE_REPOS_TOKEN=... npm run sync:project-descriptions -- --dry-run
OPENAI_API_KEY=... SOURCE_REPOS_TOKEN=... npm run sync:project-descriptions -- --slug mn7r --dry-run
SOURCE_REPOS_TOKEN=... npm run cortex-abv:observe-events -- --output /tmp/cortex-abv-observed-events.json
```

Run `npm run test:sync` and `npm run content:validate` after changes to this workflow.
