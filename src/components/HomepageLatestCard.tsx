import Link from 'next/link';
import type { ContentImage } from '@/content';
import Image from 'next/image';

export default function HomepageLatestCard({
  label,
  title,
  summary,
  href,
  image,
  cta,
  detail,
}: {
  label: string;
  title: string;
  summary: string;
  href?: string;
  image?: ContentImage;
  cta: string;
  detail?: string;
}) {
  const mediaRole = image?.mediaRole || 'generic-thumbnail';
  const isRemote = image?.src?.startsWith('http://') || image?.src?.startsWith('https://');
  const width = image?.width || (mediaRole === 'book-cover' ? 1200 : 1200);
  const height = image?.height || (mediaRole === 'book-cover' ? 1600 : 675);
  const content = (
    <>
      <div className="homepage-latest-card__media" data-media-role={mediaRole}>
        {image && isRemote ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.src}
            alt={image.alt || title}
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : image ? (
          <Image
            src={image.src}
            alt={image.alt || title}
            width={width}
            height={height}
            loading="lazy"
            fetchPriority="auto"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <span className="homepage-latest-card__placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="homepage-latest-card__body">
        <div className="homepage-latest-card__meta">
          <span>{label}</span>
          {detail ? <span>{detail}</span> : null}
        </div>
        <h3>{title}</h3>
        <p>{summary}</p>
        <span className="homepage-latest-card__cta">{cta}</span>
      </div>
    </>
  );

  if (!href) return <article className="homepage-latest-card">{content}</article>;

  if (href.startsWith('http')) {
    return (
      <a className="homepage-latest-card" href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link className="homepage-latest-card" href={href}>
      {content}
    </Link>
  );
}
