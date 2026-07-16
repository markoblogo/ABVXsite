# AzurMenton Source Pack v1

## Purpose and authority

The Source Pack is the first bounded corpus contract for the wholly owned `azur-menton` tenant. It is `read` authority, `snapshot_only`, public-only, and has no runtime integration or external side effects.

It is a manifest, not a copied corpus: [`config/azur-menton-source-pack.v1.json`](../config/azur-menton-source-pack.v1.json) names the repository revision and the approved guide/FAQ/place entrypoint files with SHA-256 provenance. A changed source revision or file digest requires a new reviewed pack version; this contract does not fetch, watch, or ingest it automatically.

## Corpus boundary

The manifest must cover all three types:

- `guide` — guide catalogue and guide content;
- `faq` — structured guide-intent and guide FAQ material;
- `place` — typed place catalogue and guide coverage links.

Only repository-relative files may appear. Raw source contents are deliberately not embedded in the pack, and it contains no guest data, booking state, availability, pricing, credentials, personal context, or cross-tenant material.

## Guest-chat policy skeleton

[`config/azur-menton-guest-chat-policy.v1.json`](../config/azur-menton-guest-chat-policy.v1.json) references this pack by ID but does not activate a chat. Its fixed boundaries are:

- read-only guide discovery, place context, and planning context only;
- source citation required for every factual claim;
- abstain if the source pack cannot verify a claim;
- hand off booking/availability, price/payment, emergency/safety, and unsupported requests;
- no booking mutation, payment handling, guest-data retention, external messaging, personal-context retrieval, or cross-tenant retrieval.

The policy remains `skeleton` until the independent shadow-evaluation and human-approval gates are completed. The scenario contract for the first of those gates is [AzurMenton Shadow Evaluation Pack v1](AZUR_MENTON_SHADOW_EVALUATION_V1.md).

## Validation

```bash
npm run azur-menton:check
npm run azur-menton:check -- --source-root /Volumes/Work/Work/menton
```

The validator checks the snapshot and policy schemas, tenant binding, source provenance format, guide/FAQ/place coverage, policy-to-pack reference, read-only authority, abstention, and prohibited capabilities. Passing `--source-root` is explicit and adds local SHA-256 verification of the allowlisted files. It makes no network call and emits metadata only.

## Non-goals

This does not implement RAG, source extraction, a sync worker, an LLM call, guest chat UI/API, booking or availability integration, guest identity, analytics, or any external action. The next gate after a reviewed source-pack refresh is a separate shadow evaluation pack; activation remains subject to explicit human approval.
