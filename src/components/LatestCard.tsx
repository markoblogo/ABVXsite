import Link from 'next/link';
import type { ContentImage } from '@/content';

export default function LatestCard({
  title,
  summary,
  href,
  meta,
  image,
}: {
  title: string;
  summary: string;
  href?: string;
  meta?: string;
  image?: ContentImage;
}) {
  const content = (
    <>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="latest-card__image" src={image.src} alt={image.alt} loading="lazy" />
      ) : null}
      {meta ? <div className="latest-card__meta">{meta}</div> : null}
      <h3>{title}</h3>
      <p>{summary}</p>
    </>
  );

  if (!href) return <article className="latest-card">{content}</article>;

  if (href.startsWith('http')) {
    return (
      <a className="latest-card" href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link className="latest-card" href={href}>
      {content}
    </Link>
  );
}
