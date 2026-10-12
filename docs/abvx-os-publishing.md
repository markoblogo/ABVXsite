# ABVX OS publication handoff

ABVX OS prepares and records source-specific approval; this repository owns file writes, validation, rendering and deployment. Reuse the existing content packet flow, as for Azur Menton. No runtime ABVX OS dependency is added.

## Routine publication: data only

Use a clean dedicated branch at the current main SHA. Keep OS packets outside the site checkout. The standard command supports one or several already-approved Writing/Working Story packets:

```sh
npm run content:publish -- --base <full-main-SHA> --packet <absolute-path> --dry-run
npm run content:publish -- --base <full-main-SHA> --packet <absolute-path> --write
# For a pool, repeat --packet for all members in BOTH commands.
npm run prebuild
npm run content:publication-boundary -- --base <full-main-SHA>
npm run content:release-check -- --base <full-main-SHA>
```

The command plans the entire pool before writes, preserves complete approved source bytes and SEO fields, validates every media descriptor, rejects duplicate member/story IDs and conflicting shared assets, and rolls back files it created if any write fails. Existing files are never overwritten. It accepts existing Writing kinds (including Kitchen Notes recipes and video companions) and Working Stories. Legacy text-only packets remain available through the lower-level site consumers, but the OS data-only adapter blocks them before approval/handoff. Prepare and approve a new intake with complete source Markdown; do not silently upgrade an old approval.

The release boundary allows only native source files, new image assets and three generated discovery files. Documentation, application code, templates, dependencies, workflows, new collections/types/routes and unrelated catalogue edits belong to a separate engineering PR. Unsupported requirements are reported for that separate release; do not patch renderer code while publishing a post. CI enforces the same boundary and fails if regenerating Writing discovery changes committed outputs. Do not hand-edit generated indexes.

This is process and write separation within the current repository, not independent hosting: Vercel still builds and deploys the site. No CMS, extra repository, runtime OS dependency or automatic merge authority is introduced. The existing scoped release receipt and production evidence remain required. A dedicated content service can be considered later only if measurements show site builds dominate latency.

Lower-level compatibility consumers remain available:

| Packet | Command | Result |
| --- | --- | --- |
| `abvx.writing` | `content:publish-writing` | Existing single-member consumer |
| `abvx.working-story` | `content:publish-working-story` | Existing single-member consumer |
| `abvx.work` | `content:publish-project` | Separate catalogue procedure |

For Working Stories, the packet includes `payload.source_markdown` with complete, ready JSON-frontmatter Markdown and `source_sha256`. It also includes the matching title/slug, `date_published`, `language` and body in `body_lines`. The existing source validator owns all story metadata rules, including neutral internal IDs and placement headings. The source must explicitly be public and dated on/before today. Every referenced cover and illustration requires a `media_assets` entry with absolute local `source`, public `/media/...` `target` and approved byte `sha256`, including existing site files. The list may be empty only for stories without images; targets must be referenced by the story. For reuse, the source may point to the existing `public/media/...` file: its hash and image signature are checked before matching bytes are reused without overwriting. Conflicting assets, missing descriptors, source changes, duplicate IDs/slugs, symlink destinations and unsupported contracts fail before content writes. The source is saved byte-for-byte, not regenerated from enrichment.

Only pass a source-specific approved packet. `REPORT_ONLY_HANDOFF` is the transport mode, not an assertion that anything is online. Native Writing now accepts the same signed full-source contract: `source_markdown`, `source_sha256` and a descriptor for every local `media`/`heroImage`. It preserves `seoTitle`, author prose, fenced-code whitespace and approved image bytes. The source ID must equal its slug. Legacy text-only packets remain supported; media and video require the full-source path.

A selected YouTube companion article uses `videoUrl` (`https://www.youtube.com/watch?v=<11-character-id>`) and the original timezone-aware `videoUploadedAt`. Its matching `https://i.ytimg.com/vi/<id>/hqdefault.jpg` thumbnail may remain remote. The watch page embeds the video with original notes and VideoObject metadata. Writing replaces the corresponding RSS entry with this local page; other imported videos retain their existing behavior. Recent cards use compact previews, and older archive rows stay text-only. Preserve the channel cutoff and pinned exception.

