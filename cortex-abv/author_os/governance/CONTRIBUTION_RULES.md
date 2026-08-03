# CONTRIBUTION RULES

Every proposed rule must include:

- `rule_id`
- `proposed_wording`
- `target_file`
- `target_section`
- `proposed_stability`
- `domain_scope`
- `provenance_reason`
- `evidence_refs`
- `approved_examples`
- `counterexamples`
- `risks`
- `conflicts_with_existing_rules`
- `runtime_impact`
- `author_decision`
- `proposed_date`
- `version_introduced`

## Source categorization

- **explicit_author_instruction** — direct instruction from owner.
- **observed_pattern** — repeated explicit author behavior.
- **model_inference** — never enough by itself.
- **project_constraint** — domain/project-specific constraint.

`model_inference` alone must remain `experimental` and cannot be approved to `stable`/`core` without explicit author decision and additional evidence.

## Mandatory checks

- target file exists and section exists.
- evidence refs are stable and machine-checkable.
- conflicts are listed and reviewed.
- existing rule IDs are not silently superseded.
- rule metadata is added in `rules.json` with `runtime_enabled` explicitly set.

## Author decision quality bar

For acceptance the author decision must be explicit (`approved` or `rejected`) and reviewed before any state transition.
