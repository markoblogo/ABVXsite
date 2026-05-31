import type { ContentImage } from '@/content';
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
  return (
    <article className="recent-writing-card">
      <a
        className="recent-writing-card__media"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Read ${title}`}
      >
        {image ? (
          <MediaPanel image={image} title={title} variant="writing" />
        ) : (
          <WritingPlaceholder />
        )}
      </a>
      <div className="recent-writing-card__body">
        <div className="catalogue-card__meta">
          {source}
          {date ? ` / ${date}` : ''}
        </div>
        <h3>
          <a href={href} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
        </h3>
        <p>{excerpt}</p>
        <a className="writing-read-link" href={href} target="_blank" rel="noopener noreferrer">
          Read -&gt;
        </a>
      </div>
    </article>
  );
}
