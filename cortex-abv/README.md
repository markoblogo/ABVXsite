# CortexABV public-site adapter

<img src="./assets/cortex-abv-logo.png" alt="CortexABV logo" width="140" />

This directory is the public CortexABV boundary between CortexABV and `abvx.xyz`. Its safe default is proposal-only; narrowly declared target profiles may receive bounded, evidence-gated write authority.

It may contain source code, public project-content contracts, and reviewable proposal shapes. It must not contain private personal profiles, CV source files, contact history, inbox data, credentials, raw agent traces, or action receipts that identify correspondents. Those belong to a separately deployed private CortexABV runtime and store.

## Base Cortex and project ecosystem boundary

[`cortex-import-contract.v1.json`](cortex-import-contract.v1.json) declares the architectural direction: the base Cortex and the owner's Monitor, Index, and Cropto ecosystems may supply authorized data and updates to the private CortexABV runtime. CortexABV has no return path to them: it cannot provide data, commands, feedback, policy, workflow state, or runtime influence. Imported material stays private unless a separately validated, human-reviewable proposal targets an owner-controlled public surface.

This is documentation only. It introduces no endpoint, credential, webhook, scheduler, or runtime integration. See [Read-Only Import Contract v1](../docs/cortex-abv-read-only-import-contract.md).

## Auditable private-runtime contract snapshot

[`private-runtime/`](private-runtime/) is a static code-and-contract snapshot of the separately operated CortexABV private runtime. It exists for review of tenant isolation, admission, source-pack and shadow-evaluation contracts; it is not a deployed runtime and has no data store, secrets, real imported packets, endpoint, remote configuration, or action authority.

Its [public export boundary](private-runtime/EXPORT.md) is enforced by:

```bash
npm run cortex-abv:private-runtime:check
```

The guard rejects `data/`, ledger files, environment/key files, and token-like values before they can be committed under this subtree.

The snapshot now also documents the private, owner-controlled [Personal Knowledge Core boundary](../docs/cortex-abv-personal-knowledge-core.md): CoqPi is the personal conversational/ingress interface, while CortexABV maintains approved personal and project facts. This is one private canonical core, not base Cortex, a public corpus, or a duplicate store per assistant.

## Current public write scope

`project_copy_sync` is the only active public write-capable proposal action.

The next executor seam above that action is now documented in [`executor-wiring-boundary.v1.json`](./executor-wiring-boundary.v1.json): only an approved review artifact may cross into the wiring layer, and it maps only to PR-first merge authority. This remains non-executing design scope; no direct merge, autopublish, social, or outbound action is activated here.

It is bounded to:

- `summary`
- one appended body paragraph
- `updatedAt`
- sync provenance (`lastAppliedCommit`, `lastAppliedAt`)

It cannot change identity, title, status, tags, links, media, section placement, FAQ, social surfaces, or messages.

The content rules are now fixed in:

- [Write-side policy](../docs/cortex-abv-write-side-policy.md)
- [Write-side executor design](../docs/cortex-abv-write-side-executor-design.md)

Those two documents separate concerns cleanly:

- policy defines what copy is allowed;
- executor design defines which surfaces may receive it and under which PR boundary.

## Observed-event workflow

`Sync project descriptions` first runs a read-only observer. It fetches the current SHA for each explicit project-source allowlist, compares it with `sync.lastAppliedCommit`, and saves a `CortexABVObservedEventBatch` artifact. Only a changed SHA enables the bounded apply job; the observer has read-only repository permission and does not call a model or modify content.

The manual workflow `slug` input narrows both observation and the later copy-sync job to that one explicitly enabled target.

When a candidate update is generated, a `CortexABVAutonomousPublicSyncReceipt` artifact is rendered for the PR and the generated claim anchors. It records source SHA/path ranges and decision-trace metadata (base vs source override), while `ownerReview.status = pending_review` indicates the initial gating state. Merging the PR is the only publication action.

Run the observer locally when `SOURCE_REPOS_TOKEN` can read every enabled source repository:

```bash
SOURCE_REPOS_TOKEN=... npm run cortex-abv:observe-events -- --output /tmp/cortex-abv-observed-events.json
```

## Policy and executor boundary

`public-policy.example.json` defines the safe public default: `proposal_only`, no automatic actions, and an explicit deny list for external communication and private-data storage.

[`autonomous-public-sync.v1.json`](autonomous-public-sync.v1.json) is the narrow allowlist for site-copy candidates.

[`write-side-executor-design.v1.json`](write-side-executor-design.v1.json) defines the next executor boundary:

- `ABVXsite` project copy is active as PR-only;
- `Lab` is design-scoped only until it uses the same owner-review path;
- direct pushes and any non-PR publication remain forbidden inside this executor design.

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
