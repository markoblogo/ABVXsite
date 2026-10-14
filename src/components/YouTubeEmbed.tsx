export function youtubeVideoId(href: string): string | null {
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    let id: string | null = null;
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

export function findYouTubeVideo(links: readonly { type: string; url: string }[]) {
  return links.find(link => link.type === 'youtube' && youtubeVideoId(link.url));
}

export default function YouTubeEmbed({ href, title }: { href: string; title: string }) {
  const videoId = youtubeVideoId(href);
  if (!videoId) return null;
  return (
    <iframe
      className="youtube-embed aspect-video w-full border-0"
      src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`}
      width={640}
      height={360}
      title={title}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
    />
  );
}

export function YouTubeFigure({ href, title }: { href: string; title: string }) {
  if (!youtubeVideoId(href)) return null;
  return (
    <figure className="youtube-figure">
      <YouTubeEmbed href={href} title={title} />
      <figcaption><a href={href} target="_blank" rel="noopener noreferrer">Watch on YouTube →</a></figcaption>
    </figure>
  );
}
