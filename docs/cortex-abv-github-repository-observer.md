# CortexABV GitHub Repository Observer v1

The GitHub Repository Observer v1 creates a compact, versioned `CortexABVRepositoryObservationSnapshot` from `cortex-abv/public-project-registry.v1.json`.

It is the first repository-facing bridge for CortexABV, but it is not a repository integration runtime.

## Input allowlist

The observer accepts only the generated Public Project Registry. Every input record must already map an explicitly published GitHub URL to a public ABVX project. The observer rejects unknown, duplicate, or missing public-read repository observations.

It does not enumerate an account, search GitHub, infer a repository from a project name, or follow a link that is not in the registry.

A project may retain a canonical GitHub link while declaring the repository private:

```json
"repositoryObserver": {
  "enabled": false,
  "reason": "private_repository"
}
```

This is the only supported opt-out. The entry remains in the public registry, but the observer records it in `excluded` and never makes an anonymous GitHub request for it.

## Evidence output

For each allowlisted entry, the snapshot records either:

- `observed`: default branch, current head SHA, `pushedAt`, `updatedAt`, and visibility; or
- `unavailable`: an actionable GitHub status/reason.

The snapshot coverage separately reports registered, public-read eligible, excluded, observed, and unavailable repository counts.

It carries the registry's source digest and inherited project provenance. It intentionally excludes repository files, source text, commit messages, issues, pull requests, releases, contributors, credentials, model output, and any proposed patch.

## Authority

```json
{
  "authority": "read",
  "externalSideEffects": false
}
```

The observer makes read-only GitHub REST requests and writes its local/Actions artifact snapshot. It cannot modify ABVXsite, a source repository, a project landing, a social channel, or a Cortex runtime. Snapshot generation never triggers the existing project-copy workflow.

## Run

```bash
npm run cortex-abv:public-index
npm run cortex-abv:project-registry
npm run cortex-abv:observe-public-repositories -- --output /tmp/cortex-abv-public-repository-observation.json
```

`GITHUB_TOKEN` is optional for local rate-limit/auth handling, but no token is required to observe publicly accessible repositories. The scheduled workflow intentionally uses no repository secret and only `contents: read`; it saves an Actions artifact rather than creating a commit or pull request.

## Review and next boundary

`unavailable` is a review signal, not a retry loop or a failure to be erased. A human can correct or remove an inaccessible public GitHub URL in the project source, then regenerate the registry and snapshot. A private repository is different: retain the canonical link and use the explicit `private_repository` observer opt-out.

The separate [Repository Change Proposal v1](cortex-abv-repository-change-proposal.md) compares two observer snapshots into a proposal-only evidence receipt. It deliberately stops at `pending_review`; any later consumer needs its own evaluation, approval, and rollback contract.
