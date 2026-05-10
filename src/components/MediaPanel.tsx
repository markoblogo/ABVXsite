import type { ContentImage } from '@/content';

function roleFor(image: ContentImage | undefined, variant: string) {
  if (image?.mediaRole) return image.mediaRole;
  if (variant === 'book') return 'mockup';
  if (variant === 'writing') return 'rss-image';
  return 'project-screenshot';
}

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
  const role = roleFor(image, variant);
  const isBook = role === 'book-cover' || variant === 'book';
  const width = image.width || (isBook ? 1200 : 1200);
  const height = image.height || (isBook ? 1600 : 630);

  return (
    <figure className={`media-panel media-panel--${variant}`} data-media-role={role}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.src} alt={image.alt || title} width={width} height={height} loading="lazy" />
    </figure>
  );
}
