// One data-only addition path for existing project/book cards. No release authority.
import { readFileSync, writeFileSync, realpathSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parseMarkdownSource } from '../src/content/markdown-source.mjs';
import { youtubeVideoId } from '../src/lib/youtube-url.mjs';
import { publicationMetadataErrors } from './publication-metadata.mjs';

export const catalogueVideoId=youtubeVideoId;
export function catalogueCardVideoId(value,folder='work') {
 return ['books','work'].includes(folder)?youtubeVideoId(value):null;
}
export function isCatalogueVideoAddition(previous,current,folder='work') {
 const strip=data=>Object.fromEntries(Object.entries(data).filter(([key])=>!['links','updatedAt'].includes(key)));
 const before=previous.data.links||[], after=current.data.links||[];
 return Date.parse(current.data.updatedAt)>=Date.parse(previous.data.updatedAt||previous.data.publishedAt||'1970-01-01')&&Date.parse(current.data.updatedAt)<=Date.now()
  &&previous.body===current.body&&JSON.stringify(strip(previous.data))===JSON.stringify(strip(current.data))
  &&Array.isArray(before)&&Array.isArray(after)&&after.length===before.length+1
  &&JSON.stringify(after.slice(0,-1))===JSON.stringify(before)
  &&after.at(-1).type==='youtube'&&Boolean(catalogueCardVideoId(after.at(-1).url,folder))
  &&!before.some(link=>link.type==='youtube'&&catalogueCardVideoId(link.url,folder)===catalogueCardVideoId(after.at(-1).url,folder));
}
function catalogueTarget(route) {
 const normal=route.match(/^\/(books|work)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
 if(normal)return {folder:normal[1],slug:normal[2],canonicalSeries:false};
 const canonical=route.match(/^\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
 if(canonical)return {folder:'books',slug:canonical[1],canonicalSeries:true};
 throw Error('Unsupported catalogue route');
}
export function resolveCatalogueVideoSource(route,root=process.cwd()) {
 root=realpathSync(root);const target=catalogueTarget(route);
 const folders=target.folder==='books'?['books','series']:['work'];
 const candidates=[];
 for(const folder of folders) {
  const directory=path.join(root,'content',folder);if(!existsSync(directory))continue;
  if(realpathSync(directory)!==directory)throw Error('Symlink source directory is not allowed');
  for(const entry of readdirSync(directory,{withFileTypes:true})) {
   if(!entry.isFile()||entry.name.startsWith('_')||!entry.name.endsWith('.md'))continue;
   const file=path.join(directory,entry.name);
   const {data}=parseMarkdownSource(readFileSync(file,'utf8'),file);
   if(target.canonicalSeries?data.canonicalPath===route:data.slug===target.slug)candidates.push(file);
  }
 }
 if(candidates.length!==1)throw Error('Expected one unambiguous existing catalogue source');
 const file=candidates[0];if(realpathSync(file)!==file)throw Error('Symlink source is not allowed');
 return file;
}
export function catalogueSourceData(source,route) {
 const target=catalogueTarget(route);
 const {data}=parseMarkdownSource(source);
 const series=target.folder==='books'&&data.type==='series';
 const canonicalMatches=!data.canonicalPath||data.canonicalPath===route||(series&&/^\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.canonicalPath||''));
 const due=data.publishedAt===undefined||Date.parse(data.publishedAt)<=Date.now();
 if((!target.canonicalSeries&&data.slug!==target.slug)||!canonicalMatches||(target.canonicalSeries&&(!series||data.canonicalPath!==route))||data.visibility!=='public'||!['live','released','building','research','archive'].includes(data.status)||(typeof data.type!=='string'||!data.type.trim())||!due)throw Error('Expected an existing public, published catalogue card');
 if(!Array.isArray(data.links))throw Error('Card links must be an array');
 return {data,target,series};
}
export function addCatalogueVideo(source,route,href,date=new Date().toISOString().slice(0,10),label=undefined) {
 const {data,target,series}=catalogueSourceData(source,route);
 if(!catalogueCardVideoId(href,target.folder))throw Error('Expected an existing /books/<slug> or /work/<slug> and a supported HTTPS YouTube video');
 const id=catalogueCardVideoId(href,target.folder);
 if(data.links.some(link=>link.type==='youtube'&&catalogueCardVideoId(link.url,target.folder)===id))return source;
 if(label!==undefined&&(typeof label!=='string'||!label.trim()))throw Error('Video label must be nonempty');
 data.updatedAt=date;
 if(publicationMetadataErrors(data).length||Date.parse(date)>Date.now())throw Error('Invalid release date');
 const position=data.links.filter(link=>link.type==='youtube'&&catalogueCardVideoId(link.url,target.folder)).length+1;
 const defaultLabel=position===1?(series?'Series trailer':target.folder==='books'?'Book trailer':'Launch video'):`${series?'Series':target.folder==='books'?'Book':'Project'} video ${position}`;
 data.links.push({type:'youtube',label:label?.trim()||defaultLabel,url:href});
 const end=source.indexOf('\n---',3);
 return '---\n'+JSON.stringify(data,null,2)+source.slice(end);
}
function main(args) {
 const write=args.at(-1)==='--write';if(write)args=args.slice(0,-1);
 if(![4,6].includes(args.length)||args[0]!=='--route'||args[2]!=='--video'||args.length===6&&args[4]!=='--label')throw Error('Expected --route <card> --video <YouTube URL> [--label <title>] [--write]; default is dry-run');
 const route=args[1],root=realpathSync(process.cwd()),file=resolveCatalogueVideoSource(route,root);
 const source=readFileSync(file,'utf8'),result=addCatalogueVideo(source,route,args[3],undefined,args[5]);
 const sha=value=>createHash('sha256').update(value).digest('hex');
 if(write&&result!==source)writeFileSync(file,result);
 console.log(JSON.stringify({route,sourceFile:path.relative(root,file),video:args[3],mode:write?'write':'dry-run',changed:result!==source,sourceSha256:sha(source),resultSha256:sha(result)}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])main(process.argv.slice(2));
