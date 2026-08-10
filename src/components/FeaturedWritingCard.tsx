import type { ContentImage } from '@/content';
import Link from 'next/link';
import MediaPanel from './MediaPanel';
import { formatWritingSourceLabel } from './writing-source-label';

export default function FeaturedWritingCard({
  title,
  excerpt,
  asideExcerpt,
  href,
  source,
  date,
  image,
}: {
  title: string;
  excerpt: string;
  asideExcerpt?: string;
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
    <article className={`featured-writing-card${image ? '' : ' featured-writing-card--text-only'}`}>
      {image ? (
        <Link
          className="featured-writing-card__media"
          href={href}
          target={target}
          rel={rel}
          aria-label={`Read featured essay: ${title}`}
        >
          <MediaPanel image={image} title={title} variant="writing" />
        </Link>
      ) : null}
      <div className="featured-writing-card__body">
        <div className="featured-writing-card__copy">
          <div className="catalogue-card__meta">
            {sourceLabel}
            {date ? ` / ${date}` : ''}
          </div>
          <h2>
            <Link href={href} target={target} rel={rel}>
              {title}
            </Link>
          </h2>
          <p>{excerpt}</p>
          <Link className="writing-read-link" href={href} target={target} rel={rel}>
            Read essay -&gt;
          </Link>
        </div>
        {!image && asideExcerpt ? (
          <div className="featured-writing-card__aside">
            <p>{asideExcerpt}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
