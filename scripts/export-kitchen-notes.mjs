import {mkdirSync, writeFileSync} from 'node:fs';
import {contentFiles,parseContentFile} from './content-lib.mjs';
import {validateKitchenNotes} from '../src/content/kitchen-notes.mjs';
const notes=contentFiles('writing').map(file => parseContentFile(file)).filter(({data}) => data.collection === 'kitchen-notes' && data.visibility === 'public' && data.status === 'live');
for(const {data} of notes) { const errors=validateKitchenNotes(data); if(errors.length) throw new Error(errors.join('; ')); }
mkdirSync('exports/kitchen-notes',{recursive:true});
writeFileSync('exports/kitchen-notes/recipes.json',JSON.stringify({schemaVersion:1,recipes:notes.map(({data}) => ({title:data.title,url:`https://abvx.xyz/writing/${data.slug}`,type:data.type,...(data.recipe ? {recipe:data.recipe} : {})}))},null,2)+'\n');
writeFileSync('exports/kitchen-notes/manuscript.md',notes.map(({data,body}) => `# ${data.title}\n\n${body}`).join('\n\n---\n\n')+'\n');
console.log(`Exported ${notes.length} Kitchen Notes to ignored local exports/kitchen-notes/.`);
