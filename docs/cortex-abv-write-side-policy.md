# CortexABV write-side policy

This is the mandatory contract for the public `ABVXsite` PR-first write path.

It exists to keep the current CortexABV loop narrow even when source adapters become real and frequent. A changed source SHA may create a proposal. It may not bypass this contract.

## Current mode

- Mode: `owner_review_pr_only`
- Publication path: GitHub PR only
- Publication trigger: merge only
- Default status: `pending_review`
- Automatic publication: forbidden

## What may be proposed

Allowed patch fields:

- `summary`
- `bodyAppendix`
- `updatedAt`
- `sync.lastAppliedCommit`
- `sync.lastAppliedAt`

Allowed proposal action:

- `project_copy_sync`

Allowed proposal shape:

- `CortexABVCopyProposal`
- `summary` may be replaced
- `bodyAppendix` may add one optional single paragraph
- each changed field must have exactly one claim anchor
- claim fields may be only `summary` or `bodyAppendix`

## What is blocked

Blocked patch fields:

- `title`
- `shortTitle`
- `status`
- `visibility`
- `primarySection`
- `appearsIn`
- `group`
- `tags`
- `links`
- `media`
- `heroImage`
- `faqs`
- `relatedSlugs`
- `publishedAt`
- `sortRank`

Blocked actions:

- `site_link_refresh`
- `social_post_draft`
- `publish_external_post`
- `send_message`
- `send_email`
- `change_identity_fields`
- `store_private_profile`

Blocked review outcomes at proposal stage:

- direct `main` mutation outside the PR branch
- auto-merge
- autoposting
- message or email send
- identity/profile change

## Enforcement points

The contract is enforced in three places:

1. project content profiles constrain allowed public fields and append-only copy mode
2. proposal validation requires claim-backed, single-paragraph public copy only
3. the write-side review artifact must embed this policy and remain `pending_review` until owner action

Executor scope is defined separately in [cortex-abv-write-side-executor-design.md](./cortex-abv-write-side-executor-design.md). Policy says what copy is allowed; executor design says where it may flow and under which PR boundary.

That means a source adapter can produce either:

- a bounded review PR under this contract
- or a valid no-op / abstention with no PR

It cannot produce an implicit publish path.
