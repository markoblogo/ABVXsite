# ID ↔ AUTHOR_OS Integration Boundary

This document defines how `markoblogo/ID` data is used by AUTHOR_OS proposal flows.

## Separation principle

- **ID repository (`ID`)** = facts: biography, projects, role history, preferences, evidence anchors.
- **AUTHOR_OS** = operational behavior layer: writing, cognitive style, anti-pattern guardrails, domain reasoning strategy.

ID evidence supports governance proposals; it does **not** directly become runtime instructions.

## Required runtime order

`ID_FACTUAL_CONTEXT -> AUTHOR_OS -> DOMAIN_OVERRIDE -> PROJECT_CONTEXT -> CURRENT_TASK`

In this order:

1. `ID_FACTUAL_CONTEXT` must stay labeled and separate.
2. `AUTHOR_OS` must remain the only behavioral base contract.
3. `DOMAIN_OVERRIDE` may specialize behavior for declared domains.
4. `PROJECT_CONTEXT` stays project-specific.
5. `CURRENT_TASK` stays ephemeral.

## Runtime behavior

- By default load `CORE` + `STABLE` rules from rules registry.
- `EXPERIMENTAL` rules load only with explicit opt-in.
- `DEPRECATED` rules are excluded.
- Rule IDs and exclusions are included in trace for audit.

## ID evidence adapter contract

- Input is explicit evidence records from ID-oriented metadata (or `facts` arrays).
- Output is:
  - `evidenceRefs` with repository/item/sha-like provenance references,
  - redacted source references for prompt assembly,
  - summary text under `ID_FACTUAL_CONTEXT`.

The adapter must never create, modify, or approve AUTHOR_OS rules.

## Governance workflow impact

- proposals may attach `evidenceRefs` to support rule changes;
- model inferences without explicit evidence remain `experimental`-or lower and cannot be promoted directly to `stable/core`.
- all promotions still require explicit author review.

