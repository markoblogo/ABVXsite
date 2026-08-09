# AOS-VOICE-0001 — English voice principles draft proposal

proposal_id: AOS-VOICE-0001
status: draft
proposed_by: user-requested pass
date: 2026-08-03
version_introduced: 0.2.0
goal: formalize recurring English voice principles from prior editorial evidence with explicit evidence posture and domain scoping

## Rule 1 — Raw private-notebook posture (non-public-performance)

- proposed_rule_id: AO-VOICE-0001
- proposed_wording: "Prefer an honest analytical-notebook tone by default: compact observations, minimal performative framing, and pragmatic register appropriate to task. Avoid showy self-positioning unless a project explicitly requires it."
- target_file: `cortex-abv/author_os/VOICE.md`
- target_section: `Rules`
- proposed_stability: STABLE
- domain_scope: global
- domains_affected: `[general, author_os]`
- source_category: observed_pattern
- reason: captures recurring preference for practical and un-polished analytical prose and aligns with current anti-pattern avoidance around corporate/empty motivational framing.
- evidence_refs:
  - `cortex-abv/author_os/ANTI_PATTERNS.md:7-14` (disallow default motivational, corporate, safe-conclusion patterns)
  - `cortex-abv/author_os/READER_EFFECT.md:7-10` (disagree but remember / productive discomfort)
  - `content/books/mn7r-product-guide.md:102-104` (explicitly framed as living public snapshot, practical/operational style)
- approved_examples:
  - `content/books/mn7r-agro-commodity-brokerage-en-free-edition.md:118` (practical guide framing)
  - `content/work/mn7r-blog.md:70` (editorial signal centered on operations, not performance prose)
- counterexamples:
  - Marketing-style “perfectly staged” language with no practical action value.
- conflicts_with_existing_rules:
  - `AO-STAB-005` (rhetoric for clarity)
- risks_of_overapplication: may suppress intentionally crafted tonal warmth in formal user-facing channels (client comms, partner-facing materials).
- runtime_impact: no runtime behavior change until approved and promoted; proposal-only effect is documentation-bound.
- recommendation: revise
- author_decision: needs_review

## Rule 2 — Expert confidence without academic polish

- proposed_rule_id: AO-VOICE-0002
- proposed_wording: "Use confident expert stance with concise structure; prefer operational precision over academic inflation."
- target_file: `cortex-abv/author_os/ENGLISH_STYLE.md`
- target_section: `English Language Rules (placeholder)`
- proposed_stability: STABLE
- domain_scope: global
- domains_affected: `[software, psychology, books]`
- source_category: model_inference
- reason: multiple project pages already describe outputs as practical and non-academic, but style transitions are not yet proven as a reusable writing contract.
- evidence_refs:
  - `cortex-abv/author_os/ANTI_PATTERNS.md:10-12` (academic inflation, safe conclusions)
  - `cortex-abv/author_os/ANTI_PATTERNS.md:27-33` (corporate language / motivational clichés / LinkedIn tone are blocked)
  - `content/books/mn7r-agro-commodity-brokerage-en-free-edition.md:118` (practical guide, not academic textbook)
- approved_examples:
  - `content/books/mn7r-agro-commodity-brokerage-en-free-edition.md:118`
- counterexamples:
  - Over-extended theoretical prose where practical decision guidance is lost.
- conflicts_with_existing_rules:
  - `AO-STAB-002` (evidence-first domain override chain)
  - `AO-STAB-007` (English quality consistency)
- risks_of_overapplication: can flatten nuance where formal scientific precision is required.
- runtime_impact: proposal-stage only.
- recommendation: revise
- author_decision: needs_review

## Rule 3 — Controlled irony/satire, not default

- proposed_rule_id: AO-VOICE-0003
- proposed_wording: "Use irony/dry sarcasm/limited slang as a sharpening device only when directly useful to the point; reject reflexive cynicism."
- target_file: `cortex-abv/author_os/RHETORIC.md`
- target_section: `Usage policy`
- proposed_stability: EXPERIMENTAL
- domain_scope: domain-specific
- domains_affected: `[psychology, opinion, essay]`
- source_category: observed_pattern
- reason: conceptually aligned with existing `Dark humour` placeholder, but no approved cross-project evidence yet for systematic use.
- evidence_refs:
  - `cortex-abv/author_os/RHETORIC.md:7-18` (dark humour allowed with constraints)
  - `cortex-abv/author_os/RHETORIC.md:20-27` (expected effect + fallback)
