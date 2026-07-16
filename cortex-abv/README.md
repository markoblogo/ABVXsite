# CortexABV public-site adapter

This directory is the public, proposal-only boundary between CortexABV and `abvx.xyz`.

It may contain source code, public project-content contracts, and reviewable proposal shapes. It must not contain private personal profiles, CV source files, contact history, inbox data, credentials, raw agent traces, or action receipts that identify correspondents. Those belong to a separately deployed private CortexABV runtime and store.

## Base Cortex and project ecosystem boundary

[`cortex-import-contract.v1.json`](cortex-import-contract.v1.json) declares the architectural direction: the base Cortex and the owner's Monitor, Index, and Cropto ecosystems may supply authorized data and updates to the private CortexABV runtime. CortexABV has no return path to them: it cannot provide data, commands, feedback, policy, workflow state, or runtime influence. Imported material stays private unless a separately validated, human-reviewable proposal targets an owner-controlled public surface.

This is documentation only. It introduces no endpoint, credential, webhook, scheduler, or runtime integration. See [Read-Only Import Contract v1](../docs/cortex-abv-read-only-import-contract.md).

## First capability

`project_copy_sync` reads only the explicit `sync` allowlist already present on a work item. A proposal may update only existing copy-safe fields:

- `summary`
- Markdown body
- `updatedAt`
- sync provenance (`lastAppliedCommit`, `lastAppliedAt`)

It is reviewable and side-effect free until a human merges the generated pull request. It cannot change project identity, title, status, tags, links, media, positioning, or publish to a social network.

Every enabled project has a `publicCopy` profile: explicit allowed themes, project-specific forbidden terms, and `append_only` body mode. A proposal may update a summary of at most 320 characters and may append one body paragraph of at most 450 characters; it cannot rewrite, delete, reorder, or restate the approved public body baseline. It also rejects protected/internal surfaces, endpoints, environment details, demo or seeded/mock data, persistence gaps, and other prototype-gap framing. Each changed field requires one claim-to-source line-range anchor from an explicitly allowlisted file. The receipt shows those paths and line ranges, never a copied private-source excerpt.

## Observed-event workflow

`Sync project descriptions` first runs a read-only observer. It fetches the current SHA for each explicit project-source allowlist, compares it with `sync.lastAppliedCommit`, and saves a `CortexABVObservedEventBatch` artifact. Only a changed SHA enables the separate PR job; the observer has read-only repository permission and does not call a model or modify content.

The manual workflow `slug` input narrows both observation and the later copy-sync job to that one explicitly enabled target.

When a copy PR is created, its body is a CortexABV evidence receipt rendered from that same observed artifact and the generated claim anchors. It lists repository SHA/path evidence plus a source line range for each changed public field, marks the proposal `pending_review`, and gives the reviewer explicit approve/reject checkboxes. The receipt is PR metadata, not a private-memory file committed into the public site repository.

Run the observer locally when `SOURCE_REPOS_TOKEN` can read every enabled source repository:

```bash
SOURCE_REPOS_TOKEN=... npm run cortex-abv:observe-events -- --output /tmp/cortex-abv-observed-events.json
```

## Policy

`public-policy.example.json` defines the safe public default: `proposal_only`, no automatic actions, and an explicit deny list for external communication and private-data storage. Runtime policy is validated by `npm run cortex-abv:status`.

## Public Presence Index v1

`public-presence-index.v1.json` is the first read-only corpus for CortexABV. It contains only public site metadata: the public person/site/lab records, catalogue entities, configured writing feeds, available RSS item metadata, graph relations, and per-entity provenance. It does not contain private profiles, contact records, credentials, raw repository documents, model output, or authority to make changes.

Generate it with:

```bash
npm run cortex-abv:public-index
```

The index records an unavailable feed as source status rather than failing the complete snapshot. Use `-- --without-feed-items` for a fully local, deterministic rebuild. Its source configuration lives in `public-presence-sources.v1.json` and is intentionally the only place to add new public corpus roots.

## Public Project Registry v1

`public-project-registry.v1.json` is a typed, read-only projection of the Presence Index. For each project that explicitly publishes a `github.com` link, it records the repository, ABVX project landing, Lab catalogue membership, public channels, and source provenance.

It does not discover repositories, call the GitHub API, read repository contents, infer missing links, or receive authority to update a site, repository, or social channel. A repository appears only when its public project record already declares its GitHub URL.

Rebuild it after the Presence Index:

```bash
npm run cortex-abv:public-index
npm run cortex-abv:project-registry
```

The schema and extension boundary are documented in [Public Project Registry v1](../docs/cortex-abv-public-project-registry.md).

## GitHub Repository Observer v1

`CortexABVRepositoryObservationSnapshot` is a separate, read-only evidence layer over the explicit registry allowlist. It records only public repository metadata needed for later comparison: default branch, current head SHA, pushed/updated timestamps, and visibility. It never reads files, issues, pull requests, releases, or commit messages.

Run it with an explicit output path:

```bash
npm run cortex-abv:observe-public-repositories -- --output /tmp/cortex-abv-public-repository-observation.json
```

Each scheduled/manual Actions run stores its snapshot as `cortex-abv-public-repository-observation`; the workflow uses only `contents: read` and no repository secret. An unavailable URL is preserved as `status: "unavailable"` with the GitHub status, so missing or inaccessible links remain reviewable evidence rather than a guessed result. A canonical GitHub link for an intentionally private repository can remain in the public registry while its project declares `repositoryObserver: { "enabled": false, "reason": "private_repository" }`; that entry is explicitly excluded from anonymous observation.

See [GitHub Repository Observer v1](../docs/cortex-abv-github-repository-observer.md) for the complete contract.

## Repository Change Proposal v1

The manual `Compare public repository snapshots` workflow creates a fresh candidate snapshot, compares it with the committed baseline, and saves both files plus a `CortexABVRepositoryChangeProposal` evidence receipt. Its only possible outcomes are `no_changes` and `pending_review`; neither outcome calls sync, creates a PR, edits a repository, or advances the baseline.

For a local comparison, supply all three paths explicitly:

```bash
npm run cortex-abv:compare-repository-snapshots -- \
  --baseline cortex-abv/public-repository-observation-snapshot.v1.json \
  --candidate /tmp/cortex-abv-repository-candidate.json \
  --output /tmp/cortex-abv-repository-change-proposal.json
```

The receipt is documented in [Repository Change Proposal v1](../docs/cortex-abv-repository-change-proposal.md).

## Next interfaces

The private runtime can later submit a validated `CortexABVProposal` to the site adapter. The adapter accepts public evidence references and a bounded patch preview; it never accepts a free-form instruction as authority. Publishing, messages, email, credentials, and private-memory retrieval stay outside this repository.
