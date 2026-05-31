import Link from 'next/link';
import type { ContentImage } from '@/content';

export default function LatestCard({
  title,
  summary,
  href,
  meta,
  image,
  variant = 'project',
  cta = 'Open',
}: {
  title: string;
  summary: string;
  href?: string;
  meta?: string;
  image?: ContentImage;
  variant?: 'project' | 'book' | 'writing';
  cta?: string;
}) {
  const content = (
    <>
      <div className="latest-card__media" data-media={variant} data-media-role={image?.mediaRole || 'generic-thumbnail'}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="latest-card__image" src={image.src} alt={image.alt} loading="lazy" />
        ) : (
          <span className="latest-card__placeholder" aria-hidden="true" />
        )}
      </div>
      {meta ? <div className="latest-card__meta">{meta}</div> : null}
      <h3>{title}</h3>
      <p>{summary}</p>
      <span className="latest-card__cta">{cta}</span>
    </>
  );

  const className = 'latest-card';

  if (!href) return <article className={className}>{content}</article>;

  if (href.startsWith('http')) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {content}
    </Link>
  );
}
