# AUTHOR_OS

## What this is

`AUTHOR_OS` is the canonical cognitive operating system of the author used by Cortex ABV.
It stores **method, decision style, writing constraints, anti-pattern filters, and inheritance rules**
that should be shared across books, newsletters, media channels, and AI-facing assistants.

It is designed to be:

- long-lived across projects
- composable by domain
- stable for governance and audit
- safe to consume by both runtime and non-runtime systems

## How it should evolve

1. Keep the base system stable.
2. Add new rules only through explicit change records.
3. Introduce domain overrides for local specializations.
4. Keep project-specific files thin; inherit and override only what is necessary.
5. Preserve auditability through `CHANGELOG.md`.

## File map

- `AUTHOR_OS.md` — abstract architecture layers and loading order
- `VOICE.md` — voice envelope and tone constraints
- `WRITING.md` — structural and rhetorical writing contracts
- `THINKING.md` — reasoning model for problem solving and decisions
- `VALUES.md` — non-negotiable core values
- `ANTI_PATTERNS.md` — behaviors to avoid
- `RHETORIC.md` — preferred devices and limits
- `READER_EFFECT.md` — target reader outcomes
- `ENGLISH_STYLE.md` — language-level style constraints
- `PROMPT_INTEGRATION.md` — runtime order for AI systems
- `CHANGELOG.md` — versioned evolution log
- `DOMAIN_OVERRIDES/*` — domain extension templates
- `manifest.json` — machine-readable runtime index (`name`, `version`, `core_files`, `domain_overrides`)

## Adding a new domain override

To add a new domain override:

1. Add `cortex-abv/author_os/DOMAIN_OVERRIDES/<domain>.md`.
2. Add `<domain>` to `domain_overrides` in `manifest.json`.
3. Keep `version` bump intentional and explicit.

`general` is reserved for no override and must not have an override file.

## How AI systems should use AUTHOR_OS

- load base documents first
- merge in relevant domain override
- merge in project-specific instructions
- apply task-specific limits
- apply owner-review gates before execution

For proposal flows that include identity context, load factual ID evidence as a
separate, labeled `ID_FACTUAL_CONTEXT` layer **before** AUTHOR_OS core text.
That layer is for provenance-backed facts only (identity, projects, biography,
history), not for runtime behavior.

## How projects inherit AUTHOR_OS

Inheritance is defined as:

`ID_FACTUAL_CONTEXT` -> `AUTHOR_OS` (base) -> `DOMAIN_OVERRIDES` -> `PROJECT_CONTEXT` -> `CURRENT_TASK`.

Conflicts are resolved by the deepest layer precedence within explicit allowed override points.

Only override blocks explicitly marked as replaceable in the base.
Do not replace values without explicit justification.

Manifest changes are versioned by updating `manifest.json`. Runtime loaders must verify required keys and canonical core-file names before assembling prompts.
