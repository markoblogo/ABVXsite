# ABVX OS publication handoff

ABVX OS prepares and records source-specific approval; this repository owns file writes, validation, rendering and deployment. Reuse the existing content packet flow, as for Azur Menton. No runtime ABVX OS dependency is added.

| Packet | Command | Result |
| --- | --- | --- |
| `abvx.writing` | `npm run content:publish-writing -- --packet <absolute-path> --dry-run` | Native Writing plan; use `--write` after review |
| `abvx.working-story` | `npm run content:publish-working-story -- --packet <absolute-path> --dry-run` | Validated story/media plan; use `--write` after review |
| `abvx.work` | Existing `content:publish-project` | Existing work-record procedure |

For Working Stories, the packet includes `payload.source_markdown` with complete, ready JSON-frontmatter Markdown and `source_sha256`. It also includes the matching title/slug, `date_published`, `language` and body in `body_lines`. The existing source validator owns all story metadata rules, including neutral internal IDs and placement headings. The source must explicitly be public and dated on/before today. Optional `media_assets` entries contain absolute local `source`, public `/media/...` `target` and approved byte `sha256`; targets must be referenced by the story. Existing matching assets are reused; conflicting assets, missing media, source changes, duplicate IDs/slugs, symlink destinations and unsupported contracts fail before content writes. The source is saved byte-for-byte, not regenerated from enrichment.

Only pass a source-specific approved packet. `REPORT_ONLY_HANDOFF` is the transport mode, not an assertion that anything is online. Native Writing preserves its existing frontmatter mapping and body, including the packet language; unsupported embeds/actions require a separate project-specific workflow.

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
