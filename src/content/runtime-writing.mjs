import {catalogueFamily,cataloguePath,parseAcceptedCatalogue,validateCatalogueSnapshot} from './runtime-catalogue.mjs';
// Data publication engine. No Git, build, code execution, network fetch or account settings.
import {createHash, randomUUID} from 'node:crypto';
import {parseMarkdownSource} from './markdown-source.mjs';
import {validateKitchenNotes} from './kitchen-notes.mjs';
import {validateWritingIllustrations} from './writing-illustrations.mjs';
import {validateNativeWritingVideo} from './native-writing-video.mjs';
import {parseAcceptedWorkingStory} from './runtime-working-stories.mjs';
import {publicationMetadataErrors} from '../../scripts/publication-metadata.mjs';
export const digest = value => createHash('sha256').update(value).digest('hex');
export class ConflictError extends Error { constructor(message){super(message);this.name='ConflictError';} }
export class ValidationError extends Error { constructor(message){super(message);this.name='ValidationError';} }
export const emptySnapshot = () => ({schemaVersion:1,revision:'empty',records:{},requests:{},assets:{},legacyAssets:[]});
const own = (value, key) => Object.hasOwn(value, key) ? value[key] : undefined;
const images = data => [data.media,data.heroImage,...(data.type==='working-story'?[data.coverImage]:[]),...(data.illustrations||[])].filter(Boolean);
const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const reserved=new Set(['archive','kitchen-notes','working-stories','videos','feed']);
export function parseAcceptedSource(source,now=new Date(),allowUndated=false){
 if(typeof source!=='string'||Buffer.byteLength(source)>512_000)throw new ValidationError('Complete source up to 512 KB required');
 const {data,body}=parseMarkdownSource(source);
 if(catalogueFamily(data)){try{return parseAcceptedCatalogue(source,now);}catch(error){throw new ValidationError(error.message);}}
 if(data.type==='working-story'){try{return parseAcceptedWorkingStory(source,now);}catch(error){throw new ValidationError(error.message);}}
 if(!slugPattern.test(data.slug||'')||reserved.has(data.slug)||data.id!==data.slug)throw new ValidationError('Safe, non-reserved matching id/slug required');
 if(!body.trim()||!data.title?.trim()||!data.summary?.trim()||data.primarySection!=='writing'||data.visibility!=='public'||data.status!=='live'||!['note','article','review','build_log','other','recipe'].includes(data.type))throw new ValidationError('Ready public Writing source required');
 if(data.coverImage!==undefined)throw new ValidationError('Native Writing coverImage is not rendered; use media or heroImage');
 if(data.canonicalPath&&data.canonicalPath!=='/writing/'+data.slug)throw new ValidationError('Canonical route cannot change');
 if(!['en','fr','uk'].includes(data.language||'en')||!Array.isArray(data.tags)||!data.tags.every(x=>typeof x==='string')||!Array.isArray(data.links))throw new ValidationError('Invalid metadata');
 for(const key of ['relatedSlugs','seriesSlugs'])if(data[key]!==undefined&&(!Array.isArray(data[key])||!data[key].every(value=>typeof value==='string'&&slugPattern.test(value))))throw new ValidationError(key+' must contain safe slugs');
 for(const key of ['primarySeriesSlug','translationOf'])if(data[key]!==undefined&&(typeof data[key]!=='string'||!slugPattern.test(data[key])))throw new ValidationError(key+' must be a safe slug');
 for(const key of ['group','series','translationGroup'])if(data[key]!==undefined&&(typeof data[key]!=='string'||!data[key].trim()))throw new ValidationError(key+' must be text');
 if((!data.publishedAt&&!allowUndated)||data.publishedAt&&(!Number.isFinite(Date.parse(data.publishedAt))||Date.parse(data.publishedAt)>now.valueOf()))throw new ValidationError('Non-future publication date required');
 for(const match of body.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g))if(!/^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(match[1]))throw new ValidationError('Unsupported link protocol');
 for(const link of data.links)if(!link||typeof link.url!=='string'||!/^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(link.url))throw new ValidationError('Invalid metadata link');
 const errors=[...publicationMetadataErrors(data),...validateKitchenNotes(data,body),...validateWritingIllustrations(data,body),...validateNativeWritingVideo(data)];
 if(errors.length)throw new ValidationError(errors.join('; '));
 for(const image of images(data))if(!image.alt?.trim()||!Number.isSafeInteger(image.width)||image.width<1||!Number.isSafeInteger(image.height)||image.height<1)throw new ValidationError('Image alt and dimensions required');
 return {data,body};
}
export function seedSnapshot(sources,discovery={items:[]}){
 const snapshot=emptySnapshot();snapshot.revision='seed-'+digest(JSON.stringify(sources));
 for(const source of sources){const {data}=parseMarkdownSource(source);const id=data.slug;if(!slugPattern.test(id)||own(snapshot.records,id))throw new ValidationError('Duplicate/invalid seed slug');const revision=digest(source);snapshot.records[id]={currentRevision:revision,firstAddedAt:discovery.items.find(item=>item.url==='/writing/'+id)?.addedAt??null,firstPublishedAt:data.publishedAt??null,versions:{[revision]:{source,sourceSha256:revision,revision,withdrawn:false,storedAt:null}}};for(const image of images(data))if(image.src?.startsWith('/media/'))snapshot.legacyAssets.push(image.src);}
 snapshot.legacyAssets=[...new Set(snapshot.legacyAssets)];return snapshot;
}
export function currentSources(snapshot){return Object.values(snapshot.records).map(record=>record.versions[record.currentRevision]).filter(v=>!v.withdrawn).map(v=>v.source);}
export function explicitlyPublishedSlugs(snapshot){
 return Object.entries(snapshot.records).filter(([,record])=>{const version=record.versions[record.currentRevision];return !version.withdrawn&&Boolean(version.storedAt);}).map(([slug])=>slug);
}
export function mergeWritingSources(snapshot,legacySources){
 return [...currentSources(snapshot).filter(source=>parseMarkdownSource(source).data.type!=='working-story'&&!catalogueFamily(parseMarkdownSource(source).data)),...legacySources.filter(source=>parseMarkdownSource(source).data.type!=='working-story'&&!catalogueFamily(parseMarkdownSource(source).data)).filter(source=>!Object.hasOwn(snapshot.records,parseMarkdownSource(source).data.slug))];
}
export function assertSnapshot(snapshot){
 if(snapshot?.schemaVersion!==1||!snapshot.revision||!snapshot.records||!snapshot.requests||!snapshot.assets||!Array.isArray(snapshot.legacyAssets))throw new ValidationError('Invalid content snapshot');
 for(const [slug,record] of Object.entries(snapshot.records)){if(!slugPattern.test(slug)||!record.versions?.[record.currentRevision])throw new ValidationError('Invalid content record');for(const version of Object.values(record.versions)){if(digest(version.source)!==version.sourceSha256||parseMarkdownSource(version.source).data.slug!==slug)throw new ValidationError('Content source integrity failed');}}
 return snapshot;
}
export function createPublisher({store,context={},validateSnapshot=()=>{},legacySources=/** @type {string[]} */([]),now=()=>new Date(),prepareMedia=async(source,assets,snapshot)=>{if(assets?.length)throw new ValidationError('Media uploader is not configured');const {data}=parseMarkdownSource(source);for(const image of images(data))if(!snapshot.legacyAssets.includes(image.src)&&!Object.values(snapshot.assets).some(a=>a.publicPath===image.src)&&!(data.videoUrl&&image.src===`https://i.ytimg.com/vi/${new URL(data.videoUrl).searchParams.get('v')}/hqdefault.jpg`))throw new ValidationError('Unknown/unprepared image');return {source,mapping:[]};}}){
 return async command=>{
  if(!command||!['publish','update','rollback','unpublish'].includes(command.action)||(!/^[a-zA-Z0-9_-]{1,120}$/.test(command.requestId||'')||['__proto__','prototype'].includes(command.requestId)))throw new ValidationError('Action and unique requestId required');
  const requestHash=digest(JSON.stringify(command));const loaded=await store.load();const snapshot=assertSnapshot(loaded.snapshot);
  if(own(snapshot.requests,command.requestId)){const saved=own(snapshot.requests,command.requestId);if(saved.hash!==requestHash)throw new ConflictError('Request ID reused with different content');return saved.receipt;}
  const id=command.action==='publish'||command.action==='update'?parseMarkdownSource(command.source).data.slug:command.id;
  if(!slugPattern.test(id||'')||reserved.has(id))throw new ValidationError('Invalid id');
  const previous=own(snapshot.records,id);
  if(command.action==='publish'&&(previous||legacySources.some(source=>parseMarkdownSource(source).data.slug===id)))throw new ConflictError('Content already exists; use update');
  if(['publish','update'].includes(command.action)){const proposed=parseMarkdownSource(command.source).data;if(proposed.type==='working-story'&&[...Object.values(snapshot.records).map(record=>record.versions[record.currentRevision].source),...legacySources].some(source=>{const d=parseMarkdownSource(source).data;return d.slug!==id&&d.story_id===proposed.story_id;}))throw new ConflictError('Story ID already exists');}
  if(command.action!=='publish'&&(!previous||command.expectedRevision!==previous.currentRevision))throw new ConflictError('Expected current content revision required');
  const time=now(),storedAt=time.toISOString(),revision=randomUUID();let source;
  if(command.action==='rollback'){const old=own(previous.versions,command.toRevision);if(!old||old.withdrawn)throw new ValidationError('Known published revision required');source=old.source;}
  else source=command.action==='unpublish'?previous.versions[previous.currentRevision].source:command.source;
  const originalHash=digest(source);let mapping=[];
  if(['publish','update'].includes(command.action)){
   const parsed=parseAcceptedSource(source,time,Boolean(previous&&previous.firstPublishedAt===null));
   if(previous&&catalogueFamily(parsed.data)&&parseMarkdownSource(previous.versions[previous.currentRevision].source).data.primarySection!==parsed.data.primarySection)throw new ValidationError('Primary section is immutable');
   if(previous&&parseMarkdownSource(previous.versions[previous.currentRevision].source).data.type!==parsed.data.type)throw new ValidationError('Content type is immutable');
   if(previous&&parsed.data.type==='working-story'&&parseMarkdownSource(previous.versions[previous.currentRevision].source).data.story_id!==parsed.data.story_id)throw new ValidationError('Story ID is immutable');
   if(previous&&(parsed.data.date??parsed.data.publishedAt??null)!==previous.firstPublishedAt)throw new ValidationError('First publication date is immutable');
   const prepared=await prepareMedia(source,command.assets||[],snapshot);source=prepared.source;mapping=prepared.mapping;
   if(parseMarkdownSource(source).body!==parsed.body)throw new ValidationError('Media preparation changed authored prose');
  }
  const {data,body}=parseMarkdownSource(source),sourceSha256=digest(source);
  if(command.action==='rollback'&&(Date.parse(data.date||data.publishedAt)>time.valueOf()||validateNativeWritingVideo(data,time.valueOf()).length))throw new ValidationError('Rollback requires a non-future eligible source');const version={source,sourceSha256,revision,withdrawn:command.action==='unpublish',storedAt};
  snapshot.records[id]={firstAddedAt:previous?previous.firstAddedAt??null:storedAt,firstPublishedAt:previous?previous.firstPublishedAt:data.date??data.publishedAt??null,currentRevision:revision,versions:{...previous?.versions,[revision]:version}};
  snapshot.revision=randomUUID();const receipt={...context,schemaVersion:1,profile:'runtime-writing-v1',status:'STORED',action:command.action,requestId:command.requestId,id,canonicalUrl:'https://abvx.xyz'+(catalogueFamily(data)?cataloguePath(data):'/writing/'+(data.type==='working-story'?'working-stories/':'')+id),revision,snapshotRevision:snapshot.revision,originalSourceSha256:originalHash,sourceSha256,bodySha256:digest(body),storedAt,firstAddedAt:snapshot.records[id].firstAddedAt,firstPublishedAt:snapshot.records[id].firstPublishedAt,mediaMapping:mapping,...(command.approval?{approval:command.approval}:{})};
  snapshot.requests[command.requestId]={hash:requestHash,receipt};try{validateCatalogueSnapshot(snapshot,legacySources.filter(s=>catalogueFamily(parseMarkdownSource(s).data)));}catch(error){throw new ValidationError(error.message);}
  await validateSnapshot(snapshot);await store.commit(snapshot,loaded.etag);return receipt;
 };
}
