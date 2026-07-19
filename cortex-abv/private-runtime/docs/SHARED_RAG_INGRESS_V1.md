# Shared Cortex/CoqPi RAG Ingress v1

CoqPi is the owner-controlled desktop ingress UI for a future shared Cortex/CoqPi RAG. CortexABV remains authoritative after promotion; neither system gains a command path into the other.

Each new record carries an owner ID, source kind/label, provenance source ID and locator digest, pending classification, manual-deletion retention/TTL, and one retrieval scope: `coqpi_pending_classification`.

The pending record has `contentHash: null` by design. CoqPi has not read the selected source, so it must not pretend to have a content hash. A later, explicit local content-capture contract may calculate it and create an auditable classification decision.

The first capture adapter is intentionally restricted to one explicitly selected local file. It calculates SHA-256 and may create a private `content_captured` event with a bounded text excerpt for `.md`, `.txt`, `.csv`, or `.json`. Its only retrieval scope is `coqpi_interview_en_fr`, for English/French interview and self-presentation assistance. Links, folders, paths, PDFs, office documents, recursive scans, and network retrieval require their own capture contracts.

Promotion to `cortex_personal`, any project tenant, base/corporate Cortex, a public surface, or an external action is forbidden by this contract. It requires a separate explicit audit, policy decision, and append-only receipt.

Compact `CortexABVCoqPiContextPack` artifacts remain possible later scoped exports from the shared RAG. They are not required to create ingress records and are not the only input path.

## Personal Knowledge Core roles

This is one Personal Knowledge Core, not base/corporate Cortex and not a per-assistant duplicate store.

- **CoqPi** is the personal conversational consumer for English/French interviews and self-presentation. It may create append-only `CoqPiInterviewArtifact` records containing company, role, date, owner-confirmed outcomes, follow-ups, and source/provenance references. It must never write raw call audio or full transcripts to the core by default.
- **CortexABV** is the authoritative maintainer of current owner/project facts and approved public/project updates. Every fact must carry evidence/provenance and a private default classification.
- Both consumers retrieve only records whose classification and retrieval scope explicitly allow their personal-call use. A missing, expired, pending, or out-of-scope record requires `clarify_or_abstain`; neither consumer may invent owner facts.

No Personal Knowledge Core record may flow to base/corporate Cortex, a project tenant, a public site, a social account, or an external action without an explicit per-surface promotion record and an append-only audit receipt.

## Future append-only record shapes

```text
CoqPiInterviewArtifact
  company, role, date, ownerConfirmedOutcomes[], followUps[]
  sourceRefs[{sourceId, digest}], classification, retention, retrievalScopes

CortexABVPersonalFact
  fact, evidenceRefs[{sourceId, digest}], approvedAt
  classification, retention, retrievalScopes

PersonalKnowledgePromotion
  recordId, targetSurface, explicitOwnerApproval, evidenceRefs, decision
```

These are deliberately contract shapes in this slice. A later write API must validate evidence, append events only, and refuse any target surface that lacks an explicit promotion policy.
