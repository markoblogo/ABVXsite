# Runtime catalogue audit — 28 October 2026

## Scope and findings

The audit followed the content intake, validation, storage, rendering, discovery and recovery boundaries. The existing runtime publisher was reused; no new service or paid dependency was introduced.

- Catalogue pages previously loaded only bundled files. Shared normalization/selectors now accept the request-local live catalogue, including books, projects, series and section configuration. A parity regression preserves the bundled catalogue when no runtime records exist.
- Catalogue placement is validated before committing. Dangling series references, invisible primary placement and withdrawal of occupied groups/series fail atomically. Existing legacy identities remain reserved.
- Preview deployments now reject content writes even if a Production credential is accidentally configured there. Private/draft legacy sources are excluded from source exports. Existing conditional snapshot writes, request IDs, accepted hashes and authoritative media remain in use.
- Live catalogue language now reaches SSR and client navigation. Native article breadcrumbs use structured data, and article publisher identity matches the site organization. New catalogue routes enter the live sitemap and public discovery index without regeneration.
- Runtime Working Stories tests were missing from the aggregate CI suite; they and catalogue regressions are now included. Stale source-of-truth and unsupported-catalogue documentation was replaced; unused imports were removed. Private snapshot history and operational receipts were preserved.

## Validation and limits

Local acceptance covers baseline catalogue parity, create/update/retry/conflict/rollback/withdrawal, relationship failures, Preview denial and private export filtering. Isolated post-build acceptance creates new articles, a story, a book, a series, a project and a Systems group without rebuilding, then withdraws them. Existing SEO checks cover 353 page titles/routes, public indexes, editorial dates, localized metadata and mobile/desktop navigation. Content validation covers 175 sources.

Production dependencies returned zero known vulnerabilities in the npm audit at this observation. This is dependency database evidence, not a claim that the whole site is vulnerability-free. The existing private-runtime snapshot retains unrelated lint warnings and is not rewritten merely for cosmetic cleanup.

The local environment used Node 26.5; CI remains pinned to Node 24. The production build passed with Next's webpack builder. Default Turbopack was blocked by local worker process permissions; that backend was not claimed as passed. No Production deployment or Google indexing outcome follows from these local checks.

## Operational boundaries

Routine accepted content uses the existing machine publisher; engine changes still require code review and deployment. New arbitrary routes, templates or blog collection definitions remain engineering changes. Scheduled Psychology publication is not migrated implicitly. Existing file-owned catalogue entries need a separately reviewed migration before runtime editing.

Book cards and published-book relationships are not manuscript volume. Catalogue exports remain available for family-aware reconciliation; do not pass them to the OS manuscript importer as Writing or claim legacy release telemetry. No KDP actions or market research are triggered.

Search Console processing and indexing are external outcomes. A valid sitemap and HTTP success do not establish them. Retain the existing monitoring journal and avoid repeated submissions while Google processing is pending. Check newly released routes after the engine release, with exact URL and observation date.
