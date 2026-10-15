// One data-only addition path for existing project/book cards. No release authority.
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parseMarkdownSource } from '../src/content/markdown-source.mjs';
import { videoId } from '../src/lib/youtube-pages.mjs';
import { catalogueTypes, publicationMetadataErrors } from './publication-metadata.mjs';

export function catalogueVideoId(value) {
 try {
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.port) return null;
  let id;
  if(url.hostname==='youtu.be') id=url.pathname.match(/^\/([\w-]{11})$/)?.[1];
  else if(['youtube.com','www.youtube.com','www.youtube-nocookie.com'].includes(url.hostname)) {
   if(url.pathname==='/watch'&&url.hostname!=='www.youtube-nocookie.com') id=url.searchParams.get('v');
   else id=url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})$/)?.[1];
  }
  return id?videoId('https://www.youtube.com/watch?v='+encodeURIComponent(id)):null;
 } catch {return null;}
}
export function isCatalogueVideoAddition(previous,current) {
 const strip=data=>Object.fromEntries(Object.entries(data).filter(([key])=>!['links','updatedAt'].includes(key)));
 const before=previous.data.links||[], after=current.data.links||[];
 return Date.parse(current.data.updatedAt)>=Date.parse(previous.data.updatedAt||previous.data.publishedAt)&&Date.parse(current.data.updatedAt)<=Date.now()
  &&previous.body===current.body&&JSON.stringify(strip(previous.data))===JSON.stringify(strip(current.data))
  &&Array.isArray(before)&&Array.isArray(after)&&after.length===before.length+1
  &&JSON.stringify(after.slice(0,-1))===JSON.stringify(before)
  &&after.at(-1).type==='youtube'&&Boolean(catalogueVideoId(after.at(-1).url))
  &&!before.some(link=>link.type==='youtube'&&catalogueVideoId(link.url));
}
export function addCatalogueVideo(source,route,href,date=new Date().toISOString().slice(0,10)) {
 const match=route.match(/^\/(books|work)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
 if(!match||!catalogueVideoId(href))throw Error('Expected an existing /books/<slug> or /work/<slug> and a supported HTTPS YouTube video');
 const {data}=parseMarkdownSource(source);
 if(data.slug!==match[2]||(data.canonicalPath&&data.canonicalPath!==route)||data.visibility!=='public'||!['live','released','building','research','archive'].includes(data.status)||!catalogueTypes[match[1]].has(data.type)||!(Date.parse(data.publishedAt)<=Date.now()))throw Error('Expected an existing public, published catalogue card');
 if(!Array.isArray(data.links))throw Error('Card links must be an array');
 const current=data.links.find(link=>link.type==='youtube'&&catalogueVideoId(link.url));
 if(current) {
  if(catalogueVideoId(current.url)===catalogueVideoId(href))return source;
  throw Error('A different playable video already exists; review replacement separately');
 }
 data.updatedAt=date;
 if(publicationMetadataErrors(data).length||Date.parse(date)>Date.now())throw Error('Invalid release date');
 data.links.push({type:'youtube',label:match[1]==='books'?'Book trailer':'Launch video',url:href});
 const end=source.indexOf('\n---',3);
 return '---\n'+JSON.stringify(data,null,2)+source.slice(end);
}
function main(args) {
 const write=args.at(-1)==='--write';if(write)args=args.slice(0,-1);
 if(args.length!==4||args[0]!=='--route'||args[2]!=='--video')throw Error('Expected --route /books/<slug>|/work/<slug> --video <YouTube URL> [--write]; default is dry-run');
 const route=args[1];if(!/^\/(books|work)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route))throw Error('Unsupported catalogue route');
 const root=realpathSync(process.cwd()), file=path.join(root,'content',route+'.md');
 if(realpathSync(file)!==file)throw Error('Symlink source is not allowed');
 const source=readFileSync(file,'utf8'),result=addCatalogueVideo(source,route,args[3]);
 const sha=value=>createHash('sha256').update(value).digest('hex');
 if(write&&result!==source)writeFileSync(file,result);
 console.log(JSON.stringify({route,video:args[3],mode:write?'write':'dry-run',changed:result!==source,sourceSha256:sha(source),resultSha256:sha(result)}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])main(process.argv.slice(2));
