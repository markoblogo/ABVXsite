# DEPRECATION POLICY v1

A rule is deprecated when it is replaced, no longer safe, or no longer operationally useful.

## When to deprecate

- conflicting behavior with higher-priority evidence
- repeated operational mismatch
- scope becoming too broad
- source validity no longer holds

## Runtime behavior

- deprecated rules are never included in runtime `AUTHOR_OS` loading.
- deprecated rules remain in the registry with reason and replacement pointer.

## Required metadata

- rule id
- deprecation reason
- replacement rule id (if available)
- owner decision + timestamp

## Versioning

- **patch**: typo/reference only
- **minor**: rule replacement or major source surface broadening
- **major**: scope-level behavior changes in CORE rules
