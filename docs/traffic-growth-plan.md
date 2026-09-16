# ABVX Traffic Growth Plan

Last updated: 2026-09-16.

## Goal

Increase qualified discovery for ABVX without turning the site into a generic blog farm. The priority is to make the existing portfolio easier for humans, search engines, and LLM/answer engines to understand, cite, and route.

## Implemented autonomous layer

The site now has a focused `/work-with-me` conversion layer with six indexable, canonical service-entry pages:

- `/work-with-me/ai-gtm-consultant`
- `/work-with-me/ai-workflow-systems`
- `/work-with-me/llmo-consultant`
- `/work-with-me/kdp-publishing-automation`
- `/work-with-me/agro-commodity-market-infrastructure`
- `/work-with-me/product-marketing-complex-products`

Each page should include:

- page-specific metadata and canonical URL;
- concrete buyer problem, deliverables, proof points, related ABVX evidence, and CTA;
- visible FAQ content plus `FAQPage` JSON-LD;
- breadcrumb schema;
- inclusion in sitemap, `llms.txt`, and `content-index.json`.

## Current technical baseline

- `/sitemap.xml` lists canonical public routes.
- `/llms.txt` provides a readable public map for LLM agents.
- `/content-index.json` provides structured public inventory.
- Core About, Work, Books, LLMO, and Work-with-me pages use page-specific metadata and structured data.
- Public pages should avoid local paths, draft labels, internal editorial flags, and duplicate indexable content.

## What Codex can do autonomously

1. Add or refine canonical public pages where the site already has enough evidence.
2. Add schema, metadata, internal links, FAQ blocks, sitemap entries, and LLM index entries.
3. Create landing-page copy from existing portfolio evidence without inventing credentials.
4. Run local build, visual QA, generated-index checks, commit, push, CI checks, and public-route verification.
5. Prepare measurement reports from available analytics screenshots or exported data.

## What requires Anton

1. Connect and verify Google Search Console if it is not already active.
2. Share or publish the new pages from LinkedIn, Medium, Substack, YouTube descriptions, Behance, GitHub profiles, Amazon author pages, and book back matter.
3. Decide which offers are actually available commercially, including minimum engagement size and preferred contact channel.
4. Provide external social proof, testimonials, case permissions, logos, or anonymized client examples if they can be used publicly.
5. Choose whether to create dedicated public articles for the strongest search intents or keep the site as a portfolio/offer surface.

## Measurement loop

Weekly traffic review should track:

- total visits and unique visitors;
- entry pages;
- source/referrer mix;
- clicks or visits to `/work-with-me` and service pages;
- search queries and impressions from Search Console when available;
- pages with high bounce and no onward click.

Low traffic is expected at this stage. The first target is not viral scale; it is correct indexing, clear routing, and enough external signals for Google/LLMs to understand the portfolio.

## Guardrails

- Do not invent credentials, client results, or public traction.
- Do not publish generic SEO filler.
- Do not create indexable duplicate pages for the same intent.
- Do not rely on LLMO alone; external links and human distribution are still required.
