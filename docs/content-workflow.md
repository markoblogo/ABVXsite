# File-Based Content Workflow

`/content` is the editable source of truth for public ABVX content.

Do not edit public books, work items, or series in `src/content/books.ts` or `src/content/artifacts.ts` unless you are intentionally maintaining temporary fallback data. File content overrides fallback content by `slug`.

## Structure

```text
content/
  books/
    _template.md
    <book-slug>.md
  work/
    _template.md
    <work-slug>.md
  series/
    _template.md
    <series-slug>.md

public/media/
  books/
  work/
  series/
```

Existing migrated media may still live in `public/media/books` and `public/media/projects`. New work media should preferably use `public/media/work/<slug>/`.

## File Format

Each content file is Markdown with JSON frontmatter:

```md
---
{
  "id": "example",
  "slug": "example",
  "type": "book",
  "status": "released",
  "visibility": "public",
  "title": "Example Book",
  "summary": "Short summary for catalogue cards.",
  "tags": ["tag"],
  "appearsIn": ["books"],
  "links": [],
  "featured": false,
  "sortRank": 999
}
---

Longer detail-page copy goes here.
```

The frontmatter controls cards, lists, media, links, grouping and review state. The Markdown body is used as the longer description on detail pages.

## Edit Existing Content

To edit an existing book:

1. Open `content/books/<slug>.md`.
2. Update `title`, `shortTitle`, `subtitle`, `summary`, `series`, `group`, `tags`, `media`, `links`, or the Markdown body.
3. Run `npm run content:validate`.
4. Run `npm run build` before preview/deploy.

To edit an existing project/work item:

1. Open `content/work/<slug>.md`.
2. Update `summary`, `primarySection`, `appearsIn`, `group`, `tags`, `media`, `links`, or the Markdown body.
3. Run `npm run content:validate`.
4. Run `npm run build`.

To edit an existing series:

1. Open `content/series/<slug>.md`.
2. Update `summary`, `group`, `tags`, `media`, `links`, or the Markdown body.
3. Run validation and build.

## Replace Images

1. Put the image under the matching media folder.
2. Update the content file `media.src`.
3. Update `media.alt`.
4. Set the correct `media.role`.

Allowed media roles:

- `book-cover`
- `project-screenshot`
- `landing-screenshot`
- `mockup`
- `rss-image`
- `video-thumbnail`
- `generic-thumbnail`

Use `book-cover` only for true portrait covers. Use `landing-screenshot` for landing pages and `project-screenshot` for dashboards/tools.

## Add New Content

Use generators:

```bash
npm run content:new-book
npm run content:new-work
npm run content:new-series
```

Each generator creates:

- a Markdown file in `content/books`, `content/work`, or `content/series`
- a matching media folder under `public/media/books`, `public/media/work`, or `public/media/series`

After generation:

1. Add image files.
2. Update `media.src` and `media.alt`.
3. Add public links.
4. Change `visibility` from `draft` to `public` when ready.
5. Run `npm run content:validate`.
6. Run `npm run build`.

## Links

Allowed link types:

- `site`
- `github`
- `demo`
- `youtube`
- `amazon`
- `kindle`
- `paperback`
- `pdf`
- `series`
- `medium`
- `substack`
- `deck`
- `other`

Examples:

```json
{ "type": "kindle", "label": "Kindle", "url": "https://www.amazon.com/dp/..." }
{ "type": "paperback", "label": "Paperback", "url": "https://www.amazon.com/dp/..." }
{ "type": "site", "label": "Site", "url": "https://example.abvx.xyz/" }
{ "type": "github", "label": "GitHub", "url": "https://github.com/..." }
{ "type": "youtube", "label": "YouTube", "url": "https://youtu.be/..." }
{ "type": "pdf", "label": "PDF", "url": "/media/books/example.pdf" }
{ "type": "deck", "label": "Deck", "url": "https://example.abvx.xyz/deck/" }
```

## Cross-Listing

`primarySection` defines the canonical home for work items.

`appearsIn` controls where an item can be shown.

Examples:

```json
{
  "primarySection": "focus",
  "appearsIn": ["focus", "systems"]
}
```

Use this for agro-commodity infrastructure projects that are also technical systems.

Books do not use `primarySection` in files because books are canonically in `/books`; use `appearsIn` to cross-list a book into `focus` or `systems`.

## Groups And Series

`group` is a public grouping label for catalogue pages.

Examples:

- `Trading services`
- `Landing pages`
- `AI/dev stack`
- `Language & AI`

`series` groups books into a publishing line.

Examples:

- `Ukrainian Modernism`
- `Toki Pona Classics`
- `Chinese Wisdom in Toki Pona`

## Sorting And Featured

`featured: true` lifts an item into featured areas where the page uses featured content.

`sortRank` controls manual ordering. Lower numbers appear earlier.

Use broad ranges:

- `10-99` for core focus items
- `100-299` for active systems/books
- `500+` for archive or lower-priority records

## Visibility

`visibility` controls public rendering:

- `public`: visible everywhere.
- `draft`: visible in development loaders, excluded in production.
- `private`: always excluded.

Do not put private notes, private URLs, or secrets into content files.

## Review Flags

Review fields are internal and must never render publicly:

- `needsCopyReview`
- `needsMediaReview`
- `needsLinkReview`
- `editorialNotes`

Use them for planning editorial cleanup.

## Validation And Review

Run structural validation:

```bash
npm run content:validate
```

Run editorial report:

```bash
npm run content:review
```

Validation fails on structural errors. Review flags only warn.

## Preview And Deployment

Before Vercel preview or production:

```bash
npm run content:validate
npm run content:review
npm run lint
npm run build
```

Use Vercel preview to visually check changed pages before merging.

Ask Codex for bulk edits when many records need consistent changes, such as renaming groups, changing cross-listing, updating link types, or replacing media paths.
