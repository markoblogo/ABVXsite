# Changelog

## Template

Each entry should include:

- `Version`
- `Date`
- `Reason`
- `Changes`
- `Owner`
- `ReviewStatus`

## Entries

### v0.2.0 - 2026-08-03

- Reason: Add formal AUTHOR_OS governance and ID/behavior boundary in proposal path.
- Changes:
  - Added governance directory with canonical lifecycle, evidence, and stability policy docs.
  - Added machine-readable `rules.json` registry with runtime metadata constraints.
  - Added machine-readable ID evidence adapter and separated factual input from behavior layers.
  - Integrated AUTHOR_OS + ID factual context into public proposal assembly with explicit layered precedence.
  - Added loader/runtime validation and conflict visibility for governance rules.
  - Added regression tests for AUTHOR_OS runtime loader and prompt ordering.
- Owner: Anton Markoblogo
- ReviewStatus: draft

### v0.1.0 - placeholder-date

- Reason: Initial architecture scaffolding for AUTHOR_OS.
- Changes:
  - Added base architecture and layer placeholders.
  - Added prompt integration precedence contract.
  - Added domain override templates (empty policy scaffolds).
- Owner: Cortex ABV maintainers
- ReviewStatus: draft

## Governance

- All future entries must include explicit reason and expected impact.
- If a rule changes in any core layer, include a migration note.
