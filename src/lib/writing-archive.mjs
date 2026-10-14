// The deployed discovery snapshot owns membership. This does not activate
// future content or duplicate the external feeds behind the recent-post window.
import {writingUrlKey} from './writing-chronology.mjs';

/** @param {{type:string,canonicalUrl:string}} item */
function archiveMember(item) {
 return ['writing','video','working-story'].includes(item.type)&&item.canonicalUrl?.startsWith('https://abvx.xyz/writing/');
}

/** @param {{items:Array<{type:string,canonicalUrl:string,updatedAt?:string|null,publishedAt?:string,links?:Array<{type:string,url:string}>}>}} index
 * @param {{items:Array<{url:string,addedAt:string}>}} discovery @param {string} pageDate */
export function writingArchiveLastModified(index,discovery,pageDate) {
 const additions=new Map(discovery.items.map(item=>[writingUrlKey(item.url),item.addedAt]));
 const dates=[pageDate];
 for(const item of index.items.filter(archiveMember)) {
  const route=new URL(item.canonicalUrl).pathname;
  const id=item.type==='video'?route.match(/^\/writing\/videos\/([A-Za-z0-9_-]{11})$/)?.[1]:null;
  const key=id?writingUrlKey('https://www.youtube.com/watch?v='+id):route;
  dates.push(item.updatedAt||item.publishedAt,additions.get(key));
 }
 return dates.filter(value=>Number.isFinite(Date.parse(value))).sort((a,b)=>Date.parse(b)-Date.parse(a))[0];
}
/** @param {{items: Array<{type: string, canonicalUrl: string, title: string}>}} index */
export function writingArchiveItems(index) {
 return index.items.filter(archiveMember)
  .map(item=>({title:item.title,url:new URL(item.canonicalUrl).pathname,source:item.type==='video'?'youtube':'abvx'}))
  .sort((a,b)=>a.title.localeCompare(b.title)||a.url.localeCompare(b.url));
}
