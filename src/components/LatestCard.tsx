import Link from 'next/link';

export default function LatestCard({
  title,
  summary,
  href,
  meta,
}: {
  title: string;
  summary: string;
  href?: string;
  meta?: string;
}) {
  const content = (
    <>
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
