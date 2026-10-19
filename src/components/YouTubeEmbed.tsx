import { youtubeVideoId, findYouTubeVideos } from '../lib/youtube-url.mjs';
export { youtubeVideoId, findYouTubeVideos } from '../lib/youtube-url.mjs';

export function findYouTubeVideo(links: readonly { type: string; url: string }[]) {
  return findYouTubeVideos(links)[0];
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

export function YouTubeGallery({ links, title }: { links: readonly { type: string; url: string; label?: string }[]; title: string }) {
  const videos = findYouTubeVideos(links);
  if (!videos.length) return null;
  return (
    <div className={`catalogue-video-gallery${videos.length === 1 ? ' catalogue-video-gallery--single' : ''}`}>
      {videos.map((video, index) => {
        const label = video.label?.trim() || `Video ${index + 1}`;
        return (
          <div className="catalogue-video-gallery__item" key={video.url}>
            <h3>{label}</h3>
            <YouTubeFigure href={video.url} title={`${title} — ${label}`} />
          </div>
        );
      })}
    </div>
  );
}
