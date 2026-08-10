import type { ContentImage } from '@/content';
import Link from 'next/link';
import MediaPanel from './MediaPanel';

function WritingPlaceholder() {
  return <span className="writing-image-placeholder" aria-hidden="true" />;
}

export default function RecentWritingCard({
  title,
  excerpt,
  href,
  source,
  date,
  image,
}: {
  title: string;
  excerpt: string;
  href: string;
  source: string;
  date?: string;
  image?: ContentImage;
}) {
  const internal = href.startsWith('/');
  const target = internal ? undefined : '_blank';
  const rel = internal ? undefined : 'noopener noreferrer';
  return (
    <article className="recent-writing-card">
      <Link
        className="recent-writing-card__media"
        href={href}
        target={target}
        rel={rel}
        aria-label={`Read ${title}`}
      >
        {image ? (
          <MediaPanel image={image} title={title} variant="writing" />
        ) : (
          <WritingPlaceholder />
        )}
      </Link>
      <div className="recent-writing-card__body">
        <div className="catalogue-card__meta">
          {source}
          {date ? ` / ${date}` : ''}
        </div>
        <h3>
          <Link href={href} target={target} rel={rel}>
            {title}
          </Link>
        </h3>
        <p>{excerpt}</p>
        <Link className="writing-read-link" href={href} target={target} rel={rel}>
          Read -&gt;
        </Link>
      </div>
    </article>
  );
}
