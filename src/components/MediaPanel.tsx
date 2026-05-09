import type { ContentImage } from '@/content';

export default function MediaPanel({
  image,
  videoUrl,
  title,
  variant = 'project',
}: {
  image?: ContentImage;
  videoUrl?: string;
  title: string;
  variant?: 'project' | 'book' | 'writing' | 'video';
}) {
  if (videoUrl) {
    return (
      <figure className="media-panel media-panel--video">
        <iframe
          title={`${title} video`}
          src={videoUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </figure>
    );
  }

  if (!image) return null;

  return (
    <figure className={`media-panel media-panel--${variant}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.src} alt={image.alt || title} loading="lazy" />
    </figure>
  );
}
