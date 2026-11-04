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

## Book description languages

A book can opt into `descriptionLocales` with exactly `en` and `fr`, each containing nonempty `summary`, `body`, `seoTitle` and `seoDescription`. Optional `tags`, `coverAlt` and `promoAlt` localize visible labels and image descriptions without changing the media. Localized Markdown uses the same link-protocol restrictions as the main body. Keep the record’s `language` as the language of the actual book. The English page remains `/books/<slug>`; its French description lives at `/fr/books/<slug>`. Both use the same record, formats, assets and purchase links, with reciprocal language navigation and sitemap/hreflang entries. No translated book edition is inferred. Base title/summary remain the English catalogue presentation; the original French book title can remain unchanged. Books without this field retain the existing renderer.

## Add a video to a book, project, series or catalogue group

Use the existing authenticated operator once:

```sh
npm run content:runtime -- add-video --route /books/no-further-claims --video https://youtu.be/qq1dv0H-jvk --request-id unique-stable-id --output /private/video-receipt.json --write --verify
```

Omit `--write` to inspect the prepared request. Optional `--label` sets the accessible player label. Group routes use their actual anchor, such as `/books#fiction`; Focus and Systems groups use the same shape. The command resolves the current exact revision itself. It preserves prose, all existing links/media, original publication dates and existing discovery anchors. A bundled card is adopted into this same versioned store with its original source retained as the first version; an unknown original discovery time remains null. Adding a first group video creates only the existing group's runtime metadata, preserving its configured description and membership.

The server accepts only a route, YouTube URL, optional label and expected revision for this operation. It cannot accept replacement prose or arbitrary assets. Private, withdrawn, future and unknown targets are rejected. Existing videos remain; the same YouTube ID is a no-op. Version conflicts fail rather than overwrite another edit. Before transmission, the exact retry command is saved beside the receipt. Retry with the same request ID and output path; it reuses that saved command even after an ambiguous response. Never create a new request ID merely because delivery timed out.

Routine additions require no Git, build, PR, deployment or catalogue source regeneration after this engine is verified in Production. The receipt confirms storage. For a requested player, use the scoped runtime video verifier to check the exact lazy youtube-nocookie iframe, accessible label and original link. Engine changes retain the full code release gates. Generic source updates and new catalogue records keep their original approval contract.
