# CortexABV Public Presence Index v1

This artifact is the public, read-only input layer for CortexABV. It makes the current ABVX public presence legible before any private corpus, model retrieval, action tools, or social automation are introduced.

## Inputs

- public `content/work`, `content/books`, and `content/series` frontmatter;
- the explicit public person/site/lab and writing-feed configuration in `cortex-abv/public-presence-sources.v1.json`;
- available Medium and Substack RSS item metadata.

Private and draft content is excluded. RSS text is treated as untrusted data: the index retains only title, URL and publication date, not instructions or HTML bodies.

## Output contract

`CortexABVPublicPresenceIndex` v1 has `authority: "read"` and `externalSideEffects: false`. It provides:

- typed public entities (`person`, `site`, `lab`, `project`, `publication`, `series`, `writing_feed`, `writing_item`);
- public graph relations such as `contains`, `catalogues`, `aggregates`, and `publishes`;
- provenance for every entity and a stable `sourceDigest` for the complete input graph.

The artifact is not a runtime memory store, tool registry, instruction source, or permission grant. It cannot publish, send, edit, or call a model.

## Operations

```bash
npm run cortex-abv:public-index
npm run cortex-abv:public-index -- --without-feed-items
```

An unavailable RSS endpoint is represented on its feed entity and does not prevent a site/Lab/catalogue snapshot. Missing local source configuration or malformed public content fails the command.

The next layer may retrieve bounded records from this index, but promotion into a proposal or action flow must remain separately policy-gated.
