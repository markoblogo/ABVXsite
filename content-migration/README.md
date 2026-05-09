# Legacy Content Export

This folder is for local migration exports from the current Notion-backed content model into reviewable JSON files.

The export is intentionally conservative:

- It reads from the existing legacy Notion data sources for projects, books, and ecosystems.
- It writes only public-facing fields.
- It does not write Notion page IDs, relation IDs, internal review notes, private notes, or secrets.
- It skips temporary signed Notion file URLs for covers and keeps only external cover URLs.
- It treats ecosystems as migration context only, not as the future public IA.

## Outputs

Run the export to generate:

- `content-migration/legacy-projects.json`
- `content-migration/legacy-books.json`
- `content-migration/legacy-ecosystems-context.json`

These generated files are intended for local review before migrating content into a future Git-based registry.

## Required Environment

The script requires a local `NOTION_TOKEN` with read access to the current ABVX Notion data sources.

Do not commit the token.

Example:

```bash
NOTION_TOKEN=ntn_... npm run export:legacy-content
```

If `NOTION_TOKEN` is missing, the script exits with a clear message and does not create export files.

## Command

```bash
npm run export:legacy-content
```

## Exported Field Policy

Projects may include:

- `name`
- `summary`
- `type`
- `stage`
- `status`
- public URLs: `website`, `github`, `demo`
- public external `coverImage`
- migration grouping labels such as direction, initiative, and public cluster labels

Books may include:

- `name`
- `slug`
- `summary`
- `type`
- `status`
- public URLs: `site`, `teaser`, `pdf`, `amazon`, `paper`
- public external `coverImage`
- migration grouping labels such as Press/Lang/Tech clusters

Ecosystem context may include:

- `name`
- `slug`
- `tagline`
- `status`
- `primaryUrl`
- public external `coverImage`

Ecosystem context is exported only to help map old content into the new structure. It should not drive the future public navigation.