For SEO, publish original useful material, add links from relevant existing pages, and regenerate discovery indexes in the same release. Keep research provenance and uncertainty explicit. Native pages use a self-canonical URL, author byline and image metadata. After production, inspect canonical URLs in Search Console and compare page-filtered impressions/clicks over 28-day periods; a request to index does not prove indexing or rankings.

After applying in a clean branch:

```sh
npm run content:release-check
```

This selects one fail-fast profile. `full` runs content/ecosystem validation, lint, sync/vector tests, build, full SEO QA and dependency audit. `publication-v1` runs content/ecosystem validation, `test:publication`, build, scoped SEO QA and dependency audit. It does not rerun lint or unrelated private Cortex tests when Git proves the code unchanged. The dependency audit overlaps the read-only lint/test phase. For a known content-only diff, SEO QA checks only the changed native publications and their hubs; otherwise it retains the full audit. Pass `-- --base <full-base-SHA>` when the automatic `origin/main` merge-base is unavailable. `prebuild` regenerates `public/llms.txt`, `public/content-index.json` and ecosystem output. Review and commit intended changes in one PR. Local results/logs are saved under ignored `exports/editorial-checks/`; the receipt records HEAD, dirty state, build mode and check outcomes. A dirty checkout receipt is not proof of a deployed commit.

If local Turbopack worker ports are blocked, use `npm run content:release-check -- --webpack`; Code-change CI still runs the normal production build; content-only CI uses the profile below. Run `npm ci` first for a new checkout or changed dependency/lockfile. For a story manuscript export use the existing `export:working-stories`, separately from website publication.

After passing CI/Preview and the authorized merge, confirm Production READY for the merge SHA and check the actual page/media/links. From a checkout matching deployed content:

```sh
npm run content:production-check
```

This selects publication-scoped SEO/discovery/mobile checks for a content-only diff, or the full audit for code/route/dependency changes. After merge, use `-- --base <merge-first-parent-SHA>`; an omitted/unknown base safely falls back to full checks. It does not establish deployment SHA or Search Console indexing. Keep those as separate evidence. See [the editorial release checklist](editorial-seo-checklist.md) and [Working Stories schema/export](working-stories.md).

## First-addition chronology

Native Writing and Working Stories register an immutable UTC `addedAt` in `content/writing-discovery.json` during the release prebuild. Include that file in the source PR. Preserve the author's `publishedAt` and YouTube `videoUploadedAt`; editing an existing record must not renew its first-addition time. Writing and the three homepage publication slots use this common registry. RSS discovery is a site-owned hourly workflow, independent of the private OS runtime; later deployments and retries retain the registered times.

