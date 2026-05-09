import Link from 'next/link';
import type { ContentImage } from '@/content';

export default function LatestCard({
  title,
  summary,
  href,
  meta,
  image,
  variant = 'project',
}: {
  title: string;
  summary: string;
  href?: string;
  meta?: string;
  image?: ContentImage;
  variant?: 'project' | 'book' | 'writing';
}) {
  const content = (
    <>
      {image ? (
        <div className="latest-card__media" data-media={variant}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="latest-card__image" src={image.src} alt={image.alt} loading="lazy" />
        </div>
      ) : null}
      {meta ? <div className="latest-card__meta">{meta}</div> : null}
      <h3>{title}</h3>
      <p>{summary}</p>
    </>
  );

  const className = `latest-card latest-card--${variant}`;

  if (!href) return <article className={className}>{content}</article>;

  if (href.startsWith('http')) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer">
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
