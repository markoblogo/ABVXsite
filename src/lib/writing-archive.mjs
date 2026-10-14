// The deployed discovery snapshot owns membership. This does not activate
// future content or duplicate the external feeds behind the recent-post window.
/** @param {{items: Array<{type: string, canonicalUrl: string, title: string}>}} index */
export function writingArchiveItems(index) {
 return index.items.filter(item=>['writing','video','working-story'].includes(item.type)
   && item.canonicalUrl?.startsWith('https://abvx.xyz/writing/'))
  .map(item=>({title:item.title,url:new URL(item.canonicalUrl).pathname,source:item.type==='video'?'youtube':'abvx'}))
  .sort((a,b)=>a.title.localeCompare(b.title)||a.url.localeCompare(b.url));
}
