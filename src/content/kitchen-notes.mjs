const text = value => typeof value === 'string' && Boolean(value.trim());
export function validateKitchenNotes(data, body = '') {
  const errors = [];
  if (data.collection !== undefined && data.collection !== 'kitchen-notes') errors.push('Unsupported Writing collection');
  if (data.type !== 'recipe') {
    if (data.recipe !== undefined) errors.push('Structured recipe requires type recipe');
    return errors;
  }
  if (data.collection !== 'kitchen-notes') errors.push('Recipe requires kitchen-notes collection');
  if (/\[[^\]]+\]\(\/writing\/kitchen-notes\)/.test(body)) errors.push('Kitchen Notes navigation is supplied by the page; remove the duplicate collection link from the recipe body');
  const recipe = data.recipe;
  if (!recipe || typeof recipe !== 'object' || Array.isArray(recipe)) return [...errors, 'Recipe requires structured ingredients and instructions'];
  const fields = new Set(['recipeYield', 'ingredients', 'instructions', 'timingText', 'variations']);
  for (const key of Object.keys(recipe)) if (!fields.has(key)) errors.push(`Unsupported recipe field: ${key}`);
  if (!text(recipe.recipeYield)) errors.push('Recipe yield is required');
  if (!Array.isArray(recipe.ingredients) || !recipe.ingredients.length || !recipe.ingredients.every(ingredient =>
    ingredient && text(ingredient.name) && text(ingredient.quantityText) && Object.keys(ingredient).every(key => ['name', 'quantityText'].includes(key)))) errors.push('Recipe ingredients require name and quantityText');
  if (!Array.isArray(recipe.instructions) || !recipe.instructions.length || !recipe.instructions.every(text)) errors.push('Recipe instructions must be non-empty text steps');
  if (recipe.timingText !== undefined && !text(recipe.timingText)) errors.push('Recipe timingText must be text');
  if (recipe.variations !== undefined && (!Array.isArray(recipe.variations) || !recipe.variations.every(text))) errors.push('Recipe variations must be text');
  if (!data.media && !data.coverImage && !data.heroImage) errors.push('Recipe requires an image');
  return errors;
}

export function recipeJsonLd(item, siteUrl) {
  const recipe = item.recipe;
  return {
    '@context': 'https://schema.org', '@type': 'Recipe', name: item.title,
    description: item.summary, inLanguage: item.language || 'en',
    url: `${siteUrl}/writing/${item.slug}`, datePublished: item.publishedAt,
    image: new URL((item.heroImage || item.coverImage).src, siteUrl).href,
    author: {'@type': 'Person', '@id': `${siteUrl}/#person`, name: 'Anton Biletskyi-Volokh'},
    recipeYield: recipe.recipeYield,
    recipeIngredient: recipe.ingredients.map(ingredient => `${ingredient.quantityText} ${ingredient.name}`),
    recipeInstructions: recipe.instructions.map(text => ({'@type': 'HowToStep', text})),
  };
}
