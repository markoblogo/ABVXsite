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
  return (
    <article className="writing-archive-row">
      <div className="writing-archive-row__meta">
        {source}
        {date ? ` / ${date}` : ''}
      </div>
      <a href={href} target="_blank" rel="noreferrer" aria-label={`Read ${title}`}>
        <span>{title}</span>
        <span aria-hidden="true">-&gt;</span>
      </a>
      {excerpt ? <p>{excerpt}</p> : null}
    </article>
  );
}
