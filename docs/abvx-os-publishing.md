# ABVX OS publication handoff

ABVX OS prepares and records source-specific approval; this repository owns file writes, validation, rendering and deployment. Reuse the existing content packet flow, as for Azur Menton. No runtime ABVX OS dependency is added.

| Packet | Command | Result |
| --- | --- | --- |
| `abvx.writing` | `npm run content:publish-writing -- --packet <absolute-path> --dry-run` | Native Writing plan; use `--write` after review |
| `abvx.working-story` | `npm run content:publish-working-story -- --packet <absolute-path> --dry-run` | Validated story/media plan; use `--write` after review |
| `abvx.work` | Existing `content:publish-project` | Existing work-record procedure |

For Working Stories, the packet includes `payload.source_markdown` with complete, ready JSON-frontmatter Markdown and `source_sha256`. It also includes the matching title/slug, `date_published`, `language` and body in `body_lines`. The existing source validator owns all story metadata rules, including neutral internal IDs and placement headings. The source must explicitly be public and dated on/before today. Every referenced cover and illustration requires a `media_assets` entry with absolute local `source`, public `/media/...` `target` and approved byte `sha256`, including existing site files. The list may be empty only for stories without images; targets must be referenced by the story. For reuse, the source may point to the existing `public/media/...` file: its hash and image signature are checked before matching bytes are reused without overwriting. Conflicting assets, missing descriptors, source changes, duplicate IDs/slugs, symlink destinations and unsupported contracts fail before content writes. The source is saved byte-for-byte, not regenerated from enrichment.

Only pass a source-specific approved packet. `REPORT_ONLY_HANDOFF` is the transport mode, not an assertion that anything is online. Native Writing now accepts the same signed full-source contract: `source_markdown`, `source_sha256` and a descriptor for every local `media`/`heroImage`. It preserves `seoTitle`, author prose, fenced-code whitespace and approved image bytes. The source ID must equal its slug. Legacy text-only packets remain supported; media and video require the full-source path.

A selected YouTube companion article uses `videoUrl` (`https://www.youtube.com/watch?v=<11-character-id>`) and the original timezone-aware `videoUploadedAt`. Its matching `https://i.ytimg.com/vi/<id>/hqdefault.jpg` thumbnail may remain remote. The watch page embeds the video with original notes and VideoObject metadata. Writing replaces the corresponding RSS entry with this local page; other imported videos retain their existing behavior. Recent cards use compact previews, and older archive rows stay text-only. Preserve the channel cutoff and pinned exception.

For SEO, publish original useful material, add links from relevant existing pages, and regenerate discovery indexes in the same release. Keep research provenance and uncertainty explicit. Native pages use a self-canonical URL, author byline and image metadata. After production, inspect canonical URLs in Search Console and compare page-filtered impressions/clicks over 28-day periods; a request to index does not prove indexing or rankings.

After applying in a clean branch:

```sh
npm run content:release-check
```

This runs the existing content/ecosystem checks, lint, sync/vector tests, build, SEO checks and dependency audit once, stopping at the first failure. `prebuild` regenerates `public/llms.txt`, `public/content-index.json` and ecosystem output. Review and commit intended changes in one PR. Local results/logs are saved under ignored `exports/editorial-checks/`; the receipt records HEAD, dirty state, build mode and check outcomes. A dirty checkout receipt is not proof of a deployed commit.

If local Turbopack worker ports are blocked, use `npm run content:release-check -- --webpack`; CI still runs the normal production build. Run `npm ci` first for a new checkout or changed dependency/lockfile. For a story manuscript export use the existing `export:working-stories`, separately from website publication.

After passing CI/Preview and the authorized merge, confirm Production READY for the merge SHA and check the actual page/media/links. From a checkout matching deployed content:

```sh
npm run content:production-check
```

This reuses existing SEO/discovery/mobile checks against the public domain; it does not establish deployment SHA or Search Console indexing. Keep those as separate evidence. See [the editorial release checklist](editorial-seo-checklist.md) and [Working Stories schema/export](working-stories.md).

## First-addition chronology

Native Writing and Working Stories register an immutable UTC `addedAt` in `content/writing-discovery.json` during the release prebuild. Include that file in the source PR. Preserve the author's `publishedAt` and YouTube `videoUploadedAt`; editing an existing record must not renew its first-addition time. Writing and the three homepage publication slots use this common registry. RSS discovery is a site-owned hourly workflow, independent of the private OS runtime; later deployments and retries retain the registered times.

For new public work, book or series entries, prebuild also runs `npm run catalogue:register`. Include `content/catalogue-discovery.json` in the source PR. Homepage catalogue slots use this immutable first-addition registry; editing an existing product or publishing a new release does not refresh its slot date. See [Site operations](site-operations.md#catalogue-addition-chronology) for migration provenance and unknown legacy dates.

## Private process learning after publication

New native intakes through ABVX OS now start a private publication session. The site's existing `content:release-check` records hashes of its logs and the exact final source tree; it remains independent of OS. From OS, `publication check --item <id> --site-root <current-site-checkout> --reuse-checks` verifies that receipt and its logs without rerunning successful checks. If no checks have run yet, omit `--reuse-checks` to invoke the same site release command once. Commit generated discovery files with the publication. A changed tree requires a fresh receipt.

After the normal authorized release and separate deployed-SHA verification, the agent runs OS `publication complete --item <id> --site-root <current-site-checkout> --owner-minutes <measured-or-UNKNOWN> --rework-count <actual-count> --cortex-root <private-runtime>`. It verifies production prose/canonical, retains numeric outcomes privately and automatically passes the selected batch to independent Cortex for model-free diagnosis. Owner effort UNKNOWN blocks measured-efficiency claims. Pending transfer can be retried without republishing. No article text, media, raw logs or credentials are transferred; the site has no private-runtime dependency or new background watcher.

Use the [OS publication cycle contract](https://github.com/markoblogo/ABVX-OS/blob/main/docs/maintenance/PUBLICATION_LEARNING_CYCLE_V1.md). Books and RSS-only discoveries have distinct lifecycle boundaries; this native-publication hook does not automatically record them.
