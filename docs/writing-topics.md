# Writing navigation topics

The ABVX source filter on `/writing` has a second, URL-backed navigation row:
All topics, Psychology, Kitchen Notes, AI & Technology, Business & Work, Other.
Other contains articles outside the four main subjects. All topics includes every
public ABVX feed item, even if its navigation metadata is absent.

## Metadata and publishing

`src/content/writing-topics.mjs` defines ordered labels, slugs and legacy metadata
aliases. Native articles and Working Stories project these into the existing
Writing feed on the server. There is no second article store or slug allowlist.

Existing records reuse collection/type and tags/topics. Legacy book-release notes
with `books` or `new-book` tags belong to Other. Inference never examines titles,
changes source text, records a publication or modifies a first-added timestamp.

For a new or reviewed article, optionally set JSON frontmatter explicitly:

```json
"navigationTopics": ["ai-technology", "business-work"]
```

Supported values are `psychology`, `kitchen-notes`, `ai-technology`,
`business-work`, `other`. An omitted field uses legacy inference; an empty array
means Other. Explicit assignments replace inference. Duplicate or unsupported
values fail the existing publication metadata checks, including runtime intake.
The native and Working Story loaders preserve this optional field. No Writing
page edits are needed when adding articles. To extend taxonomy, update its
metadata definitions and tests; no new public categories are implicit.

This field is exclusively for visitor navigation. Keep original `tags`, `topics`,
`collection`, `book` and fragment records intact. Book Readiness continues to use
its existing source/collection/fragment projection. This feature never refreshes
readiness, changes its thresholds or imports publication receipts.

## State and rendering

Only `source=abvx` enables `topic`. Invalid topics fall back to All topics.
Topic links retain `q`; the search form and Clear search retain the topic.
Source links discard topic. Standard Next links and GET search provide direct
links, refresh and browser history without a second client state store.

Source and topic intersect before search and before `writingWindow`, preserving
feed order, featured selection and complete Load More results. The Load More
instance is keyed by source/topic; query results use the existing full results
view. All Writing variants retain `/writing` as canonical; search remains noindex.

## Subscriptions and verification

Each selected topic exposes its own RSS link, and the combined feed includes every public native article once. Multiple topic assignments place the same canonical article in each matching topic feed. Full text, structured recipes, covers and inline illustrations are included; see the [feed directory](site-operations.md#public-rss-subscriptions).

Topic counts change with publications and withdrawals. Use current live sources and the public index for an inventory; do not treat a dated audit count as a fixed application total. Keep detailed per-record classification evidence in private exports.

Run `node --test test/writing-topics.test.mjs` for URL, source isolation,
multi-topic/Other, validation, order, full-collection windowing and search checks.
