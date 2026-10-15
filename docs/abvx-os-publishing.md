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

## Data-only project and book cards

The same `content:publish` dry-run/write command accepts a separate pool of `work` / `books` full-source packets. Use `abvx.publish-project` / `abvx.publish-book` as the consumer operation, with the existing `schema_version: v1`, `REPORT_ONLY_HANDOFF`, `project: abvxsite`, matching slug/title/kind, and payload source/hash/body/date/media fields. Supply the complete reviewed JSON-frontmatter source; this command never generates an approval or rewrites product types, links, SEO or descriptions. Work targets Systems; books target Books. New series, custom routes and new placement mechanics remain engineering work.

After one prebuild and boundary check, `catalogue-v1` runs the same six real content gates with changed-card/hub QA. Shared code and unknown scope retain all full gates. Native and catalogue pools remain separate; do not count a catalogue receipt as native OS Writing closeout. Generic project measurement retains its independent workload/version and UNKNOWN owner effort until the private project lifecycle is explicitly extended. See [the publication/SEO audit](audits/publication-seo-2026-10-14.md).


## Add video to an existing project or book

Use one shared data-only path for existing `/books/<slug>` and `/work/<slug>` cards. Book and series sources resolve by their metadata, not a guessed filename. Book series live in `content/series/`; their declared root canonical path (for example `/good-dogs-of-the-apocalypse`) is also accepted. The canonical segment may differ from the source slug (for example `/bar` declared by `foo.md`); `/books/foo` remains an alias for the same source. Duplicate route/slug matches fail before writes:

1. Record private operation start, exact owner-approved card/video and workload `catalogue-video-addition-v1`; retain corrections and UNKNOWN owner effort. Keep engineering/optimization time separate from subsequent publication latency. Never restart a timer to hide a failed attempt.
2. On a clean branch from current main, run `npm run content:add-video -- --route <card-path> --video <YouTube-URL>` to inspect the dry-run, then repeat with `--write`. This preserves authored body bytes, old links and publication date, adds a labelled video and updates the modification date. An already-present video is a no-op; a different existing playable video requires separate replacement review. The command does not commit, approve or deploy. Existing legacy project types and book series are accepted by the updater; unsupported routine-publication types retain full QA. Published series may retain an absent original publication date; no historical date is invented. Additive media in an existing series can use catalogue-v1, including its unchanged declared canonical route. A routine-boundary rejection remains a signal to use the documented full release gates, never to fabricate a scoped PASS. Book URLs must match the existing book player: use the normal `youtu.be` video URL; unsupported privacy-host URLs or reordered watch query parameters are rejected before any write. Project cards retain their broader strict embed URL support.
3. Run one prebuild, boundary check and release check using the existing shared commands above. Existing projects/books/series can use `catalogue-v1` across their unchanged Focus, Systems and Books placements when only supported media is added plus the modification date. Every declared catalogue joins the checked hubs and must link to the target. New cross-listings, text/placement changes in these cross-listed cards, unsupported types and shared code still select full QA. QA verifies the exact first playable video, accessible iframe title and original link, not merely any iframe.
4. Open one PR, use the same CI/Preview readiness helper, inspect review feedback, perform the owner-authorized merge and verify exact production SHA with the production readiness helper. Its QA already checks the video, public indexes and mobile overflow; do not repeat that browser pass merely for timing.
5. Retain local gate durations, PR/CI/Preview waiting, merge/deployment and completed production QA privately. These catalogue observations are not native Writing lifecycle outcomes or Cortex-qualified comparisons. Native OS/Cortex hooks remain restricted to their documented workloads until a separately validated catalogue adapter exists.

Use the same route for singles and repeat operations of this type; do not hand-reconstruct frontmatter or introduce renderer work into a routine media publication. A single successful run cannot prove an end-to-end speedup.


## Shared additive-media route

Use the same preparation → boundary → release receipt → PR/CI/Preview → authorized merge → exact-SHA production QA sequence for supported content. Native Writing/Working Stories retain their existing full-source path and publication-v1 checks. Catalogue cards use the shared metadata resolver for work, books and series, independent of which catalogue is primary. Do not clone a separate release workflow per page.

For an existing catalogue card, `content:add-video` remains compatible. The common additive updater also supports a first cover/screenshot and PDF, EPUB, audio or audiobook links:

```sh
npm run content:add-media -- --route <existing-card-path> --type <youtube|image|pdf|epub|audio|audiobook> --url <URL> --label <label-or-image-alt>
# Review the dry-run, then repeat with --write.
npm run prebuild
npm run content:publication-boundary -- --base <full-base-SHA>
npm run content:release-check -- --base <full-base-SHA>
```

Images use existing PNG/JPEG/WebP descriptors and must be the first image: existing media replacement requires separate review. Add/reuse a local `/media/` image before release checks, or use an existing HTTPS image. Download URLs must be labelled supported file URLs; external audio/Releases assets remain preferable to adding large binaries to this site. Existing text, fields, links, first-publication dates and placements remain unchanged. An existing supported video or audio player cannot be silently replaced, and an exact repeated request is a no-op. The updater never approves, commits, pushes, merges or deploys.

The Git classifier recognizes unchanged additive-media project/book placements across Focus, Systems and Books, plus media-only updates to existing series, including unchanged root canonical routes and published legacy series without an original date. New series, custom route changes, core-page code, editorial templates, unsupported metadata/types, deletions and replaced tracked assets retain full QA. Static pages still need full QA when their implementation changes; shared similarity is not permission to skip it.

Catalogue QA proves the exact selected video, accessible title, original link, successfully rendered image, every declared catalogue link, entity/canonical/index membership and mobile widths. PDF/EPUB/audio downloads are checked with HEAD, including external downloads, without buffering media. Book audio remains opt-in. Every member of a media pool is checked; unknown scope falls back to full. This optimization's own code release must pass all full gates before subsequent content-only releases may use it.

Use workload `catalogue-video-addition-v1` for existing video-only observations and `catalogue-media-addition-v1` for other media additions. Retain operation kind, route, base/head/merge, actual selected profile, source corrections, gate durations and original continuous start. Engineering time is separate; native OS/Cortex lifecycle claims still do not apply to catalogue operations. Historical video observations with different cards, profiles or environments are descriptive, not proof of causal savings.
