import {parseMarkdownSource} from './markdown-source.mjs';
import {digest,currentSources,ValidationError} from './runtime-writing.mjs';
export const writingImages=data=>[data.media,data.heroImage,...(data.illustrations||[])].filter(Boolean);
const safeKey=/^[a-f0-9]{64}\.(png|jpe?g|webp)$/;
function dimensions(bytes,ext){
 if(ext==='png'&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes.toString('ascii',12,16)==='IHDR')return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
 if(ext==='webp'&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'){
  const type=bytes.toString('ascii',12,16);
  if(type==='VP8X')return [1+bytes.readUIntLE(24,3),1+bytes.readUIntLE(27,3)];
  if(type==='VP8L'&&bytes[20]===47){const value=bytes.readUInt32LE(21);return [1+(value&16383),1+((value>>>14)&16383)];}
  if(type==='VP8 '&&bytes[23]===157&&bytes[24]===1&&bytes[25]===42)return [bytes.readUInt16LE(26)&16383,bytes.readUInt16LE(28)&16383];
 }
 if(['jpg','jpeg'].includes(ext)&&bytes[0]===255&&bytes[1]===216){
  let i=2;while(i+8<bytes.length){if(bytes[i++]!==255)break;let marker=bytes[i++];while(marker===255)marker=bytes[i++];if([216,217].includes(marker))continue;const length=bytes.readUInt16BE(i);if(length<2)break;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker))return [bytes.readUInt16BE(i+5),bytes.readUInt16BE(i+3)];i+=length;}
 }
 throw new ValidationError('Unsupported or malformed image bytes');
}
export function createMediaPreparer(store){return async(source,assets,snapshot)=>{
 const {data}=parseMarkdownSource(source),refs=writingImages(data),mapping=[],uploads=[];
 if(!Array.isArray(assets))throw new ValidationError('Image descriptors required');
 const seen=new Set();
 for(const asset of assets){
  if(typeof asset.target!=='string'||seen.has(asset.target)||!refs.some(x=>x.src===asset.target)||!/^\/media\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/.test(asset.target))throw new ValidationError('Unreferenced, duplicate or unsafe image');
  if(typeof asset.bytesBase64!=='string'||asset.bytesBase64.length>3_000_000||!/^[A-Za-z0-9+/]*={0,2}$/.test(asset.bytesBase64))throw new ValidationError('Invalid or oversized image');
  const bytes=Buffer.from(asset.bytesBase64,'base64');
  if(!bytes.length||digest(bytes)!==asset.sha256)throw new ValidationError('Approved image hash mismatch');
  const ext=asset.target.split('.').pop(),key=asset.sha256+'.'+ext,[width,height]=dimensions(bytes,ext);
  if(width<1||height<1||width*height>32_000_000||refs.filter(x=>x.src===asset.target).some(x=>x.width!==width||x.height!==height))throw new ValidationError('Image dimensions differ from approved metadata');
  if(snapshot.legacyAssets.includes(asset.target)){seen.add(asset.target);continue;}
  const publicPath='/media/writing/runtime/'+key,contentType='image/'+(ext==='jpg'?'jpeg':ext);
  mapping.push({from:asset.target,to:publicPath,sha256:asset.sha256});uploads.push({key,bytes,contentType,publicPath,width,height});seen.add(asset.target);
 }
 // Validate every reference before any upload; drafts and arbitrary private keys never become public.
 for(const image of refs){
  if(seen.has(image.src)||snapshot.legacyAssets.includes(image.src)||Object.values(snapshot.assets).some(asset=>asset.publicPath===image.src))continue;
  if(data.videoUrl&&image.src===`https://i.ytimg.com/vi/${new URL(data.videoUrl).searchParams.get('v')}/hqdefault.jpg`)continue;
  throw new ValidationError('Unknown/unprepared image');
 }
 for(const upload of uploads){await store.putAsset(upload.key,upload.bytes,upload.contentType);snapshot.assets[upload.key]={publicPath:upload.publicPath,sha256:digest(upload.bytes),contentType:upload.contentType,width:upload.width,height:upload.height};}
 if(mapping.length){for(const image of refs){const mapped=mapping.find(x=>x.from===image.src);if(mapped)image.src=mapped.to;}const end=source.indexOf('\n---',3);source='---\n'+JSON.stringify(data,null,2)+source.slice(end);}
 return {source,mapping};
};}
export async function publishedImage(store,key){
 if(!safeKey.test(key))return null;
 const {snapshot}=await store.load(),asset=Object.hasOwn(snapshot.assets,key)?snapshot.assets[key]:null;
 if(!asset||!currentSources(snapshot).some(source=>writingImages(parseMarkdownSource(source).data).some(image=>image.src===asset.publicPath)))return null;
 const bytes=await store.getAsset(key);if(digest(bytes)!==asset.sha256)throw Error('Image integrity failed');return {bytes,contentType:asset.contentType};
}