For new public work, book or series entries, prebuild also runs `npm run catalogue:register`. Include `content/catalogue-discovery.json` in the source PR. Homepage catalogue slots use this immutable first-addition registry; editing an existing product or publishing a new release does not refresh its slot date. See [Site operations](site-operations.md#catalogue-addition-chronology) for migration provenance and unknown legacy dates.

## Private process learning after publication

New native intakes through ABVX OS now start a private publication session. The site's existing `content:release-check` records hashes of its logs and the exact final source tree; it remains independent of OS. From OS, `publication check --item <id> --site-root <current-site-checkout> --reuse-checks` verifies that receipt and its logs without rerunning successful checks. If no checks have run yet, omit `--reuse-checks` to invoke the same site release command once. Commit generated discovery files with the publication. A changed tree requires a fresh receipt.

Immediately after a publish command, start one OS `publication begin --run <cycle-id> --item <intake-id>` before preparation (repeat `--item` for a frozen pool). After the normal authorized release, the agent runs `publication complete-cycle --run <cycle-id> --site-root <current-site-checkout> --rework-count <actual-count> --cortex-root <private-runtime>`. This verifies the exact deployed merge SHA as part of closeout. Legacy `complete` is for legacy sessions only. It verifies production prose/canonical, retains numeric outcomes privately and automatically passes the selected batch to independent Cortex for model-free diagnosis. Owner effort remains UNKNOWN; v2 measures elapsed publication latency and does not claim labor savings. Pending transfer can be retried without republishing. No article text, media, raw logs or credentials are transferred; the site has no private-runtime dependency or new background watcher.

Use the [OS publication cycle contract](https://github.com/markoblogo/ABVX-OS/blob/main/docs/maintenance/PUBLICATION_LEARNING_CYCLE_V1.md). Books and RSS-only discoveries have distinct lifecycle boundaries; this native-publication hook does not automatically record them.

## Routine singles and pools: shortest complete path

1. Start the OS cycle once, freeze member IDs, prepare the supplied source and use the actual emitted packet path. Do not reconstruct paths or restart a timer on correction.
2. Use `content:publish` with every pool packet to dry-run and apply once; all members are validated before any write. Regenerate once with `prebuild`, verify `content:publication-boundary` against the branch base, then freeze the tree. Catalogue changes are a separate release.
3. Run `content:release-check` once on the final tree. In OS, before commit/PR, run `publication check --item <intake-id> --site-root <site-checkout> --reuse-checks` for every unique approved member, importing the same receipt and log hashes into each member’s `checks.json`. Reuse the hashed receipt for every approved member; do not run each member's build separately or rerun checks to collect telemetry. If source changes, fix all known issues together before a new full check.
4. Create one PR immediately after the final receipt and commit. Run `npm run content:release-ready -- --preview --pr <number>` to wait for CI and Vercel Preview together (5-second polling, 10-minute bound). Inspect review feedback before the authorized merge. Update the clean site checkout to the merge SHA, then run `npm run content:release-ready -- --production --pr <number>`: it waits for that exact latest Production SHA, runs QA immediately, and rechecks deployment identity. It never commits, pushes or merges. Do not run a second production QA after this succeeds.
5. Close one OS cycle. Cortex transfer is idempotent and retriable independently via `publication transfer`; an unavailable Cortex must not cause another site publication. Automatic feed watch pages reuse the site's validated registry; they are not falsely counted as owner-approved native OS publication trials.

Do not claim a timing gain from this checklist alone. Keep preparation, failed checks, successful checks, PR/CI, deployment and production verification distinct when diagnosing latency. The recipe baseline was 19m01s end-to-end; its two local release-check runs were 2m16s (failed) and 3m16s (passed). The latter is not the whole publication duration.

## Publication QA profile v1

The site computes scope from Git against a known base, including staged, unstaged and untracked files locally. The narrow allowlist is public, already-due native Writing/Working Story Markdown, newly added image assets, the three Writing discovery outputs, only. Markdown documentation is a separate engineering/docs release. Every changed material is checked, including every pool member. Unknown history, deletions, non-live/future content, slug/collection changes, existing image replacement, shared code, lockfiles or other content select full QA. A manual route list cannot override this classifier.

Publication QA checks changed pages, canonical/title/heading, available media, recipe/video structured data, mobile overflow, homepage/Writing/collection hubs, collection links and membership in sitemap/JSON/LLM indexes. Full QA additionally retains the whole-site route/title/localization/browser audit; its HTTP route checks now overlap with a concurrency limit of six. A narrow run is not a claim that every unrelated page was retested.

The full profile runs eight local gates. The publication profile runs six actual gates, including the Next build; omitted lint/sync/vector gates are never recorded as PASS. A content-only CI run keeps content/ecosystem validation, publication tests and dependency audit, then regenerates discovery instead of repeating that Next compilation. Vercel Preview and Production still build the application. Code changes and unavailable baselines keep the full CI build. Check receipts store `qaScope` and `checkProfile`; OS includes the profile in the workload hash so historical full and scoped runs cannot qualify as matching measurements. Old outcomes remain unchanged.

Close OS immediately after verified production. Cortex transfer may retry later without a new publication or altered elapsed timer. Do not wait for Search Console indexing to close a publication; indexing is a separate later result. The read-only readiness helper saves ignored phase durations for diagnosing provider waiting versus agent gaps.

## Stable native video release

The native registrar and index generator share the public-default eligibility rule (missing visibility means public; missing raw status retains the loader’s archive default). Registration preserves immutable first-addition timestamps for every released translation. `videoCompanions` lists all released slugs; `videoRedirects` chooses one primary companion by the earliest registered local first-addition time, with a slug tie-break for simultaneous additions. Editing or backdating a later translation cannot switch the permanent redirect. Explicit withdrawal of the primary permits selecting another eligible page at the next release. Runtime redirect and SEO QA use the same deployed snapshot; wall-clock passage alone does not activate a scheduled companion.
