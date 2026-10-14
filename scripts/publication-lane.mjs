import { publicationMetadataErrors } from './publication-metadata.mjs';
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { planWriting } from './publish-writing.mjs';
import { planCatalogue } from './publish-catalogue.mjs';
import { planWorkingStory } from './publish-working-story.mjs';
import { applyPublications } from './publication-media.mjs';
import { publicationScope } from './publication-scope.mjs';
import { parseMarkdownSource } from '../src/content/markdown-source.mjs';
import { validLinkTypes } from './content-lib.mjs';

function git(root, ...args) {
 return execFileSync('git', args, {cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
}
export function assertPublicationBoundary(base, root=process.cwd()) {
 const scope = publicationScope(base, 'HEAD', root, true);
 if (!['publication-v1','catalogue-v1'].includes(scope.profile)) throw new Error(`Outside publication boundary: ${scope.reason}. Use a separate engineering release.`);
 return scope;
}
function validateRoutineWriting(source) {
 const {data} = parseMarkdownSource(source);
 const errors=publicationMetadataErrors(data);if(errors.length) throw Error(errors.join('; '));
 if (!['note','article','review','build_log','other','recipe'].includes(data.type)) throw new Error('New publication types need a separate engineering release');
 for (const key of ['title','summary','seoTitle','seoDescription']) {
  if ((['title','summary'].includes(key)||data[key]!==undefined) && (typeof data[key]!=='string'||!data[key].trim())) throw new Error(`Invalid publication ${key}`);
 }
 if (!Array.isArray(data.tags)||!data.tags.every(t=>typeof t==='string')||!Array.isArray(data.links)) throw new Error('Publication tags and links must be arrays');
 for (const link of data.links) {
  if (!link || !validLinkTypes.has(link.type) || typeof link.label!=='string' || !link.label.trim() || typeof link.url!=='string') throw new Error('Invalid publication link');
  if (!link.url.startsWith('/') && !['http:','https:','mailto:'].includes(new URL(link.url).protocol)) throw new Error('Invalid publication link URL');
 }
 if (data.appearsIn!==undefined && (!Array.isArray(data.appearsIn) || data.appearsIn.some(s=>s!=='writing'))) throw new Error('Routine publication cannot change site sections');
 if (data.canonicalPath && data.canonicalPath!==`/writing/${data.slug}`) throw new Error('Custom routes need a separate engineering release');
}
export function planPublicationPool(packets, base, root=process.cwd()) {
 if (!/^[a-f0-9]{40}$/i.test(base||'')) throw new Error('Known full base SHA required');
 git(root,'merge-base','--is-ancestor',base,'HEAD');
 if (git(root,'status','--porcelain','--untracked-files=all')) throw new Error('Routine publication requires a clean checkout; keep packets outside the site');
 if (git(root,'diff','--name-only',base,'HEAD','--')) throw new Error('Start from the base in a fresh publication branch; use a separate engineering release for other changes');
 if (!packets.length) throw new Error('At least one approved packet required');
 if(new Set(packets.map(p=>['work','books'].includes(p.surface)?'catalogue':'writing')).size>1) throw new Error('Use separate catalogue and Writing releases');
 const plans=packets.map(packet=>{
  if (typeof packet.payload?.source_markdown!=='string') throw new Error('Routine publication requires the complete approved source');
  if (packet.surface==='writing') {
   const plan=planWriting(packet,root);validateRoutineWriting(plan.source);return plan;
  }
  if (['work','books'].includes(packet.surface)) return planCatalogue(packet,root);
  if (packet.surface==='working-stories') return planWorkingStory(packet,root);
  throw new Error('Unsupported routine publication surface');
 });
 const files=new Set(), ids=new Set(), storySlugs=new Set(), catalogueIds=new Set(), catalogueSlugs=new Set(), assets=new Map();
 for (const plan of plans) {
  const {data}=parseMarkdownSource(plan.source);
  if(['abvx.publish-project','abvx.publish-book'].includes(plan.report.operation)) {
   if(catalogueIds.has(data.id)||catalogueSlugs.has(data.slug)) throw Error('Duplicate catalogue identity in publication pool');
   catalogueIds.add(data.id);catalogueSlugs.add(data.slug);
  }
  if (files.has(plan.targetFile) || (data.story_id && (ids.has(data.story_id) || storySlugs.has(data.slug)))) throw new Error('Duplicate publication member or story ID');
  files.add(plan.targetFile);if(data.story_id) { ids.add(data.story_id); storySlugs.add(data.slug); }
  for (const asset of plan.media) {
   if (assets.has(asset.target) && !assets.get(asset.target).equals(asset.bytes)) throw new Error('Conflicting pool media bytes');
   assets.set(asset.target,asset.bytes);
  }
 }
 return plans;
}
if (process.argv[1] && import.meta.url===pathToFileURL(realpathSync(process.argv[1])).href) {
 const args=process.argv.slice(2), packets=[];let base, mode;
 for (let i=0;i<args.length;i++) {
  if(args[i]==='--base') base=args[++i];
  else if(args[i]==='--packet') packets.push(JSON.parse(readFileSync(args[++i],'utf8')));
  else if(['--dry-run','--write','--check'].includes(args[i]) && !mode) mode=args[i];
  else throw new Error('Usage: --base <SHA> --packet <path> [--packet <path>] --dry-run|--write; or --base <SHA> --check');
 }
 if(mode==='--check') {
  if(packets.length) throw new Error('Boundary check accepts no packets');
  console.log(JSON.stringify(assertPublicationBoundary(base),null,2));
 } else {
  if(!mode) throw new Error('Choose --dry-run or --write explicitly');
  const plans=planPublicationPool(packets,base);
  if(mode==='--write') applyPublications(plans);
  console.log(JSON.stringify({mode:mode==='--write'?'WRITE':'DRY_RUN',base,members:plans.map(p=>p.report),next:'Regenerate once, check the data-only boundary, then run one scoped release check.'},null,2));
 }
}