- approved_examples: none (insufficient in-repo paired evidence)
- counterexamples:
  - Clinical, safety-critical, or partner-facing professional content where irony is harmful.
- conflicts_with_existing_rules:
  - `AO-STAB-005` (clarity first)
  - `AO-STAB-007` (technical readability for claims)
- risks_of_overapplication: may degrade trust in technical, legal, or partner-sensitive writing.
- runtime_impact: no runtime impact unless promoted from proposal.
- recommendation: insufficient_evidence
- author_decision: needs_review

## Rule 4 — Domain-limited conversational roughness/edge

- proposed_rule_id: AO-VOICE-0004
- proposed_wording: "Allow conversational roughness and abrupt transitions only in domains where expressive edge improves signal; keep such style out of formal operational documents."
- target_file: `cortex-abv/author_os/DOMAIN_OVERRIDES/psychology.md`
- target_section: `Rule additions`
- proposed_stability: EXPERIMENTAL
- domain_scope: domain-specific
- domains_affected: `[psychology]`
- source_category: model_inference
- reason: no completed domain-override implementation for psychology style yet; this is explicitly gated by allowlist.
- evidence_refs:
  - `cortex-abv/author_os/DOMAIN_OVERRIDES/psychology.md:3-12` (scope + governance hooks)
  - `cortex-abv/author_os/DOMAIN_OVERRIDES/psychology.md:24-27` (sensitivity/uncertainty constraints)
- approved_examples: none
- counterexamples:
  - Software/project handbooks or clinical safety text that requires calm tone.
- conflicts_with_existing_rules:
  - `AO-STAB-007` (when technical claims are at risk)
- risks_of_overapplication: if copied globally, may destabilize partner/technical voice.
- runtime_impact: proposal-only.
- recommendation: revise
- author_decision: needs_review

## Rule 5 — Single hard sentence over diluted chains

- proposed_rule_id: AO-VOICE-0005
- proposed_wording: "Prefer one high-signal sentence over three softened explanatory sentences when one sentence carries the claim with equal fidelity."
- target_file: `cortex-abv/author_os/WRITING.md`
- target_section: `Writing Principles (template)`
- proposed_stability: EXPERIMENTAL
- domain_scope: global
- domains_affected: `[general, books]`
- source_category: model_inference
- reason: currently a hypothesis from the requested pattern set; existing docs already request compression but do not formalize unit claim thresholds.
- evidence_refs:
  - `cortex-abv/author_os/WRITING.md:7-13` (clarify, retain argument spine)
  - `cortex-abv/author_os/WRITING.md:49-52` (compression placeholder)
  - `cortex-abv/author_os/VOICE.md:20-21` (rhythm/placeholder compression)
- approved_examples: none
- counterexamples:
  - Technical explanation where precision requires staged elaboration.
- conflicts_with_existing_rules:
  - `AO-STAB-007` on technical readability and ambiguity.
- risks_of_overapplication: can degrade comprehension in learning material when complexity needs scaffolding.
- runtime_impact: none until approved.
- recommendation: insufficient_evidence
- author_decision: needs_review

## Rule 6 — No redundant metaphor explanation

- proposed_rule_id: AO-VOICE-0006
- proposed_wording: "Do not explain a metaphor that already conveys the intended causal/relational observation."
- target_file: `cortex-abv/author_os/WRITING.md`
- target_section: `Metaphors`
- proposed_stability: EXPERIMENTAL
- domain_scope: global
- domains_affected: `[books, psychology]`
- source_category: observed_pattern
- reason: supported by precision values but not yet formally codified for style execution.
- evidence_refs:
  - `cortex-abv/author_os/VALUES.md:30-34` (minimize metaphor when precision is required)
  - `cortex-abv/author_os/RHETORIC.md:16-18` (clarity over over-decoration)
  - `cortex-abv/author_os/WRITING.md:29-33` (metaphor section placeholder)
- approved_examples: none
- counterexamples:
  - Audience-onboarding copy that needs explicit unpacking for readability.
- conflicts_with_existing_rules:
  - `AO-STAB-007` for technical claim clarity.
- risks_of_overapplication: under-clarifies novice-facing copy.
- runtime_impact: none until approved.
- recommendation: revise
- author_decision: needs_review

