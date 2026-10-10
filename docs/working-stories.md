# Working Stories

A dedicated editorial collection, not a second CMS or a book outline. Sources use the existing Markdown renderer and **JSON frontmatter** parser.

## Add a story

Create `content/working-stories/ws-001-public-slug.md`. The filename is for maintenance; the stable ID comes from metadata and the URL comes from `slug`.

```md
---
{
  "title": "Public story title",
  "slug": "public-slug",
  "date": "2026-10-10",
  "type": "working-story",
  "series": "working-stories",
  "story_id": "ws-001",
  "cluster": "project-001",
  "period": "2010s",
  "topics": ["branding", "experiments"],
  "book": { "include": true, "status": "draft" },
  "visibility": "draft",
  "summary": "A short public description.",
  "language": "en",
  "source_session": "session-001"
}
---

Write the actual story here using normal Markdown.
```

This example is documentation only; do not publish it as placeholder content.

- Required: `title`, `slug`, `date`, `type`, `series`, `story_id`, `cluster`, `period`, `topics`, `book.status`. The validator checks real calendar dates, safe slugs, neutral identifiers, duplicates and supported fields.
- Assign the next `story_id` by taking the highest existing numeric ID plus one, padded to at least three digits. The first is `ws-001`; never renumber or reuse IDs after changing titles/slugs or removing a story.
- Reuse a neutral `cluster` for the same underlying project/company/engagement. Allocate a new `project-001`-style number for a different context. These are relationship IDs, not chapters or public labels.
- Use a loose `period` such as `2000s` or `2020-2022`; use `null` when unknown. `topics` is an array of free-form labels, with no closed taxonomy.
- `book.include` defaults to `true`. `book.status` must be `draft`, `selected`, `edited`, `final` or `excluded`.

Optional `source_session` uses a neutral `session-001`-style identifier. One session can produce multiple independently published stories and span several clusters. Optional `summary` falls back to the title, `language` defaults to `en` (`en`, `uk`, `fr` supported), and `updatedAt` must be a real date on/after publication.

Optional website media and references live in frontmatter, keeping them out of manuscript exports:

- `coverImage`: `{ "src": "/media/working-stories/example.webp", "alt": "Description", "width": 1200, "height": 674 }`. Used in the article, Writing feed, social metadata and public index.
- `illustrations`: an array of the same image fields plus `caption` and `afterHeading`. The latter must exactly match an existing `##` heading; images appear after that section. Use captions that distinguish concepts from production photographs.
- `caseStudy`: `{ "label": "See the visual case study on Behance", "url": "https://www.behance.net/gallery/..." }`. Appears after the first illustrated section and in the public index. Links open in a new tab.

Keep images in `public/media/`, use their actual dimensions, and include descriptive alt text. The validator checks local image paths, existence and heading placement. Preserve original artwork rather than browser controls from screenshots.

## Publish and relate

`visibility` defaults to `draft`; set it explicitly to `public` and use a publication `date` on/before today UTC when generating a release. `private`, `draft` and future-dated stories do not enter that release's discovery index. Runtime pages, feeds, related links and sitemap use the published Working Story URLs in the generated `public/content-index.json` as their release snapshot. Passing a future date does not publish a story automatically: regenerate both indexes, rebuild and deploy together. There is no scheduled publishing service.

Publication is independent of `book.status` and `book.include`. A public story excluded from the book remains publicly available.

Public URLs:

- Series: `/writing/working-stories` (newest first; a minimal message when empty).
- Story: `/writing/working-stories/<slug>`.

Published stories also enter the normal Writing feed as local ABVX posts. Topic labels appear as existing article metadata. A story automatically links other published stories with the same cluster using public titles; no related block appears when there are none. Internal IDs and book state are not rendered or serialized into public indexes.

Server helpers in `src/content/working-stories.ts` expose `getWorkingStories({ topic, cluster, sourceSession })`, `getWorkingStoryBySlug`, `getRelatedWorkingStories` and `workingStoriesFeed`. For internal corpus queries, use `queryWorkingStories(readWorkingStories(), query)` from the shared library; this includes unpublished records.

## Privacy

The repository may be public. **Draft/private visibility is a website filter, not repository confidentiality.** Keep all source metadata and prose safe for a public repository. Never store confidential client/company/person names, personal identifiers, raw voice notes, secrets or private session transcripts here. Use neutral cluster/session IDs. Real names in public prose require a separate story-specific editorial decision. Unsupported metadata fields such as `client` or `person` are rejected.

## Export the book-eligible corpus

```sh
npm run export:working-stories
```

Generated outputs:

- `exports/working-stories-manuscript.md`: collection label, story titles, authored Markdown bodies and separators. Preserves body headings/emphasis; omits frontmatter and website-generated navigation, related links, SEO and CTAs.
- `exports/working-stories-manifest.json`: JSON array of `story_id`, `title`, `date`, `cluster`, `period`, `topics`, `book_status`, `source` (filename), plus `source_session` when provided.

Selection is strictly `type === working-story`, `book.include === true`, and `book.status !== excluded`. Ordinary Writing files never enter the export. Book-eligible draft/private/future-dated records are intentionally included: this is an editorial export, not a public feed. Keep website-only CTAs out of the authored body; the exporter preserves authored content rather than guessing which paragraphs to remove.

Sort order is publication date ascending, then stable `story_id` lexically. There are no generation timestamps, chapter planning or thematic rearrangements. Source stories are never rewritten. `/exports/` is ignored by Git and is not served by the website; regenerate locally when needed. With zero stories the manifest is `[]` and the manuscript contains only the collection label.

## Verify and release

Run `npm run content:validate`, `npm run llms:generate`, `npm run export:working-stories`, then the [editorial release checklist](editorial-seo-checklist.md). Commit source changes and regenerated `public/llms.txt` / `public/content-index.json`, not exports. Published routes receive canonical/OG article metadata, Article JSON-LD, sitemap entries and allowlisted public discovery records. Test fixtures stay in temporary directories outside `content/`.
