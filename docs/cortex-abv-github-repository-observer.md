# CortexABV GitHub Repository Observer v1

The GitHub Repository Observer v1 creates a compact, versioned `CortexABVRepositoryObservationSnapshot` from `cortex-abv/public-project-registry.v1.json`.

It is the first repository-facing bridge for CortexABV, but it is not a repository integration runtime.

## Input allowlist

The observer accepts only the generated Public Project Registry. Every input record must already map an explicitly published GitHub URL to a public ABVX project. The observer rejects unknown, duplicate, or missing repository observations.

It does not enumerate an account, search GitHub, infer a repository from a project name, or follow a link that is not in the registry.

## Evidence output

For each allowlisted entry, the snapshot records either:

- `observed`: default branch, current head SHA, `pushedAt`, `updatedAt`, and visibility; or
- `unavailable`: an actionable GitHub status/reason.

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

`unavailable` is a review signal, not a retry loop or a failure to be erased. A human can correct or remove an inaccessible public GitHub URL in the project source, then regenerate the registry and snapshot.

A future change-detection capability must consume this evidence as a separate proposal-only contract. It needs its own diff policy, evaluation, evidence receipt, and explicit approval path; it must not be added implicitly to this observer.
