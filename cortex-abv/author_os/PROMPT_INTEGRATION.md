# PROMPT_INTEGRATION.md

## Loading order for AI systems

Use deterministic precedence:

1. `ID_FACTUAL_CONTEXT`
2. `AUTHOR_OS`
3. `DOMAIN_OVERRIDE`
4. `PROJECT_CONTEXT`
5. `CURRENT_TASK`

## Why this order exists

`ID_FACTUAL_CONTEXT` supplies factual identity/history context from ID.
`AUTHOR_OS` sets the stable cognitive contract and invariants.
`DOMAIN_OVERRIDE` adds local specialization.
`PROJECT_CONTEXT` binds to concrete channel constraints.
`CURRENT_TASK` applies runtime/task-specific limits.

Only the lowest layer may inject ephemeral constraints that do not change base commitments.

## Runtime integration contract

AI systems should:

1. Load `ID_FACTUAL_CONTEXT` from ID evidence adapter output and keep it separated.
2. Load canonical files from `AUTHOR_OS`.
3. Validate `override` declarations before merge.
4. Detect and fail closed on unknown replacement blocks.
5. Emit final effective profile in decision artifact.
6. Require owner review where policy severity indicates.

## Conflict policy

- Extend: merges additive sections from upper layer.
- Replace: allowed only for explicitly whitelisted blocks.
- Reject: if both layers assert contradictory hard constraints without override marker.

## Audit hooks

- `trace.author_os.base_version`
- `trace.author_os.domain_overrides`
- `trace.author_os.project_context`
- `trace.author_os.task_context`
- `trace.author_os.resolution_decisions`

Runtime loader emits `trace.author_os` for proposal tasks via `authorOsTrace` in proposal artifacts. It includes:

- `authorOsVersion`
- `authorOsName`
- `coreFilesLoaded`
- `domainOverrideLoaded`
- `domainOverride`
- `projectContextLoaded`
- `taskInstructionsLoaded`
- `finalPrecedenceOrder`
