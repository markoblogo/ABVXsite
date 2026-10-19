/** @param {string} href */
export function youtubeVideoId(href) {
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    let id = null;
    if (url.hostname === 'youtu.be' && /^\/[\w-]{11}$/.test(url.pathname)) id = url.pathname.slice(1);
    if (['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname)) {
      if (url.pathname === '/watch' && url.hostname !== 'www.youtube-nocookie.com') id = url.searchParams.get('v');
      else id = url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})$/)?.[1] || null;
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** @template {{type:string,url:string}} T @param {readonly T[]} links @returns {T[]} */
export function findYouTubeVideos(links) {
 const seen=new Set();
 return links.filter(link=>{
  const id=link.type==='youtube'?youtubeVideoId(link.url):null;
  if(!id||seen.has(id))return false;
  seen.add(id);return true;
 });
}
