import type { ContentImage } from '@/content';
import Link from 'next/link';
import MediaPanel from './MediaPanel';

function WritingPlaceholder() {
  return <span className="writing-image-placeholder" aria-hidden="true" />;
}

export default function FeaturedWritingCard({
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
    <article className="featured-writing-card">
      <Link
        className="featured-writing-card__media"
        href={href}
        target={target}
        rel={rel}
        aria-label={`Read featured essay: ${title}`}
      >
        {image ? (
          <MediaPanel image={image} title={title} variant="writing" />
        ) : (
          <WritingPlaceholder />
        )}
      </Link>
      <div className="featured-writing-card__body">
        <div className="catalogue-card__meta">
          {source}
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
    </article>
  );
}
