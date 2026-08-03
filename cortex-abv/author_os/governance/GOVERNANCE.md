# AUTHOR_OS Governance v1

AUTHOR_OS is a **curated operational specification**, not a notebook.
It stores stable behavior and writing architecture for owner-facing assistants and public surfaces.

Rules are not merged by convenience.
Rules are promoted by explicit evidence, explicit review, and explicit version change.

## Responsibilities

- **Proposer**
  - write a proposal with stable intent
  - map required evidence
  - identify conflicts
  - mark scope, domain, stability target

- **Reviewer / owner**
  - validate whether evidence is real and repeatable
  - decide stability (CORE / STABLE / EXPERIMENTAL)
  - resolve conflicts before activation
  - approve deprecations and migration steps

- **Governance system**
  - validate manifest / registry / example metadata
  - keep runtime behavior deterministic and transparent
  - keep deprecated rules out of runtime loading
- **Executor / prompt systems**
  - load only runtime-enabled stable/ core rules by default
  - require explicit opt-in for experimental rules
  - include provenance trace for every rule decision

## Core principles

- One isolated output is **not** enough for permanent rule adoption.
- One changed LLM answer is **not** a rule.
- Repeated explicit patterns + approvals are required for `STABLE`.
- `CORE` changes require explicit author authorization.
- Conflicting rules cannot be silently overwritten.
- All accepted behavior changes must be reflected in `rules.json` and versioned in `manifest.json`.

## Canonical flow

1. Rule is proposed (`CHANGE_PROPOSAL_TEMPLATE.md`).
2. Evidence is attached and validated against `EVIDENCE_POLICY.md`.
3. Conflicts are checked against current registry and existing rules.
4. Owner approval sets status and proposed stability.
5. Rule registry update + changelog bump + version update.
6. Runtime loading and tests pass.

## Author authority

The author remains the final authority for:

- approving/declining proposals
- changing stability
- deprecating and replacing prior rules
- setting registry status when behavior should not run
