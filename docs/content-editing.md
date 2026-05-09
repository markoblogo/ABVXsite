# Content Editing

The redesigned ABVX site uses a Git-based content registry for core pages. Notion is no longer required to render `/`, `/focus`, `/systems`, `/books`, `/writing`, `/about`, `/work/[slug]`, or `/books/[slug]`.

## Files

- `src/content/types.ts` defines allowed sections, types, statuses, and shared fields.
- `src/content/artifacts.ts` contains non-book work items.
- `src/content/books.ts` contains publishing items.
- `src/content/index.ts` exposes read helpers for pages.

## Shared Fields

Every content item uses the same base shape:

```ts
{
  id: 'stable-id',
  slug: 'public-url-slug',
  title: 'Public title',
  type: 'allowed-type',
  primarySection: 'focus',
  appearsIn: ['focus', 'systems'],
  status: 'building',
  publishedAt: '2026-05-09',
  updatedAt: '2026-05-09',
  summary: 'Short public card summary.',
  description: 'Longer detail-page text.',
  tags: ['tag-one', 'tag-two'],
  links: [{ type: 'website', label: 'Website', url: 'https://example.com' }],
  featured: true,
  sortRank: 10,
  needsReview: false,
}
```

Use public-facing text only. Do not add private notes, internal IDs, unverified claims, or secret URLs.

If a title is known but the URL is not verified, leave `links: []` and set `needsReview: true`.

Local media should live under `public/media/books`, `public/media/projects`, or `public/media/series`. Reference it with public paths such as `/media/projects/example.png`; preserve the real file extension and do not use temporary Notion asset URLs or old Next.js image optimizer URLs in content records.

## Add a Focus Project

Use `src/content/artifacts.ts`.

Focus projects are current work around agro-commodity trading infrastructure. They usually appear in both `/focus` and `/systems`.

```ts
{
  id: 'new-market-system',
  slug: 'new-market-system',
  title: 'New Market System',
  type: 'market-infrastructure',
  primarySection: 'focus',
  appearsIn: ['focus', 'systems'],
  status: 'building',
  summary: 'Digital market workflow for physical agro-commodity trading.',
  description:
    'Longer public explanation of what the system does and where it fits in the market infrastructure work.',
  tags: ['agro-commodities', 'market-infrastructure', 'workflow'],
  thumbnail: {
    src: '/media/projects/new-market-system.png',
    alt: 'New Market System interface screenshot',
  },
  links: [{ type: 'website', label: 'Site', url: 'https://example.com' }],
  featured: false,
  sortRank: 50,
  needsReview: true,
}
```

After adding it, the item should appear on `/focus`, `/systems`, `/work/new-market-system`, and sitemap.

## Add a Systems Artifact

Use `src/content/artifacts.ts`.

Systems artifacts include web services, tools, protocols, AI workflows, language experiments, research, build logs, and book companions.

Allowed `ArtifactType` values:

- `market-infrastructure`
- `web-service`
- `tool`
- `protocol`
- `ai-workflow`
- `language-experiment`
- `book-companion`
- `research`
- `build-log`

Example:

```ts
{
  id: 'new-agent-tool',
  slug: 'new-agent-tool',
  title: 'New Agent Tool',
  type: 'ai-workflow',
  primarySection: 'systems',
  appearsIn: ['systems'],
  status: 'live',
  summary: 'Small AI-development workflow tool for repeatable project setup.',
  description:
    'Public detail text explaining the workflow, intended use, and current state.',
  tags: ['ai-dev', 'agents', 'workflow'],
  thumbnail: {
    src: '/media/projects/new-agent-tool.png',
    alt: 'New Agent Tool screenshot',
  },
  links: [{ type: 'github', label: 'GitHub', url: 'https://github.com/markoblogo/example' }],
  featured: false,
  sortRank: 140,
  needsReview: false,
}
```

After adding it, the item should appear on `/systems`, `/work/new-agent-tool`, and sitemap.

## Add a Book

Use `src/content/books.ts`.

Allowed `BookType` values:

- `book`
- `series`
- `translation`
- `free-edition`
- `companion`

Example:

```ts
{
  id: 'new-book',
  slug: 'new-book',
  title: 'New Book',
  type: 'book',
  primarySection: 'books',
  appearsIn: ['books'],
  status: 'released',
  publishedAt: '2026-05-09',
  summary: 'Short public summary for cards and metadata.',
  description:
    'Longer detail-page text with public context, series notes, or edition notes.',
  tags: ['books', 'strategy'],
  coverImage: {
    src: '/media/books/new-book.png',
    alt: 'New Book cover',
  },
  links: [
    { type: 'amazon', label: 'Amazon', url: 'https://www.amazon.com/example' },
    { type: 'pdf', label: 'PDF', url: '/media/books/new-book.pdf' },
  ],
  featured: false,
  sortRank: 90,
  needsReview: false,
}
```

After adding it, the item should appear on `/books`, `/books/new-book`, and sitemap.

## Add a Cross-Listed Item

Use `primarySection` for the canonical home and `appearsIn` for additional visibility.

Examples:

- A book landing page can be canonical in `books` and appear in `systems`.
- A market infrastructure project can be canonical in `focus` and appear in `systems`.
- A language publishing project can be canonical in `books` and appear in `systems`.

Example book companion:

```ts
{
  id: 'new-book-companion',
  slug: 'new-book-companion',
  title: 'New Book Companion',
  type: 'companion',
  primarySection: 'books',
  appearsIn: ['books', 'systems'],
  status: 'live',
  summary: 'Companion landing page and technical support layer for a book series.',
  description:
    'Public context for the companion, related publishing project, and system role.',
  tags: ['book-companion', 'landing', 'publishing'],
  coverImage: {
    src: '/media/series/new-book-companion.png',
    alt: 'New Book Companion cover',
  },
  links: [{ type: 'book-site', label: 'Site', url: 'https://example.com' }],
  featured: true,
  sortRank: 45,
  needsReview: false,
}
```

The canonical detail route is still `/books/new-book-companion` because it lives in `src/content/books.ts`.

## Review Checklist

Before committing content changes:

- Confirm the slug is stable and unique.
- Confirm all URLs are public and verified.
- Confirm summaries are public-facing and concise.
- Confirm `primarySection` reflects the canonical home.
- Confirm `appearsIn` has only useful cross-listing sections.
- Run `npm run lint`.
- Run `npm run build`.
