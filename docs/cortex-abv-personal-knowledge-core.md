# CortexABV Personal Knowledge Core boundary

The Personal Knowledge Core is a local, owner-controlled private store for CortexABV and the CoqPi personal conversation assistant. It is not the base/corporate Cortex, a public corpus, or a shared project-tenant database.

CoqPi may provide the owner-facing interface for selecting files, folders, and links. CortexABV maintains approved owner/project facts. Both use the same canonical private core rather than duplicate stores.

Every ingress record must be append-only, evidence-backed, classified, retention-bounded, and retrieval-scoped. New CoqPi selections remain pending and CoqPi-only by default. A personal fact, interview outcome, or source record may not reach the base Cortex, any project tenant, ABVXsite, social surface, or external action without a separate explicit promotion policy and audit receipt.

The public repository contains only the static validator contracts and synthetic fixtures in [`cortex-abv/private-runtime/`](../cortex-abv/private-runtime/). It contains no Personal Knowledge Core data, source text, interview records, contact history, credentials, retrieval index, or runtime endpoint.
