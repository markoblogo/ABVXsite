# STABILITY LEVELS

## Experimental

- Basis: plausible inference or isolated evidence.
- Allowed: bounded scope only (project/doman test).
- Must **not** override `CORE` or `STABLE`.
- Runtime default: **not loaded** without explicit opt-in.

## Stable

- Basis: repeated confirmation or multiple explicit author approvals.
- Scope: bounded or broad where proven.
- Runtime default: **loaded**.

## Core

- Basis: central operating constraints, repeatedly confirmed and explicitly approved.
- Scope: broad.
- Runtime default: **loaded**.
- Changes: require explicit owner approval + explicit migration note.

## Deprecated

- Basis: superseded, removed, or invalidated behavior.
- Runtime: **never loaded**.
- Must remain in registry for historical trace and migration reasoning.

## Promotion transitions

- `experimental -> stable`: requires repeated evidence and explicit owner approval.
- `stable -> core`: requires multi-context confirmation and explicit migration rationale.
- `core/stable/experimental -> deprecated`: requires replacement or explicit removal plan.
- Do not promote to a higher level by frequency alone.
