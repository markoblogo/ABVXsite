# Kitchen Notes

Recipes remain native Writing posts. `collection: "kitchen-notes"` groups them at `/writing/kitchen-notes`; existing notes may join without changing their type or body.

For `type: "recipe"`, provide an approved image and `recipe` with `recipeYield`, `ingredients` (`name`, `quantityText`) and `instructions` (text steps). Optional `timingText` and `variations` remain visible text. The page renders these same fields and Recipe JSON-LD. Do not invent exact timings, nutrition or ratings. Loader, packet consumer and content validator share the schema checks. SEO copy may use `seoTitle` and `seoDescription`.

Run the normal OS native-publication cycle. After additions, run `npm run content:release-check` and commit generated public indexes. `npm run export:kitchen-notes` creates ignored JSON and Markdown exports for a possible future cookbook; export is not book publication approval.

Reference: [Google Recipe structured data](https://developers.google.com/search/docs/appearance/structured-data/recipe).
