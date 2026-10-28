# Runtime catalogue publishing

The existing `/api/writing/manage` endpoint and `content:runtime` operator handle catalogue content. No second store, scheduler, admin framework or new page template is required. Deploy the engine before using these packet types. This guide does not itself authorize publishing material.

## Supported surfaces

| Packet surface | Consumer operation | Source type | Public placement |
| --- | --- | --- | --- |
| books | abvx.publish-book | Existing book catalogue types | `/books/<slug>` and Books |
| work | abvx.publish-project | Existing work catalogue types | `/work/<slug>` and Focus/Systems/Books |
| series | abvx.publish-series | series | `/books/<slug>` and official series list |
| sections | abvx.publish-section | catalogue-section | Existing Books/Systems/Focus page anchor |

Native Writing collections and Working Stories retain their existing routes and packet types. Creating a wholly new blog collection, route or renderer is an engineering change. Catalogue sections are groups within existing pages, not arbitrary code or routes.

## Accepted packet contract

Use an exact owner-accepted full source and images. Reuse the existing v1 handoff envelope: `schema_version: v1`, `mode: REPORT_ONLY_HANDOFF`, `project: abvxsite`, `surface`, `consumer_operation.id`, `item_id`, `slug`, `title`, `kind`. The payload contains `source_markdown`, its SHA-256 `source_sha256`, `date_published`, `language`, `body_lines` joined by two newlines, and `media_assets` descriptors with absolute `source`, site-relative `target` and SHA-256. Metadata in the envelope must agree with source bytes. The operator never treats an unaccepted draft as an approval.

Every catalogue source has matching safe `id`/`slug`, `title`, `summary`, nonempty Markdown body, public `visibility`, an existing valid `status`, `primarySection`, `appearsIn`, `tags`, `links`, and an actual nonfuture `publishedAt`. Images use `media`/`heroImage` with alt text and integer dimensions. Links cannot contain executable protocols. Existing renderer fields remain available; unsupported image aliases are rejected.

Books must belong to a public `primarySeriesSlug`/`seriesSlugs` or an existing standalone `group`. Projects must have a visible placement on their primary page. A section has `type: catalogue-section`, a `group` title, and, for Systems, an `ecosystem` title. Its slug is the group anchor (lowercase, `&` becomes `and`, other separators become hyphens). Publish the section or series first, then its members. Empty groups may remain hidden until they contain cards. Section summary supplies the existing template description; this is not a new article body. New series use the existing series page template.

```sh
npm run content:runtime -- publish --packet /private/accepted.json --request-id stable-id --output /private/receipt.json
# Add --write after checking the prepared packet.
```

The first command is a dry run. Reuse the same request ID after ambiguous delivery. Updates, rollback and withdrawal require the current revision. A series/group with published dependent members cannot be withdrawn. Existing file-owned slugs cannot be duplicated or silently taken over. Primary route, type and first publication date remain immutable.

## Read and recovery behavior

The live source feeds catalogue pages, homepage selections, sitemap, content-index and llms.txt. Existing normalizers and sorting rules are shared with bundled content; no duplicate content database is introduced. Language reaches SSR and client navigation. Runtime images retain the authoritative no-store media route. Private/draft legacy sources are excluded from authenticated source exports, but their identities still prevent collisions.

Production content writes are rejected in Preview even with a valid publishing credential. Storage failures fail closed. Conditional writes and source hashes protect retries, concurrent updates and approval identity. Export receipts and source snapshots privately; keep immutable history. Never disable runtime mode as a casual rollback after writes.

Book Readiness manuscript counting continues to include Writing/Working Stories according to existing rights and inclusion metadata. A published book card is a catalogue relationship, not new manuscript volume. This extension exports catalogue sources but does not pretend that the OS manuscript adapter or publication telemetry supports new catalogue operations; reconcile those records by family before importing them. It never starts a book, research project or KDP submission.

## Acceptance

`test:runtime-writing` covers catalogue lifecycle, baseline parity, placement/dependency rejection and API access boundaries. `qa:runtime-writing` creates synthetic content after a production build using an isolated local backend; it checks live pages, discovery, language and withdrawal without rebuilding. No synthetic content is sent to Production. Engineering still uses the full code validation/PR workflow; routine accepted content does not.
