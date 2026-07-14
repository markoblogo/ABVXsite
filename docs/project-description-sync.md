# Project description sync

This workflow keeps selected ABVX work descriptions aligned with their source repositories. It never publishes directly: it creates or updates one reviewable pull request.

## What it changes

Only these fields may change:

- `summary`
- Markdown body below the frontmatter
- `updatedAt`
- `sync.lastAppliedCommit` and `sync.lastAppliedAt` provenance fields

It never changes project identity, title, status, section placement, tags, links, media, FAQs or positioning without an editor.

## Enable a project

Add an explicit `sync` block to `content/work/<slug>.md`:

```json
"sync": {
  "enabled": true,
  "repository": "owner/repository",
  "ref": "main",
  "paths": ["README.md", "docs/product.md"]
}
```

The listed files are the only source material the model receives. Keep the list short and public-safe. A GitHub link alone does not enable sync.

## GitHub setup

The workflow runs every Monday at 08:17 UTC and can be started from **Actions → Sync project descriptions → Run workflow**.

Set these repository secrets in `markoblogo/ABVXsite`:

- `OPENAI_API_KEY` — API key used only by the sync workflow.
- `SOURCE_REPOS_TOKEN` — fine-grained GitHub token with read-only **Contents** access to private source repositories. It is optional when every enabled source repository is public.

The workflow creates a PR only if the generated `summary` or body differs from the existing copy. Missing source files, invalid configuration or API errors fail the run without touching content.

## Local dry run

```bash
OPENAI_API_KEY=... SOURCE_REPOS_TOKEN=... npm run sync:project-descriptions -- --dry-run
OPENAI_API_KEY=... SOURCE_REPOS_TOKEN=... npm run sync:project-descriptions -- --slug mn7r --dry-run
```

Run `npm run test:sync` and `npm run content:validate` after changes to this workflow.
