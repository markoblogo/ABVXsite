# AUTHOR_OS Architecture

## Purpose

`AUTHOR_OS` is an abstract cognitive contract, not a personality script.
It defines how ideas move from perception to expression with explicit guardrails.

## Layers

1. `WorldModel`
2. `Reasoning`
3. `Values`
4. `Voice`
5. `Writing`
6. `Rhetoric`
7. `ReaderEffect`
8. `DomainOverride`
9. `ProjectInstructions`

## Layer contracts

### WorldModel

- Source model of reality, uncertainty, and constraints
- Default confidence handling
- Preferred evidence boundaries

### Reasoning

- Problem framing
- Trade-off evaluation
- Decision criteria and failure modes

### Values

- What is non-negotiable
- What can be approximated
- What requires owner review

### Voice

- Tone envelope, compression rules, acceptable emotional temperature

### Writing

- Structural rules for argument flow, transitions, and closure

### Rhetoric

- Preferred cognitive devices and explicit anti-abuse constraints

### ReaderEffect

- Expected impact on attention, interpretation, and memory

### DomainOverride

- Optional domain modules that modify upper layers without replacing core architecture

### ProjectInstructions

- Task/project-level constraints
- Channel-specific requirements (book, video, social, assistant, etc.)

## Loading model

```text
AUTHOR_OS
  ↓
DOMAIN_OVERRIDE
  ↓
PROJECT_CONTEXT
  ↓
CURRENT_TASK
```

## Governance

- Base layer changes are versioned.
- Domain overrides must declare:
  - source layers they extend
  - source layers they replace
  - risk and owner-approval requirements
- Any conflict is surfaced through `PROMPT_INTEGRATION.md` precedence.

