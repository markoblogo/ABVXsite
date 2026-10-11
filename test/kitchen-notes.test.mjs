import assert from 'node:assert/strict';
import test from 'node:test';
import { validateKitchenNotes, recipeJsonLd } from '../src/content/kitchen-notes.mjs';
const recipe = {recipeYield:'One breakfast', ingredients:[{name:'oats',quantityText:'3 tablespoons'}], instructions:['Mix and cook.'], timingText:'Roughly ten minutes.'};
test('recipe needs collection and complete structured ingredients and steps', () => {
  assert.deepEqual(validateKitchenNotes({type:'recipe', collection:'kitchen-notes', media:{src:'/cover.png'}, recipe}), []);
  assert.ok(validateKitchenNotes({type:'recipe'}).length);
  assert.ok(validateKitchenNotes({type:'recipe', collection:'kitchen-notes',recipe:{...recipe,ingredients:[{name:'oats'}]}}).length);
  assert.ok(validateKitchenNotes({type:'recipe',collection:'kitchen-notes',recipe:{...recipe,instructions:[]}}).length);
  assert.ok(validateKitchenNotes({type:'recipe',collection:'kitchen-notes',recipe:{...recipe,nutrition:{}}}).length);
  assert.deepEqual(validateKitchenNotes({type:'note',collection:'kitchen-notes'}), []);
  assert.deepEqual(validateKitchenNotes({type:'article'}), []);
});
test('Recipe schema uses visible quantities and steps without inventing precise times or nutrition', () => {
  const data=recipeJsonLd({title:'Breakfast',summary:'Test',slug:'breakfast',language:'en',publishedAt:'2026-10-11',recipe,coverImage:{src:'/media/cover.png'}},'https://abvx.xyz');
  assert.equal(data['@type'],'Recipe');
  assert.deepEqual(data.recipeIngredient,['3 tablespoons oats']);
  assert.deepEqual(data.recipeInstructions,[{'@type':'HowToStep',text:'Mix and cook.'}]);
  assert.equal(data.image,'https://abvx.xyz/media/cover.png');
  for(const key of ['prepTime','cookTime','totalTime','nutrition','aggregateRating']) assert.equal(data[key],undefined);
});
