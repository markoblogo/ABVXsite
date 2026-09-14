# ABVX ecosystem sync

`cortex-abv/ecosystem-graph.v1.json` is the reviewed source of truth for relationships among ABVX repositories and products. The generated registry is published at [`/ecosystem.json`](https://abvx.xyz/ecosystem.json).

The graph records current and planned relationships separately. A provider update affects a consumer only when the relation is active, the changed field is explicitly watched, and the destination surface is allowlisted.

## Automatic publication boundary

The owner has authorized automatic publication and direct writes to `main` for this bounded sync. The executor may update only:

- generated ecosystem registry and observation files;
- content fields explicitly enrolled for ecosystem metadata sync;
- README text between `ABVX:ECOSYSTEM:BEGIN` and `ABVX:ECOSYSTEM:END` markers;
- release announcements enabled for public repositories;
- approved short-link aliases used by public campaigns.

It may not edit application code, configuration outside the ecosystem files, unmarked README prose, private URLs, credentials, or unpublished project data. Every write must use an `ecosystem-sync:` commit message and trigger the target repository's normal CI.

The hourly `Sync ABVX ecosystem` workflow observes repository descriptions, homepages and latest releases. When something changes it regenerates `/ecosystem.json`, commits the reviewed surfaces to `main`, and updates managed README blocks one repository at a time.

## Local commands

```bash
npm run ecosystem:generate
npm run ecosystem:check
npm run ecosystem:impact -- --node skills --fields release,summary
npm run ecosystem:readme -- --node abvxsite --readme README.md
```

`ecosystem:impact` returns direct declared consumers. It does not infer relationships or propagate transitively.
