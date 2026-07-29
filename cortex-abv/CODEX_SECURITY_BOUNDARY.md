# Codex Security Boundary

`codex-security` is allowed here only as a local, optional second reviewer.

Use it for:

- observer logic;
- proposal-pack shaping;
- policy and executor boundaries;
- repository observation;
- runtime adapters;
- token handling;
- retrieval/runtime-sensitive code.

Skip it for public-copy-only, docs-only, or catalog-only edits with no
execution or data-boundary effect.

It stays advisory only:

- no automatic fixes;
- no outbound comments;
- no direct publication authority;
- no replacement for the proposal, receipt, or owner-review path.

Typical local run:

```bash
npx codex-security scan .
```
