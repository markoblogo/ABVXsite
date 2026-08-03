# AUTHOR_OS Governance Directory

This directory defines long-term control for operational author instruction.

It contains:

- `[GOVERNANCE.md](./GOVERNANCE.md)` — global operating rules, responsibilities, and lifecycle.
- `[CONTRIBUTION_RULES.md](./CONTRIBUTION_RULES.md)` — template and acceptance criteria for each proposed rule.
- `[STABILITY_LEVELS.md](./STABILITY_LEVELS.md)` — CORE / STABLE / EXPERIMENTAL / DEPRECATED and transitions.
- `[CHANGE_PROPOSAL_TEMPLATE.md](./CHANGE_PROPOSAL_TEMPLATE.md)` — reusable review proposal format.
- `[DEPRECATION_POLICY.md](./DEPRECATION_POLICY.md)` — replacement/retirement behavior.
- `[EVIDENCE_POLICY.md](./EVIDENCE_POLICY.md)` — what can be used as proof.

`manifest.json` and Markdown source files remain human-readable.  
`rules.json` is the machine-readable index for discovery, validation, and runtime selection.

## Review workflow (concise)

1. Observe a recurring decision pattern or explicit owner instruction.
2. Prepare a proposal using `CHANGE_PROPOSAL_TEMPLATE.md`.
3. Attach explicit evidence.
4. Add/adjust examples + optional status markers.
5. Run `npm run test:sync` + focused AUTHOR_OS checks.
6. Approve/stamp rule set explicitly and bump `manifest.version`.
