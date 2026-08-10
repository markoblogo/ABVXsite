import type { ContentImage } from '@/content';
import Link from 'next/link';
import MediaPanel from './MediaPanel';
import { formatWritingSourceLabel } from './writing-source-label';

export default function RecentWritingCard({
  title,
  excerpt,
  bodyExcerpt,
  href,
  source,
  date,
  image,
}: {
  title: string;
  excerpt: string;
  bodyExcerpt?: string;
  href: string;
  source: string;
  date?: string;
  image?: ContentImage;
}) {
  const internal = href.startsWith('/');
  const target = internal ? undefined : '_blank';
  const rel = internal ? undefined : 'noopener noreferrer';
  const sourceLabel = formatWritingSourceLabel(source);
  return (
    <article className={`recent-writing-card${image ? '' : ' recent-writing-card--text-only'}`}>
      {image ? (
        <Link
          className="recent-writing-card__media"
          href={href}
          target={target}
          rel={rel}
          aria-label={`Read ${title}`}
        >
          <MediaPanel image={image} title={title} variant="writing" />
        </Link>
      ) : null}
      <div className="recent-writing-card__body">
        <div className="catalogue-card__meta">
          {sourceLabel}
          {date ? ` / ${date}` : ''}
        </div>
        <h3>
          <Link href={href} target={target} rel={rel}>
            {title}
          </Link>
        </h3>
        <p>{excerpt}</p>
        {!image && bodyExcerpt ? <p className="recent-writing-card__body-excerpt">{bodyExcerpt}</p> : null}
        <Link className="writing-read-link" href={href} target={target} rel={rel}>
          Read -&gt;
        </Link>
      </div>
    </article>
  );
}
