# Editorial SEO release checklist

Use this for new editorial guides linked from Focus, Systems, or Books.

1. **Start from current source.** Confirm the checkout is clean, fetch `origin/main`, and branch from it in a separate local worktree. Treat `content/editorial/` and `content/editorial/index.json` as source; preserve published slugs.
2. **Map the page before drafting.** List every requested heading and article once. For translations, pair entries with the same `translationGroup`, the correct `language` (`en` / `uk` / `fr`), and localized `linkLabel`; keep one canonical route per language.
3. **Write and connect each guide.** Add Markdown with a title matching the index entry, a distinct search intent, useful project/book links, and no unsupported claims. Add the default-language link beside its exact page heading; the article route supplies language links and alternate metadata.
4. **Regenerate public indexes.** Run `npm run llms:generate`; commit the generated `public/llms.txt` and `public/content-index.json`. Do not hand-edit generated output. Re-run the generator after the build if it changes either file.
5. **Verify locally before opening one PR.** Run `npm ci` when dependencies or lockfiles change, then `npm run content:validate`, `npm run ecosystem:check`, `npm run lint`, `npm run test:sync`, `npm run cortex-abv:vector-export:check`, `npm run build`, and `npm audit --omit=dev --audit-level=high`. Confirm the working tree stays clean after generation/build.
6. **Verify the release.** Wait for all PR checks and Vercel Preview; merge only after they pass. Confirm the production deployment is `READY` for the merge SHA, then open `/focus` and representative article routes and check section links, language switching, sitemap alternates, and public indexes.
