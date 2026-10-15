// Additive media uses the existing source resolver, renderer and release gates.
import {isDeepStrictEqual} from 'node:util';
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {parseMarkdownSource} from '../src/content/markdown-source.mjs';
import {publicationMetadataErrors} from './publication-metadata.mjs';
import {addCatalogueVideo,catalogueSourceData,catalogueCardVideoId,resolveCatalogueVideoSource} from './catalogue-video.mjs';
const imageKeys=['media','heroImage'];
const extensions={pdf:/\.pdf$/i,epub:/\.epub$/i,audio:/\.(?:mp3|m4a|ogg|wav|flac|aac|opus)$/i,audiobook:/\.(?:m4b|mp3|m4a)$/i,image:/\.(?:png|jpe?g|webp)$/i};
export function validCatalogueMedia(link,folder='work') {
 if(!link||typeof link.label!=='string'||!link.label.trim()||typeof link.url!=='string')return false;
 if(link.type==='youtube')return Boolean(catalogueCardVideoId(link.url,folder));
 if(!extensions[link.type])return false;
 try {
  const url=new URL(link.url,'https://abvx.xyz');
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash)return false;
  if(!link.url.startsWith('https://')&&(!link.url.startsWith('/media/')||link.url.startsWith('//')||link.url.includes('\\')||decodeURIComponent(link.url).split(/[/?#]/).some(part=>part==='.'||part==='..')))return false;
  return extensions[link.type].test(url.pathname);
 }catch{return false;}
}
export function isCatalogueMediaAddition(previous,current,folder='work') {
 const before=previous.data,after=current.data;
 const strip=data=>Object.fromEntries(Object.entries(data).filter(([key])=>!['links','updatedAt',...imageKeys].includes(key)));
 if(previous.body!==current.body||!isDeepStrictEqual(strip(before),strip(after))||after.visibility!=='public'||!['live','released','building','research','archive'].includes(after.status)||publicationMetadataErrors(after).length||!after.updatedAt||Date.parse(after.updatedAt)>Date.now()||Date.parse(after.updatedAt)<Date.parse(before.updatedAt||before.publishedAt||'1970-01-01'))return false;
 if(!Array.isArray(before.links)||!Array.isArray(after.links)||after.links.length<before.links.length||!isDeepStrictEqual(after.links.slice(0,before.links.length),before.links))return false;
 const additions=after.links.slice(before.links.length);
 if(!additions.every(link=>validCatalogueMedia(link,folder)))return false;
 for(const type of ['youtube','audio']){
  const added=additions.filter(link=>link.type===type);
  if(added.length>1||added.length&&before.links.some(link=>link.type===type&&(type!=='youtube'||catalogueCardVideoId(link.url,folder))))return false;
 }
 if(new Set(after.links.map(link=>link.url)).size!==new Set(before.links.map(link=>link.url)).size+additions.length)return false;
 const changed=imageKeys.filter(key=>!isDeepStrictEqual(before[key],after[key]));
 if(changed.length){
  if(changed.length!==1||before.media||before.heroImage||before.coverImage)return false;
  const image=after[changed[0]];
  if(!image||!validCatalogueMedia({type:'image',url:image.src,label:image.alt},folder))return false;
 }
 return additions.length>0||changed.length>0;
}
export function addCatalogueMedia(source,route,descriptor,date=new Date().toISOString().slice(0,10)) {
 const {data,target}=catalogueSourceData(source,route);
 if(!validCatalogueMedia(descriptor,target.folder))throw Error('Unsupported media descriptor: use a labelled HTTPS or /media/ file URL');
 if(descriptor.type==='youtube'){
  const result=addCatalogueVideo(source,route,descriptor.url,date);
  if(result===source)return source;
  const {data:added}=parseMarkdownSource(result);added.links.at(-1).label=descriptor.label;
  return '---\n'+JSON.stringify(added,null,2)+result.slice(result.indexOf('\n---',3));
 }
 if(descriptor.type==='image'){
  if(data.media?.src===descriptor.url&&data.media.alt===descriptor.label)return source;
  if(data.media||data.heroImage||data.coverImage)throw Error('Existing image replacement requires separate review');
  data.media={src:descriptor.url,alt:descriptor.label};
 }else{
  if(data.links.some(link=>link.type===descriptor.type&&link.url===descriptor.url))return source;
  if(descriptor.type==='audio'&&data.links.some(link=>link.type==='audio'))throw Error('Existing audio replacement requires separate review');
  data.links.push({type:descriptor.type,label:descriptor.label,url:descriptor.url});
 }
 data.updatedAt=date;
 const end=source.indexOf('\n---',3),result='---\n'+JSON.stringify(data,null,2)+source.slice(end);
 if(!isCatalogueMediaAddition(parseMarkdownSource(source),parseMarkdownSource(result),target.folder))throw Error('Media update must preserve the approved source and valid release dates');
 return result;
}
function main(args){
 const write=args.at(-1)==='--write';if(write)args=args.slice(0,-1);
 if(args.length!==8||args[0]!=='--route'||args[2]!=='--type'||args[4]!=='--url'||args[6]!=='--label')throw Error('Expected --route <card> --type youtube|image|pdf|epub|audio|audiobook --url <URL> --label <text> [--write]');
 const route=args[1],file=resolveCatalogueVideoSource(route),source=readFileSync(file,'utf8');
 const result=addCatalogueMedia(source,route,{type:args[3],url:args[5],label:args[7]});
 if(write&&result!==source)writeFileSync(file,result);
 const sha=value=>createHash('sha256').update(value).digest('hex');
 console.log(JSON.stringify({route,sourceFile:path.relative(realpathSync(process.cwd()),file),mode:write?'write':'dry-run',changed:result!==source,sourceSha256:sha(source),resultSha256:sha(result)}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])main(process.argv.slice(2));
