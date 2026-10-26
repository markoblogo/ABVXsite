import {parseMarkdownSource} from './markdown-source.mjs';
import {automaticVideoItems,isPublishedWriting,videoCompanionSnapshot,videoId} from '../lib/youtube-pages.mjs';
import {writingArchiveLastModified} from '../lib/writing-archive.mjs';
const base='https://abvx.xyz';
const cleanLinks=links=>(links||[]).filter(x=>x&&typeof x==='object'&&x.url).map(x=>({type:String(x.type||'other'),label:String(x.label||x.type||'Link'),url:String(x.url)}));
export function projectWritingIndex(sources,baseline,discovery,now=Date.now()){
 const native=sources.map(source=>({status:'archive',...parseMarkdownSource(source).data})).filter(item=>item.visibility!=='private'&&item.visibility!=='draft'&&(!item.videoUrl||isPublishedWriting(item,now)));
 const other=baseline.items.filter(item=>!['writing','video'].includes(item.type));
 const bySlug=new Map([...other.map(item=>[new URL(item.canonicalUrl).pathname.split('/').pop(),item]),...native.map(item=>[item.slug,{title:item.title,canonicalUrl:base+'/writing/'+item.slug}])]);
 const items=native.map(item=>{
  const related=[];
  for(const [slugs,relation] of [[item.relatedSlugs||[],'related'],[item.translationOf?[item.translationOf]:[],'translationOf'],[[item.primarySeriesSlug,...item.seriesSlugs||[]].filter(Boolean),'series']]){
   for(const slug of slugs){const target=bySlug.get(slug);if(target&&!related.some(x=>x.canonicalUrl===target.canonicalUrl))related.push({title:target.title,canonicalUrl:target.canonicalUrl,relation});}
  }
  if(item.collection==='kitchen-notes')related.push({title:'Kitchen Notes',canonicalUrl:base+'/writing/kitchen-notes',relation:'collection'});
  return {type:'writing',section:'writing',ecosystem:'Writing',group:item.group||item.series||null,status:item.status||null,title:item.title,summary:item.summary,
   ...(item.language?{language:item.language}:{}),...(item.translationGroup?{translationGroup:item.translationGroup}:{}),canonicalUrl:base+'/writing/'+item.slug,
   tags:(item.tags||[]).filter(x=>typeof x==='string'&&x.trim()),links:cleanLinks(item.links),publishedAt:item.publishedAt||null,updatedAt:item.updatedAt||item.publishedAt||null,related,
   ...(item.collection?{collection:item.collection}:{}),...(item.recipe?{contentType:'recipe',recipe:item.recipe}:{}),};
 });
 const videos=automaticVideoItems(discovery,native,now).map(item=>({type:'video',section:'writing',ecosystem:'Writing',group:'YouTube',status:'live',title:item.title,summary:item.excerpt||item.title,canonicalUrl:base+item.url,publishedAt:item.publishedAt,tags:['youtube','video'],links:[{type:'youtube',label:'Watch on YouTube',url:item.videoUrl}],related:[]}));
 const all=[...other,...items,...videos].map(item=>({...item})).sort((a,b)=>a.section.localeCompare(b.section)||a.title.localeCompare(b.title));
 const archive=all.find(item=>item.canonicalUrl===base+'/writing/archive');
 if(archive)archive.updatedAt=writingArchiveLastModified({items:all},discovery,archive.updatedAt);
 const videoRedirects={};
 for(const item of native.filter(item=>item.videoUrl&&isPublishedWriting(item,now))){const id=videoId(item.videoUrl);const old=baseline.videoRedirects?.[id];videoRedirects[id]=native.some(x=>x.slug===old&&videoId(x.videoUrl)===id&&isPublishedWriting(x,now))?old:(videoRedirects[id]||item.slug);}
 return {...baseline,videoCompanions:videoCompanionSnapshot(native,now),videoRedirects,items:all};
}
export function projectWritingLlms(baseline,index){
 const line=item=>`- ${item.title}\n  URL: ${item.canonicalUrl}\n  Summary: ${item.summary}\n  Group: ${item.group||item.section}${item.tags?.length?'\n  Tags: '+item.tags.slice(0,8).join(', '):''}`;
 const replace=(text,title,types)=>text.replace(new RegExp('## '+title+'\\n[\\s\\S]*?(?=\\n## |$)'),()=>`## ${title}\n\n${index.items.filter(item=>types.includes(item.type)).map(line).join('\n\n')}\n`);
 return replace(replace(baseline,'Writing: essays and field notes',['writing']),'YouTube watch pages',['video']);
}
