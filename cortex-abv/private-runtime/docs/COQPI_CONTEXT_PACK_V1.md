# CoqPi Context Pack v1

`CortexABVCoqPiContextPack v1` is a possible later scoped export from the shared Cortex/CoqPi Personal Knowledge Core.

It is a reviewed, compact JSON output for local call assistance. It is not an import packet, source manifest, document store, retrieval index, or instruction channel.

## Required safety boundary

- `classification` is always `private`.
- `status` is always `approved`.
- `authority` is always `read_only`.
- `sourceContentIncluded` is always `false`.
- `sourceRefs` provides source IDs and SHA-256 provenance without source paths or text.
- `retention` carries a manual-deletion TTL and expiry.
- `scope` must include `personal_call_assist`; `eligibility` only permits the local CoqPi consumer.
- `abstention` fixes `clarify_or_abstain` for unavailable or out-of-scope context.
- `compactContext` is capped at 6000 characters.
- Unknown fields are rejected, so a producer cannot silently add raw source text, credentials, local paths, instructions, or hidden reasoning.

CoqPi may later cache the validated compact pack locally after explicit file selection. It must not open any source referenced by a pack and may send only the compact context, with the active pack selected by the owner, to assistant analysis.

The synthetic fixture is for schema tests only. It is not personal data and must not be used as a real profile.
