# CortexABV Public Project Registry v1

`cortex-abv/public-project-registry.v1.json` is the public, read-only bridge from the CortexABV Public Presence Index to future project integrations.

It maps only an explicitly published GitHub repository URL to its public ABVX project record:

```text
repository ↔ project ↔ ABVX landing ↔ Lab membership ↔ public channels
```

## Authority boundary

The registry has `authority: "read"` and `externalSideEffects: false`.

It does not:

- discover repositories or infer a missing repository link;
- call the GitHub API, clone a repository, or read repository contents;
- include private repositories, credentials, commits, issues, pull requests, or agent traces;
- edit ABVXsite, a project repository, a landing, or a public channel.

The only eligible repository is a `github.com` URL already present in the public `links` field of a project entity in `public-presence-index.v1.json`.

## Shape

Every entry has a stable repository identifier and the public metadata needed to trace why it exists:

```json
{
  "id": "repository:github:owner/repository",
  "repository": {
    "provider": "github",
    "fullName": "owner/repository",
    "url": "https://github.com/owner/repository"
  },
  "project": {
    "id": "project:example",
    "canonicalUrl": "https://abvx.xyz/work/example"
  },
  "landing": { "canonicalUrl": "https://abvx.xyz/work/example" },
  "lab": { "catalogued": true, "canonicalUrl": "https://abvx.xyz/systems" },
  "publicChannels": [],
  "provenance": []
}
```

`provenance` is inherited from the source project entity. `sourceIndex.sourceDigest` pins the exact Public Presence Index used for the projection; `sourceDigest` covers the registry's entries and relations.

## Generation and verification

Rebuild the source index first, then the projection:

```bash
npm run cortex-abv:public-index
npm run cortex-abv:project-registry
npm run test:sync
```

The snapshot test covers the key exclusion rule: a project without an explicit GitHub URL never enters the registry.

## Future extension

A later GitHub observer may consume an allowlisted registry entry to observe public repository state. It must remain a separate capability with its own token, event schema, evidence receipt, tests, and proposal-only promotion path. This registry itself grants no such authority.