## Rule 7 — Keep hard statements hard

- proposed_rule_id: AO-VOICE-0007
- proposed_wording: "Do not replace a hard statement with softer therapeutic framing unless the domain requires support-sensitive handling."
- target_file: `cortex-abv/author_os/ANTI_PATTERNS.md`
- target_section: `Avoidance Contracts`
- proposed_stability: STABLE
- domain_scope: domain-specific
- domains_affected: `[psychology, books, essay]`
- source_category: observed_pattern
- reason: aligns with already blocked patterns (safe conclusions, therapeutic cushioning as related style risk), but explicit phrasing is not yet approved.
- evidence_refs:
  - `cortex-abv/author_os/ANTI_PATTERNS.md:6-13, 27-33`
  - `cortex-abv/author_os/VALUES.md:7-9` (explicit uncertainty, correction over consistency)
- approved_examples: none
- counterexamples:
  - Support-focused or trauma-sensitive responses requiring regulated tone.
- conflicts_with_existing_rules:
  - `AO-STAB-007` (technical readability)
  - Project-level safety constraints in technical/partner channels.
- risks_of_overapplication: may appear insensitive in mental health, support, onboarding, or compliance text.
- runtime_impact: none.
- recommendation: revise
- author_decision: needs_review

## Rule 8 — Preserve authorial voice over generic polish

- proposed_rule_id: AO-VOICE-0008
- proposed_wording: "Prioritize voice consistency and claim-specific texture over generic polished-standard English, while keeping grammar legible in technical contexts."
- target_file: `cortex-abv/author_os/VOICE.md`
- target_section: `Rules`
- proposed_stability: STABLE
- domain_scope: global
- domains_affected: `[general, software]`
- source_category: model_inference
- reason: aligns with current intent signals but lacks direct approved pairwise text evidence.
- evidence_refs:
  - `cortex-abv/author_os/VOICE.md:24-25` (controlled humour/sarcasm policy and compression intent)
  - `cortex-abv/author_os/VOICE.md:32-34` (no hardcoded signature / falsifiable style)
  - `cortex-abv/author_os/ENGLISH_STYLE.md:26-33` (natural speech + readability constraints)
- approved_examples: none
- counterexamples:
  - Formal contracts, API docs, audit notes requiring uniform style.
- conflicts_with_existing_rules:
  - `AO-STAB-007` (quality constraints)
- risks_of_overapplication: may increase tone variance in highly formal surfaces.
- runtime_impact: proposal-only.
- recommendation: insufficient_evidence
- author_decision: needs_review

## Rule 9 — Idiom/slang emotional equivalence

- proposed_rule_id: AO-VOICE-0009
- proposed_wording: "For idiom/slang, prioritize emotional effect and intent of the source expression over literal translation, with explicit ambiguity guardrails."
- target_file: `cortex-abv/author_os/ENGLISH_STYLE.md`
- target_section: `Idioms`
- proposed_stability: EXPERIMENTAL
- domain_scope: domain-specific
- domains_affected: `[psychology, books, travel]`
- source_category: model_inference
- reason: useful for creative writing and multilingual projects, but no explicit approved corpus-level evidence available in current governance baseline.
- evidence_refs:
  - `cortex-abv/author_os/ENGLISH_STYLE.md:15-18` (idiom tolerance placeholder)
  - `cortex-abv/author_os/THINKING.md:36-40` (trade-offs and non-negotiable constraints; supports ambiguity guardrail thinking)
  - `content/books/toki-pona-machine-mind.md:82-83` (language-constraint framing across systems)
- approved_examples: none
- counterexamples:
  - Compliance-safe docs where literal precision is mandatory.
- conflicts_with_existing_rules:
  - `AO-STAB-007` technical readability
  - `AO-STAB-005` truthfulness in rhetoric
- risks_of_overapplication: introduces ambiguity in legal/operational writing.
- runtime_impact: none.
- recommendation: insufficient_evidence
- author_decision: needs_review

## Rule 10 — Explicit anti-style guardrail: avoid softening/marketing patterns

