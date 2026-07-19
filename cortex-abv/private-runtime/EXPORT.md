# Public export boundary

Source snapshot: local `CortexABV-private` commit `611d76f`.

This subtree may contain only static code, typed contracts, documentation, tests, and synthetic fixtures. It is an audit/reference copy, not a runtime deployment.

It must never contain:

- `data/` or any `.jsonl` ledger entry;
- `.env` files, credentials, private keys, or token-like values;
- real source packets, protected payloads, personal profile/contact data, guest messages, or action receipts;
- runtime remote configuration, endpoint configuration, or production secrets.

Run `npm run cortex-abv:private-runtime:check` from the ABVXsite root before committing changes under this subtree. The check is deterministic, local-only, and emits file/rule metadata without printing sensitive contents.
