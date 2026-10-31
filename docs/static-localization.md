# Static profile localization

English `/`, `/about` and `/work-with-me` retain their URLs. French uses `/fr`, `/fr/about`, `/fr/work-with-me`; Ukrainian uses `/uk`, `/uk/about`, `/uk/work-with-me`. These are equivalent profile pages, not localized catalogues. There are no browser-language redirects or locale cookies.

The shared templates live in `src/components/static-pages/`. `static-translations.json` supplies explicit French/Ukrainian copy for those templates; the server-only renderer applies it before sending HTML. SEO titles/descriptions live in `content/static-pages.json`. Maintain both translations when editing English copy. The locale route map is deliberately restricted to three paths.

Project, book and writing blocks remain verbatim and retain original URLs, with `lang="en"` boundaries in the templates. Their content is not sent through the translation adapter. The wider catalogues, detail pages and service detail routes do not acquire implied translations. The existing `/fr/ami` page is independent of this profile group. Footer copy remains English and declares its language.

The header selector sits at the end of the logo/name block, before Projects. It switches the same page between EN/FR/UK; the profile links retain the chosen locale. Opening a catalogue leaves this scope. Desktop/tablet/mobile retain the existing scrollable menu.

Each page has a self canonical, localized metadata/Open Graph information and WebPage/AboutPage schema. Reciprocal self-including `en`, `fr`, `uk` and `x-default` alternates are generated from one map, including in the sitemap. The nine pages also enter the public content index. SSR language and client navigation use the same language conventions.

`test/static-locales.test.mjs` checks route boundaries and copy/SEO declarations; full `qa:seo` runs `scripts/static-locales-qa.mjs` across nine direct loads and client navigation, preserves excluded blocks, and checks 390/768/1440px layouts. Technical readiness is not evidence of successful Google processing or indexing.

Reference: [Google Search Central: localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions).
