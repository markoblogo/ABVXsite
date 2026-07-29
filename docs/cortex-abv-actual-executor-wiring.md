# CortexABV actual executor wiring

This document defines the next design-only layer after the approved executor plan.

It still does not activate execution.

## Purpose

The current chain already has:

- pending review artifact in the proposal branch;
- owner decision artifact;
- approved executor plan for PR-first merge intent.

What was still missing is the explicit contract that answers:

- what an approved plan may be consumed by;
- what proof must exist before manual apply is even discussable;
- what remains forbidden even after plan approval.

## Current decision

The actual wiring remains `approved_plan_manual_apply_only`.

That means:

- input is only an approved `CortexABVExecutorWiringPlan`;
- output is only an eligibility receipt;
- no merge is executed here;
- no workflow mutation, source write, or direct publication happens here.

## Eligibility result

The design returns only one of two states:

- `eligible_for_manual_apply_only`
- `blocked`

`eligible_for_manual_apply_only` does not mean “apply now”.
It means only that the artifact chain is complete enough for a later manual PR-first apply pass.

## Required proof chain

For a plan to become `eligible_for_manual_apply_only`, the wiring receipt requires:

1. real source diff
2. proposal pull request
3. approved review artifact
4. approved executor plan
5. visible target proposal branch

This is why the real `index/spike` run on July 29, 2026 stopped before owner-review continuation: the workflow was healthy, but no supported public copy diff existed, so the chain ended at `no change proposed for this observed source set`.

## Forbidden behaviors

Even at this layer, all of these remain forbidden:

- auto-merge
- auto-publish
- direct push to `main`
- source repository writes
- social posting
- message sending
- email sending
- external direct execution

## Canonical files

- contract: [`cortex-abv/actual-executor-wiring.v1.json`](../cortex-abv/actual-executor-wiring.v1.json)
- validator + receipt builder: [`scripts/cortex-abv-actual-executor-wiring-lib.mjs`](../scripts/cortex-abv-actual-executor-wiring-lib.mjs)
- check script: [`scripts/check-cortex-abv-actual-executor-wiring.mjs`](../scripts/check-cortex-abv-actual-executor-wiring.mjs)

## Why this matters

This closes the ambiguity between:

- “approved plan exists”
- and
- “there is enough real proof to discuss a manual apply path”

It keeps the next step narrow:

- consume approved plan
- map to PR-first action intent
- stay manual
- no auto-merge
