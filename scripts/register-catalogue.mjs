import {readFileSync, writeFileSync} from 'node:fs';
import {contentFiles, parseContentFile} from './content-lib.mjs';
import {registerCatalogueItems} from '../src/content/catalogue-chronology.mjs';

const args = process.argv.slice(2);
if (args.some(arg=>arg!=='--bootstrap')) throw new Error('Unsupported catalogue registration option');
const items = ['work','books','series'].flatMap(kind=>contentFiles(kind).flatMap(file=>{
  const {data} = parseContentFile(file);
  return (data.visibility || 'public') === 'public' ? [{kind,slug:data.slug,publishedAt:data.publishedAt}] : [];
}));
const file = 'content/catalogue-discovery.json';
const previous = readFileSync(file,'utf8');
const updated = registerCatalogueItems(JSON.parse(previous),items,{bootstrap:args.includes('--bootstrap')});
const bytes = JSON.stringify(updated,null,2)+'\n';
if (bytes!==previous) writeFileSync(file,bytes);
console.log(`Catalogue discovery: ${updated.items.length} records; ${bytes===previous?'unchanged':'updated'}.`);
