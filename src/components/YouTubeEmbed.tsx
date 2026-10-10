export function youtubeVideoId(href: string): string | null {
  let videoId: string | null = null;
  try {
    const url = new URL(href);
    if (url.protocol === 'https:' && url.hostname === 'www.youtube.com' && url.pathname === '/watch') videoId = url.searchParams.get('v');
  } catch {
    return null;
  }
  return videoId && /^[\w-]{11}$/.test(videoId) ? videoId : null;
}

export default function YouTubeEmbed({ href, title }: { href: string; title: string }) {
  const videoId = youtubeVideoId(href);
  if (!videoId) return null;
  return (
    <iframe
      className="youtube-embed aspect-video w-full border-0"
      src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`}
      title={title}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
    />
  );
}
