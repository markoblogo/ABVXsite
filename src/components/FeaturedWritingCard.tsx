import type { ContentImage } from '@/content';
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
  return (
    <article className="featured-writing-card">
      <a
        className="featured-writing-card__media"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Read featured essay: ${title}`}
      >
        {image ? (
          <MediaPanel image={image} title={title} variant="writing" />
        ) : (
          <WritingPlaceholder />
        )}
      </a>
      <div className="featured-writing-card__body">
        <div className="catalogue-card__meta">
          {source}
          {date ? ` / ${date}` : ''}
        </div>
        <h2>
          <a href={href} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
        </h2>
        <p>{excerpt}</p>
        <a className="writing-read-link" href={href} target="_blank" rel="noopener noreferrer">
          Read essay -&gt;
        </a>
      </div>
    </article>
  );
}
