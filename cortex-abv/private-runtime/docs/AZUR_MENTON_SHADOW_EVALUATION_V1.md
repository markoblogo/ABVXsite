# AzurMenton Shadow Evaluation Pack v1

## Purpose

This is a bounded, static evaluation contract for the planned AzurMenton guest chat. It evaluates the expected **disposition**, not answer prose or model quality:

- `grounded_answer` only when the public Source Pack can support a cited guide/place answer;
- `abstain` for unsupported current detail or attempts to obtain personal context;
- `handoff` for booking/availability and price/payment requests.

The pack is `plan` authority, `shadow_only`, and has no runtime integration or external side effects. It is not a chat, prompt, model benchmark, traffic log, or retrieval test.

## Fixtures and privacy

[`config/azur-menton-shadow-evaluation.v1.json`](../config/azur-menton-shadow-evaluation.v1.json) contains six deliberately generic `synthetic_intent_template` scenarios. They represent real question types without recording an identity, dates, preferences, booking details, conversation history, or any other guest data.

| Disposition | Scenarios | Required behavior |
| --- | --- | --- |
| `grounded_answer` | guide discovery; place context | Cite the Source Pack; use only listed content kinds. |
| `abstain` | current opening-hours detail; personal-context request | Do not invent a live fact or disclose/cross-retrieve context. |
| `handoff` | availability; price/payment | Do not answer operationally or make a booking/payment claim. |

## Evaluation contract

- Target: future guest-chat disposition contract.
- Judge: deterministic schema and policy check.
- Decision rule: every scenario must match its expected disposition.
- Known limits: synthetic templates do not represent real traffic, and this check cannot measure language quality, citation accuracy in generated text, or retrieval recall.

The validator requires all three outcomes, citations for grounded answers, an empty source-claim set for abstain/handoff cases, and the prescribed handoff/abstention for sensitive policy topics.

## Validation

```bash
npm run azur-menton:shadow-eval:check
```

The command emits a compact scenario count by disposition. It does not call a model or source system and writes no ledger, evaluation result, or external artifact.

## Follow-up gate

Before any external guest chat is considered, a separate human-reviewed shadow run must record candidate answers against this pack and verify:

1. factual grounding and citation correctness against the versioned Source Pack;
2. correct abstention and handoff wording;
3. no personal/sibling-tenant leakage;
4. no booking, availability, price, payment, or external action.

Human approval remains required; this pack cannot promote the surface itself.
