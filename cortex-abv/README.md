# CortexABV public-site adapter

This directory is the public, proposal-only boundary between CortexABV and `abvx.xyz`.

It may contain source code, public project-content contracts, and reviewable proposal shapes. It must not contain private personal profiles, CV source files, contact history, inbox data, credentials, raw agent traces, or action receipts that identify correspondents. Those belong to a separately deployed private CortexABV runtime and store.

## First capability

`project_copy_sync` reads only the explicit `sync` allowlist already present on a work item. A proposal may update only existing copy-safe fields:

- `summary`
- Markdown body
- `updatedAt`
- sync provenance (`lastAppliedCommit`, `lastAppliedAt`)

It is reviewable and side-effect free until a human merges the generated pull request. It cannot change project identity, title, status, tags, links, media, positioning, or publish to a social network.

## Observed-event workflow

`Sync project descriptions` first runs a read-only observer. It fetches the current SHA for each explicit project-source allowlist, compares it with `sync.lastAppliedCommit`, and saves a `CortexABVObservedEventBatch` artifact. Only a changed SHA enables the separate PR job; the observer has read-only repository permission and does not call a model or modify content.

The manual workflow `slug` input narrows both observation and the later copy-sync job to that one explicitly enabled target.

When a copy PR is created, its body is a CortexABV evidence receipt rendered from that same observed artifact. It lists only repository SHA/path evidence, marks the proposal `pending_review`, and gives the reviewer explicit approve/reject checkboxes. The receipt is PR metadata, not a private-memory file committed into the public site repository.

Run the observer locally when `SOURCE_REPOS_TOKEN` can read every enabled source repository:

```bash
SOURCE_REPOS_TOKEN=... npm run cortex-abv:observe-events -- --output /tmp/cortex-abv-observed-events.json
```

## Policy

`public-policy.example.json` defines the safe public default: `proposal_only`, no automatic actions, and an explicit deny list for external communication and private-data storage. Runtime policy is validated by `npm run cortex-abv:status`.

## Next interfaces

The private runtime can later submit a validated `CortexABVProposal` to the site adapter. The adapter accepts public evidence references and a bounded patch preview; it never accepts a free-form instruction as authority. Publishing, messages, email, credentials, and private-memory retrieval stay outside this repository.
