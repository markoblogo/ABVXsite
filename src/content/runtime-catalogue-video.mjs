// A bounded video addition over the existing catalogue and versioned content store.
import {createHash} from 'node:crypto';
import {parseMarkdownSource} from './markdown-source.mjs';
import {catalogueFamily,cataloguePath,catalogueConfiguration,sectionAnchor} from './runtime-catalogue.mjs';
import {youtubeVideoId} from '../lib/youtube-url.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
export function catalogueVideoTargets(snapshot,legacySources){
 const managed=Object.values(snapshot.records).map(r=>r.versions[r.currentRevision]).filter(v=>!v.withdrawn).map(v=>v.source).filter(s=>catalogueFamily(parseMarkdownSource(s).data));
 const sources=[...managed,...legacySources.filter(s=>catalogueFamily(parseMarkdownSource(s).data)&&!Object.hasOwn(snapshot.records,parseMarkdownSource(s).data.slug))];
 const targets=sources.filter(s=>{const d=parseMarkdownSource(s).data;return d.visibility==='public'&&!['draft','private'].includes(d.status);}).map(source=>{const {data}=parseMarkdownSource(source);return {route:data.canonicalPath||cataloguePath(data),source,id:data.slug,aliases:[cataloguePath(data)]};});
 const config=catalogueConfiguration(sources,Object.keys(snapshot.records));
 const groups=[...config.bookGroups.map(g=>({g,section:'books'})),...config.focusGroups.map(g=>({g,section:'focus'})),...config.ecosystems.flatMap(e=>e.groups.map(g=>({g,section:'systems',ecosystem:e.title})))];
 for(const {g,section,ecosystem} of groups){const slug=sectionAnchor(g.title),route=`/${section}#${slug}`;if(targets.some(t=>t.route===route))continue;const id=`catalogue-${section}-${slug}`,data={id,slug:id,type:'catalogue-section',title:g.title,group:g.title,summary:g.description||g.title,primarySection:section,appearsIn:[section],visibility:'public',status:'live',language:'en',tags:[],links:[],...(ecosystem?{ecosystem}:{}),baselineGroup:true};const source='---\n'+JSON.stringify(data,null,2)+'\n---\n\n'+(g.description||g.title)+'\n';targets.push({route,source,id,group:true});}
 return targets;
}
export function prepareCatalogueVideo(command,snapshot,legacySources,time){
 if(Object.keys(command).some(k=>!['action','requestId','route','videoUrl','label','expectedRevision'].includes(k)))throw Error('Only catalogue route and video fields are allowed');
 if(!youtubeVideoId(command.videoUrl))throw Error('Supported HTTPS YouTube video required');
 if(command.label!==undefined&&(typeof command.label!=='string'||!command.label.trim()||command.label.length>200))throw Error('Video label must be nonempty and at most 200 characters');
 const found=catalogueVideoTargets(snapshot,legacySources).filter(t=>t.route===command.route||t.aliases?.includes(command.route));if(found.length!==1)throw Error('One public catalogue route required');
 const target=found[0],previous=Object.hasOwn(snapshot.records,target.id)?snapshot.records[target.id]:null;
 if(previous?.versions[previous.currentRevision].withdrawn)throw Error('Catalogue is withdrawn');
 if(command.expectedRevision!==(previous?.currentRevision||hash(target.source)))throw Error('Expected current catalogue revision required');
 const {data,body}=parseMarkdownSource(target.source);if(data.publishedAt&&Date.parse(data.publishedAt)>time.valueOf())throw Error('Catalogue is not yet public');if((data.links||[]).some(l=>l.type==='youtube'&&youtubeVideoId(l.url)===youtubeVideoId(command.videoUrl)))return {...target,previous,noop:true};
 if(!Array.isArray(data.links))throw Error('Catalogue links required');
 data.links.push({type:'youtube',label:command.label?.trim()||`${data.title} — video`,url:command.videoUrl});data.updatedAt=time.toISOString().slice(0,10);
 if(target.group)data.publishedAt=time.toISOString().slice(0,10);
 const end=target.source.indexOf('\n---',3),source='---\n'+JSON.stringify(data,null,2)+target.source.slice(end);
 if(parseMarkdownSource(source).body!==body)throw Error('Authored content changed');
 return {...target,source,baselineSource:target.source,previous,noop:false};
}