- proposed_rule_id: AO-VOICE-0010
- proposed_wording: "`LinkedIn-like`, Instagram psychology, TED-style rhetoric, motivational clichés, corporate language, false certainty, and generic polished hype are disallowed by default."
- target_file: `cortex-abv/author_os/ANTI_PATTERNS.md`
- target_section: `Avoidance Contracts`
- proposed_stability: STABLE
- domain_scope: global
- domains_affected: `[general, software, travel, books]`
- source_category: explicit_author_instruction
- reason: this is already strongly represented by existing anti-pattern taxonomy; this proposal formalizes the requested wording mapping.
- evidence_refs:
  - `cortex-abv/author_os/ANTI_PATTERNS.md:5-14, 23-33`
  - `cortex-abv/author_os/READER_EFFECT.md:10-11` (productive discomfort, not hype)
- approved_examples:
  - existing anti-pattern matrix itself serves as negative behavioral evidence.
- counterexamples:
  - Project pages that explicitly mandate marketing voice and have dedicated channel override.
- conflicts_with_existing_rules: none
- risks_of_overapplication: may be too narrow for campaign-like surfaces if those are later needed.
- runtime_impact: proposal-only; once active, impacts runtime gating in anti-pattern checks.
- recommendation: approve
- author_decision: needs_review

## Rule 11 — Reader effects for memorability and productive friction

- proposed_rule_id: AO-VOICE-0011
- proposed_wording: "Aim periodically for effects matching one of: recognition shock, uncomfortable truth, or respectful disagreement that remains usable."
- target_file: `cortex-abv/author_os/READER_EFFECT.md`
- target_section: `TARGET_EFFECTS`
- proposed_stability: STABLE
- domain_scope: global
- domains_affected: `[books, psychology, general]`
- source_category: observed_pattern
- reason: direct extension of existing target effects, with concrete phrasing to operationalize output selection.
- evidence_refs:
  - `cortex-abv/author_os/READER_EFFECT.md:5-10`
  - `cortex-abv/author_os/READER_EFFECT.md:20-25` (friction/retention/recall constraints)
- approved_examples:
  - `cortex-abv/author_os/READER_EFFECT.md:5-10` (existing target effect template)
- counterexamples:
  - Soft reassurance content that requires emotional safety or low-friction tone.
- conflicts_with_existing_rules:
  - `AO-STAB-005` (reversibility when key claim clarity declines)
- risks_of_overapplication: misapplied discomfort can turn into antagonism.
- runtime_impact: none until approved and loaded.
- recommendation: approve
- author_decision: needs_review

## Rule 12 — English naturalness over translated rhythm

- proposed_rule_id: AO-VOICE-0012
- proposed_wording: "Prefer natural English construction that reads as authored natively for the target audience; avoid visibly machine-translation cadence unless a project explicitly requires it."
- target_file: `cortex-abv/author_os/ENGLISH_STYLE.md`
- target_section: `Natural speech vs grammar`
- proposed_stability: STABLE
- domain_scope: domain-specific
- domains_affected: `[books, psychology, travel, general]`
- source_category: observed_pattern
- reason: aligns with current constraints against inflated formality and with project language positioning, but this exact wording needs explicit corpus approval.
- evidence_refs:
  - `cortex-abv/author_os/ENGLISH_STYLE.md:24-33` (natural speech preference + no archaic inflation + readability)
  - `cortex-abv/author_os/VALUES.md:30-34` (precision and metaphor control)
  - `content/books/chinese-wisdom-reader-guide.md:62-64` (orientation material designed around readability)
- approved_examples:
  - `content/books/chinese-wisdom-reader-guide.md:62-64` (low-friction practical orientation)
- counterexamples:
  - Literal translations where fidelity to source phrase structure is contractually required.
- conflicts_with_existing_rules:
  - `AO-STAB-007` technical readability
- risks_of_overapplication: may unintentionally alter domain-specific localized style contracts.
- runtime_impact: proposal-only.
- recommendation: revise
- author_decision: needs_review

## Unresolved evidence gaps

- No repository-stored paired before/after author-approved writing examples currently exist for direct claim-style comparison in `examples/*`.
- No explicit per-domain style history for `psychology` or `opinion` is yet stored as approved examples.
- Several proposed rules rely on placeholders (especially `WRITING`, `ENGLISH_STYLE`) and remain hypothesis-driven.

## Proposed next action

- Stage this proposal as `needs_review`, create owner checklist, and only then decide:
  - approve rules 10 and 11,
  - revise or reject globally invasive proposals,
  - keep high-risk style constructs (irony/sarcasm, idiom transfer, compressed hard-line claims) behind domain checks.
