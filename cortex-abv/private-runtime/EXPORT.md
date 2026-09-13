# Public export boundary

Canonical compatibility source: private `CortexABV-private` commit `228e7bb7c34d4bbbb3de8af78cb53222d8b0a5cc`.

The tenant-safe vector shadow core was refreshed from that commit:

- pilot plan and synthetic benchmark;
- plan validator and synthetic retrieval runner;
- local TF-IDF fallback shim and readiness runner;
- matching tenant-isolation and safety tests;
- concise shadow-pilot documentation.

The remaining activation, wiring, dependency-install, state-transition, effect, and historical receipt files are an older ABVXsite-local research record. They are outside the canonical compatibility surface and require a separate review before any private-runtime import.

This subtree may contain only static code, typed contracts, documentation, tests, and synthetic fixtures. It is an audit/reference copy, not a runtime deployment.

It must never contain:

- `data/` or any `.jsonl` ledger entry;
- `.env` files, credentials, private keys, or token-like values;
- real source packets, protected payloads, personal profile/contact data, guest messages, or action receipts;
- runtime remote configuration, endpoint configuration, or production secrets.

Run `npm run cortex-abv:private-runtime:check` from the ABVXsite root before committing changes under this subtree. The check is deterministic, local-only, and emits file/rule metadata without printing sensitive contents.
