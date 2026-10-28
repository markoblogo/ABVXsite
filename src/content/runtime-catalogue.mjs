// Catalogue data uses the same versioned store, approval and media pipeline as Writing.
import redirects from './catalogue-redirects.json' with {type:'json'};
import {readFileSync,readdirSync} from 'node:fs';
import {parseMarkdownSource} from './markdown-source.mjs';
import {catalogueTypes,publicationMetadataErrors} from '../../scripts/publication-metadata.mjs';
import {validStatus,validLinkTypes} from '../../scripts/content-lib.mjs';
import {systemsEcosystems,bookStandaloneGroups,officialSeriesSlugs,focusGroups as baselineFocusGroups} from '../lib/catalogue-config.mjs';
const slug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function catalogueFamily(data){
 if(data.type==='catalogue-section')return 'sections';
 if(data.type==='series')return 'series';
 if(catalogueTypes.books.has(data.type))return 'books';
 if(catalogueTypes.work.has(data.type)||['index-infrastructure','ai-system','publishing-system','desktop-tool','agent-skill','device-software'].includes(data.type))return 'work';
 return null;
}
export const sectionAnchor = value=>value.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export function cataloguePath(data){const family=catalogueFamily(data);return family==='sections'?`/${data.primarySection}#${data.slug}`:`/${family==='work'?'work':'books'}/${data.slug}`;}
export function parseAcceptedCatalogue(source,now=new Date()){
 const {data,body}=parseMarkdownSource(source),family=catalogueFamily(data),errors=publicationMetadataErrors(data);
 if(!family||!slug.test(data.slug||'')||data.id!==data.slug)errors.push('Safe matching catalogue id/slug required');
 if(data.visibility!=='public'||!validStatus.has(data.status)||!body.trim()||!data.title?.trim()||!data.summary?.trim())errors.push('Complete public catalogue source required');
 if(!data.publishedAt||!Number.isFinite(Date.parse(data.publishedAt))||Date.parse(data.publishedAt)>now.valueOf())errors.push('Non-future publication date required');
 if(!['en','fr','uk'].includes(data.language||'en'))errors.push('Unsupported language');
 const sections=family==='work'?['focus','systems','books']:family==='sections'?['focus','systems','books']:['books'];
 if(!sections.includes(data.primarySection)||!Array.isArray(data.appearsIn)||!data.appearsIn.length||!data.appearsIn.every(x=>['focus','systems','books'].includes(x)))errors.push('Invalid catalogue placement');
 if(redirects.some(r=>r.source===cataloguePath(data)||r.source===cataloguePath(data)+'/'))errors.push('Catalogue path is reserved by a redirect');
 if(data.canonicalPath&&data.canonicalPath!==cataloguePath(data))errors.push('Custom catalogue routes require engineering');
 if(!Array.isArray(data.tags)||!data.tags.every(x=>typeof x==='string')||!Array.isArray(data.links))errors.push('Catalogue tags and links required');
 for(const link of data.links||[])if(!link||!validLinkTypes.has(link.type)||!link.label?.trim()||typeof link.url!=='string'||!/^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(link.url))errors.push('Invalid catalogue link');
 for(const match of body.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g))if(!/^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(match[1]))errors.push('Unsupported link protocol');
 for(const key of ['primarySeriesSlug','translationOf'])if(data[key]!=null&&!slug.test(data[key]))errors.push('Invalid '+key);
 for(const key of ['seriesSlugs','relatedSlugs','formats','availableFormats'])if(data[key]!==undefined&&(!Array.isArray(data[key])||!data[key].every(x=>typeof x==='string'&&x.trim())))errors.push('Invalid '+key);
 if(data.coverImage!==undefined||data.thumbnail!==undefined||data.illustrations!==undefined)errors.push('Catalogue uses media and heroImage');
 for(const image of [data.media,data.heroImage].filter(Boolean))if(!image.alt?.trim()||!Number.isSafeInteger(image.width)||image.width<1||!Number.isSafeInteger(image.height)||image.height<1)errors.push('Image alt and dimensions required');
 if(data.group!==undefined&&(typeof data.group!=='string'||!data.group.trim()))errors.push('Invalid group');
 if(data.sortRank!==undefined&&!Number.isFinite(data.sortRank))errors.push('Invalid rank');
 if(family==='sections'&&data.slug!==sectionAnchor(data.group||''))errors.push('Section slug must match its rendered group anchor');
 if(family==='sections'&&(!data.group?.trim()||data.primarySection==='systems'&&!data.ecosystem?.trim()))errors.push('Section group and systems ecosystem required');
 if(errors.length)throw Error(errors.join('; '));return {data,body};
}
export function readLegacyCatalogueSources(){return ['books','work','series'].flatMap(folder=>readdirSync('content/'+folder).filter(f=>f.endsWith('.md')&&!f.startsWith('_')).map(f=>readFileSync(`content/${folder}/${f}`,'utf8')));}
export function mergeCatalogueSources(snapshot,legacy){return [...Object.values(snapshot.records).map(r=>r.versions[r.currentRevision]).filter(v=>!v.withdrawn&&catalogueFamily(parseMarkdownSource(v.source).data)).map(v=>v.source),...legacy.filter(source=>!Object.hasOwn(snapshot.records,parseMarkdownSource(source).data.slug))];}
export function catalogueConfiguration(sources,managed=[]){
 const data=sources.map(s=>parseMarkdownSource(s).data).filter(d=>!['private','draft'].includes(d.visibility));
 const ecosystems=structuredClone(systemsEcosystems),bookGroups=structuredClone(bookStandaloneGroups),seriesSlugs=[...officialSeriesSlugs],focusGroups=structuredClone(baselineFocusGroups);
 for(const d of data){
  if(d.type==='series'&&managed.includes(d.slug)&&!seriesSlugs.includes(d.slug))seriesSlugs.push(d.slug);
  if(d.type!=='catalogue-section')continue;
  if(d.primarySection==='books'){if(bookGroups.some(g=>g.title===d.group))throw Error('Section already exists');bookGroups.push({title:d.group,description:d.summary,editorialSlugs:[]});}
  else if(d.primarySection==='focus'){if(focusGroups.some(g=>g.title===d.group))throw Error('Section already exists');focusGroups.push({title:d.group,description:d.summary,slugs:[],variant:'standard'});}
  else {let eco=ecosystems.find(e=>e.title===d.ecosystem);if(!eco){eco={title:d.ecosystem,description:d.summary,groups:[]};ecosystems.push(eco);}if(ecosystems.some(e=>e.groups.some(g=>g.title===d.group)))throw Error('Section already exists');eco.groups.push({title:d.group,description:d.summary,slugs:[]});}
 }
 return {ecosystems,bookGroups,seriesSlugs,focusGroups};
}
export function validateCatalogueSnapshot(snapshot,legacy){
 const sources=mergeCatalogueSources(snapshot,legacy),config=catalogueConfiguration(sources,Object.keys(snapshot.records)),data=sources.map(s=>parseMarkdownSource(s).data).filter(d=>!['private','draft'].includes(d.visibility));
 const series=new Set(data.filter(d=>d.type==='series').map(d=>d.slug));
 // Validate new records and relationships on every write, including withdrawals.
 for(const d of data){
  const r=snapshot.records[d.slug];if(!r)continue;
  if([d.primarySeriesSlug,...d.seriesSlugs||[]].filter(Boolean).some(id=>!series.has(id)))throw Error('Referenced series is not public');
  if(catalogueFamily(d)==='books'&&!d.primarySeriesSlug&&!d.seriesSlugs?.some(s=>series.has(s))&&!config.bookGroups.some(g=>g.title===d.group))throw Error('Book needs a visible series or group');
  if(catalogueFamily(d)==='work'&&d.primarySection==='books'&&!d.primarySeriesSlug&&!d.seriesSlugs?.length&&!['Publishing systems & protocols','Business, AI & Marketing'].includes(d.group)&&!d.tags?.some(t=>['book-companion','publishing','translation'].includes(t)))throw Error('Project needs a visible Books placement');
  if(catalogueFamily(d)==='work'&&d.primarySection==='focus'&&!config.focusGroups.some(g=>g.title===d.group||g.slugs.includes(d.slug)))throw Error('Project needs a visible Focus group');
  if(catalogueFamily(d)==='work'&&d.primarySection==='systems'&&!config.ecosystems.some(e=>e.groups.some(g=>g.title===d.group||g.slugs.includes(d.slug))))throw Error('Project needs a visible systems group');
 }
 // A series/section cannot be withdrawn while its published members still depend on it.
 for(const [id,r] of Object.entries(snapshot.records))if(r.versions[r.currentRevision].withdrawn){const d=parseMarkdownSource(r.versions[r.currentRevision].source).data;if(d.type==='series'&&data.some(x=>x.primarySeriesSlug===id||x.seriesSlugs?.includes(id)))throw Error('Series still has published members');if(d.type==='catalogue-section'&&data.some(x=>x.group===d.group&&x.type!=='catalogue-section'&&(x.primarySection===d.primarySection||x.appearsIn?.includes(d.primarySection))))throw Error('Section still has published members');}
}
export function projectCatalogueIndex(index,sources,snapshot){
 const owned=Object.values(snapshot.records).map(r=>parseMarkdownSource(r.versions[r.currentRevision].source).data).filter(catalogueFamily);
 const urls=new Set(owned.map(d=>'https://abvx.xyz'+cataloguePath(d)));
 const data=sources.map(s=>parseMarkdownSource(s).data).filter(d=>Object.hasOwn(snapshot.records,d.slug)&&!['private','draft'].includes(d.visibility));
 const items=data.filter(d=>d.type!=='catalogue-section').map(d=>({type:catalogueFamily(d)==='work'?'work':d.type,section:d.primarySection,ecosystem:d.primarySection==='books'?'Books':d.primarySection==='focus'?'Focus':'Systems',group:d.group||d.series||null,status:d.status,title:d.title,summary:d.summary,canonicalUrl:'https://abvx.xyz'+cataloguePath(d),publishedAt:d.publishedAt||null,updatedAt:d.updatedAt||d.publishedAt||null,language:d.language||'en',tags:d.tags||[],links:d.links||[],related:[d.primarySeriesSlug,...d.seriesSlugs||[]].filter(Boolean).map(slug=>({title:sources.map(s=>parseMarkdownSource(s).data).find(x=>x.slug===slug)?.title||slug,canonicalUrl:'https://abvx.xyz/books/'+slug,relation:'series'}))}));
 return {...index,items:[...index.items.filter(x=>!urls.has(x.canonicalUrl)),...items]};
}

export function projectCatalogueLlms(text,index,snapshot){
 const owned=Object.values(snapshot.records).map(r=>parseMarkdownSource(r.versions[r.currentRevision].source).data).filter(catalogueFamily);
 if(!owned.length)return text;
 const urls=new Set(owned.map(d=>'https://abvx.xyz'+cataloguePath(d)));
 const clean=text.split('\n\n').filter(block=>![...urls].some(url=>block.split('\n').some(line=>line.trim()==='URL: '+url))).join('\n\n');
 const items=index.items.filter(item=>urls.has(item.canonicalUrl));
 return clean+'\n\n## Live catalogue additions\n\n'+items.map(item=>`- ${item.title}\n  URL: ${item.canonicalUrl}\n  Summary: ${item.summary}\n  Group: ${item.group||item.section}`).join('\n\n')+'\n';
}
