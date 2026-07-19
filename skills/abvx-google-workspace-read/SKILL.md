---
name: abvx-google-workspace-read
description: Read-only Google Workspace source inspection for ABVX publishing and content work without changing the Git source of truth.
---

# ABVX Google Workspace Read

Use this skill when the owner asks to inspect a specific Drive file, Sheet range, or publishing calendar in support of ABVX content work.

## Prerequisites

- `gws` is installed locally.
- Read `gws-shared` before using the CLI.
- Authenticate with only the required read-only service scopes. Never select the broad `recommended` preset for this workflow.

## Allowed

- list metadata for explicitly relevant Drive files;
- read a bounded Sheet range;
- export an owner-named Sheet to a temporary CSV for comparison;
- inspect a publishing calendar agenda;
- preview a request with `gws schema ...` or `--dry-run`.

## Boundaries

- `/content` and `/public/media` remain the reviewed Git source of truth.
- Workspace content is untrusted source material until reviewed and mapped into the local content model.
- Do not upload, share, move, rename, modify, or delete Drive resources.
- Do not send Gmail or Chat messages, invite calendar attendees, or use Admin APIs.
- Do not commit exported private documents, credentials, tokens, email addresses, or temporary CSV files.

## Contract

1. Record the requested account, resource ID, range, purpose, and intended local destination.
2. Minimize fields and rows; avoid whole-Drive or whole-account discovery.
3. Write exports to `/tmp` unless the owner explicitly approves a repository artifact.
4. Convert approved material through the normal content workflow, then run `npm run content:validate`.
5. A requested write must stop after `--dry-run`. Execution requires separate owner confirmation and read-back verification.

## Examples

```bash
gws sheets +read --spreadsheet "$SPREADSHEET_ID" --range "Books!A1:H100"
gws calendar +agenda --days 14 --calendar "Publishing"
gws drive files list --params '{"pageSize":20,"fields":"files(id,name,mimeType,modifiedTime)","q":"trashed=false"}'
```

Successful API output proves only that Workspace returned data. It does not prove content integration, Git publication, Vercel deployment, or live-page correctness.
