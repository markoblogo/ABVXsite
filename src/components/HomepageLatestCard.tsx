import Link from 'next/link';
import type { ContentImage } from '@/content';

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
  const content = (
    <>
      <div className="homepage-latest-card__media" data-media-role={mediaRole}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.src} alt={image.alt || title} loading="lazy" />
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
      <a className="homepage-latest-card" href={href} target="_blank" rel="noreferrer">
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
