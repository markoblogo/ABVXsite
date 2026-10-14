import { publicationMetadataErrors, catalogueTypes } from './publication-metadata.mjs';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { parseMarkdownSource } from '../src/content/markdown-source.mjs';
import { validLinkTypes, validStatus } from './content-lib.mjs';
import { safePublicationTarget, planApprovedMedia } from './publication-media.mjs';

// Reuse the approved-source/media/atomic-write path; never synthesize product facts.
export function planCatalogue(packet, root=process.cwd()) {
 const folder=packet.surface;
 const operation=folder==='work'?'abvx.publish-project':'abvx.publish-book';
 const source=packet.payload?.source_markdown;
 if(packet.schema_version!=='v1'||packet.mode!=='REPORT_ONLY_HANDOFF'||packet.project!=='abvxsite'
   ||!['work','books'].includes(folder)||packet.consumer_operation?.id!==operation
   ||!(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).test(packet.slug||'')) throw Error('Invalid catalogue packet target');
 if(typeof source!=='string'||createHash('sha256').update(source).digest('hex')!==packet.payload.source_sha256) throw Error('Complete approved catalogue source and matching hash required');
 const {data,body}=parseMarkdownSource(source);
 const errors=publicationMetadataErrors(data);if(errors.length) throw Error(errors.join('; '));
 if(data.slug!==packet.slug||data.id!==packet.slug||data.title!==packet.title||data.type!==packet.kind
   ||!Array.isArray(packet.payload.body_lines)||body!==packet.payload.body_lines.join('\n\n')
   ||data.publishedAt!==packet.payload.date_published) throw Error('Catalogue packet conflicts with approved source');
 if(!body||data.visibility!=='public'||!validStatus.has(data.status)||!(Date.parse(data.publishedAt)<=Date.now())) throw Error('Ready public catalogue source required');
 for(const field of ['title','summary','seoTitle','seoDescription']) if((['title','summary'].includes(field)||data[field]!==undefined)&&(typeof data[field]!=='string'||!data[field].trim())) throw Error(`Invalid catalogue ${field}`);
 if(!Array.isArray(data.tags)||!data.tags.every(t=>typeof t==='string')||!Array.isArray(data.links)) throw Error('Catalogue tags and links required');
 for(const link of data.links) {
  if(!link||!validLinkTypes.has(link.type)||typeof link.label!=='string'||!link.label.trim()||typeof link.url!=='string'||!link.url.trim()) throw Error('Invalid catalogue link');
  if(!link.url.startsWith('/')&&!['https:','http:','mailto:'].includes(new URL(link.url).protocol)) throw Error('Invalid catalogue link URL');
 }
 const section=folder==='books'?'books':'systems';
 if((data.primarySection||section)!==section||(data.appearsIn||[section]).some(value=>value!==section)) throw Error('New catalogue placement needs a separate engineering release');
 if(!catalogueTypes[folder].has(data.type)) throw Error('New catalogue types need a separate engineering release');
 if(data.canonicalPath&&data.canonicalPath!==`/${folder}/${data.slug}`) throw Error('Custom routes need a separate engineering release');
 const targetFile=safePublicationTarget(root,`content/${folder}/${data.slug}.md`);
 if(existsSync(targetFile)) throw Error('Refusing to overwrite existing catalogue item');
 const images=[data.media,data.heroImage].filter(Boolean);
 for(const image of images) if(typeof image.src!=='string'||!image.src.startsWith('/media/')||!image.alt||!(image.width>0)||!(image.height>0)) throw Error('Catalogue images require local paths, alt text and positive dimensions');
 const media=planApprovedMedia(new Set(images.map(image=>image.src)),packet.payload.media_assets,root);
 return {source,targetFile,media,report:{operation,targetFile,slug:data.slug,title:data.title,media:media.map(({target,reused})=>({target,reused}))}};
}
