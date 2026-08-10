import Link from 'next/link';

export default function WritingArchiveRow({
  title,
  excerpt,
  href,
  source,
  date,
}: {
  title: string;
  excerpt?: string;
  href: string;
  source: string;
  date?: string;
}) {
  const internal = href.startsWith('/');
  const target = internal ? undefined : '_blank';
  const rel = internal ? undefined : 'noopener noreferrer';
  return (
    <article className="writing-archive-row">
      <div className="writing-archive-row__meta">
        {source}
        {date ? ` / ${date}` : ''}
      </div>
      <Link href={href} target={target} rel={rel} aria-label={`Read ${title}`}>
        <span>{title}</span>
        <span aria-hidden="true">-&gt;</span>
      </Link>
      {excerpt ? <p>{excerpt}</p> : null}
    </article>
  );
}
