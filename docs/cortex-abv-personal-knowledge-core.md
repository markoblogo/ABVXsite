# CortexABV Personal Knowledge Core boundary

The Personal Knowledge Core is a local, owner-controlled private store for CortexABV and the CoqPi personal conversation assistant. It is not the base/corporate Cortex, a public corpus, or a shared project-tenant database.

CoqPi may provide the owner-facing interface for selecting files, folders, and links. CortexABV maintains approved owner/project facts. Both use the same canonical private core rather than duplicate stores.

Every ingress record must be append-only, evidence-backed, classified, retention-bounded, and retrieval-scoped. New CoqPi selections remain pending and CoqPi-only by default. A personal fact, interview outcome, or source record may not reach the base Cortex, any project tenant, ABVXsite, social surface, or external action without a separate explicit promotion policy and audit receipt.

The public repository contains only the static validator contracts and synthetic fixtures in [`cortex-abv/private-runtime/`](../cortex-abv/private-runtime/). It contains no Personal Knowledge Core data, source text, interview records, contact history, credentials, retrieval index, or runtime endpoint.

The boundary between factual identity and behavioral instructions is defined in:

- [`cortex-abv/author_os/ID_INTEGRATION.md`](../cortex-abv/author_os/ID_INTEGRATION.md)

ID is factual input only (`ID_FACTUAL_CONTEXT`) and is never applied as runtime behavior.

## Cabinet pilot integration map (deferred)

Cabinet was reviewed as a reference implementation for future personal-knowledge/runtime expansion. The current pilot starts with a minimal, read-only Stage 1 and still does not wire Cabinet modules into production ABVXsite/CortexABV loops.

Practical 5-module map to keep for the next phase:

1. **Provider adapter plane**

- Source: `docs/PROVIDER-CLI.md` and provider registry/adapter modules.
- Value: unified multi-provider execution model (`claude_local`, `codex_local`, etc.), session resume, and provider verification.
- Why now: re-usable pattern for future private-agent execution, with governance checks still controlled in existing CortexABV receipt gates.

2. **Safe MCP/tool adapter surface**

- Source: `mcps/` and adapter packages.
- Value: explicit tool-permissioned integrations, with destructive actions off by default.
- Why now: useful later for social/communication side jobs, but only as allowlisted, explicit tool scopes.

3. **Cabinet-like scope manifests**

- Source: `.cabinet` root/child manifests, workspace/agent/task directories, access mode.
- Value: clean ownership boundaries for tenant-like contexts.
- Why now: good fit for isolated tenants (e.g., AzurMenton) when we add project-local AI layers.

4. **Scheduled jobs + task runner**

- Source: cron/job definitions and scheduled execution primitives.
- Value: bounded periodic checks and review artifacts without manual triggers.
- Why now: can support later import/validation/evidence refresh jobs in the private runtime.

5. **File-based provenance model**

- Source: markdown-first content and git-backed change history.
- Value: auditability, diff visibility, rollback by design.
- Why now: already aligned with our append-only contract-first approach.

Pilot activation rules:

- Stage 0: only contracts and synthetic docs for planning.
- Stage 1: one read-only connector job.
- Stage 1 executed: `Scheduled jobs and task runner` now has a synthetic read-only connector contract and receipt artifact in private-runtime.  
  - Contract: `cortex-abv/private-runtime/config/cabinet-scheduled-jobs-stage1.v1.json`  
  - Receipt: `cortex-abv/private-runtime/receipts/cabinet-stage1-scheduled-jobs-receipt.v1.json`
- Stage 2: explicit receipt + review-only outputs.
- Stage 3: action tool surface only after explicit policy gates and dual-run proof.

Detailed future map file is tracked as `docs/cortex-abv-cabinet-integration-map.md`.
