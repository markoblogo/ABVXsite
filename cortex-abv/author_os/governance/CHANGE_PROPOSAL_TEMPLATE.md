# CHANGE PROPOSAL TEMPLATE v1

Use this template for every proposed AUTHOR_OS behavioral rule.

- proposal_id
- status: draft | approved | rejected
- proposed_rule_id (if this continues an existing rule)
- proposed_wording (or amend)
- target_file
- target_section
- proposed_stability (CORE | STABLE | EXPERIMENTAL)
- domain_scope
- source_category: explicit_author_instruction | observed_pattern | model_inference | project_constraint
- reason
- evidence_refs
- approved_examples
- counterexamples
- conflicts_with_existing_rules
- risks
- runtime_impact
- author_decision (approved | rejected | needs_review)
- date
- version_introduced

## Approval checklist

- [ ] target section exists and is readable
- [ ] evidence references are stable and machine-checkable
- [ ] `source_category` and `evidence_refs` are explicit
- [ ] at least one approved example or explicit author instruction exists for STABLE/CORE
- [ ] conflicts are documented and unresolved conflicts are not allowed
- [ ] rollback / deprecation path is described if applicable
- [ ] proposal owner decision is explicit

## Outcome record

- accepted_as: 
  - `proposed`
  - `amended`
  - `rejected`

- impact_notes:
  - summary:
  - changelog_entry:
  - manifest_changes:
